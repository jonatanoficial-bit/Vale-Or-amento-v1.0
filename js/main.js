// Main JavaScript for the quote generator
// This script handles loading configuration, building form components,
// collecting user data, calculating costs, generating persuasive text
// and creating a PDF with the jsPDF library. It is written as a module.

import { generatePitch } from './pitchAI.js';
import { createPDF } from './pdfGenerator.js';

// Global variables to hold pricing configuration and expansions
let pricingConfig = null;
let expansionData = {};

// Utility to fetch JSON files relative to the application root
async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Não foi possível carregar ${path}: ${response.statusText}`);
  return await response.json();
}

// Merge two pricing objects together (for expansions)
function mergePricing(base, addition) {
  const result = JSON.parse(JSON.stringify(base));
  if (addition.instrumentos) {
    result.instrumentos = { ...result.instrumentos, ...addition.instrumentos };
  }
  if (addition.servicos) {
    result.servicos = { ...result.servicos, ...addition.servicos };
  }
  if (addition.voz) {
    result.voz = addition.voz;
  }
  return result;
}

// Load base pricing and expansions
async function loadConfiguration() {
  // load base pricing
  pricingConfig = await fetchJSON('data/pricing.json');

  // load expansions from manifest
  try {
    const manifest = await fetchJSON('dlc/manifest.json');
    if (manifest && Array.isArray(manifest.expansions)) {
      for (const exp of manifest.expansions) {
        try {
          const data = await fetchJSON(`dlc/${exp.file}`);
          expansionData[exp.id] = data;
          pricingConfig = mergePricing(pricingConfig, data);
        } catch (e) {
          console.warn('Falha ao carregar expansão', exp, e);
        }
      }
    }
  } catch (e) {
    // Manifest may not exist; ignore
  }

  // load expansions from localStorage
  const stored = localStorage.getItem('valeExpansions');
  if (stored) {
    try {
      const storedExpansions = JSON.parse(stored);
      for (const key in storedExpansions) {
        pricingConfig = mergePricing(pricingConfig, storedExpansions[key]);
      }
    } catch (err) {
      console.error('Erro ao analisar expansões do localStorage', err);
    }
  }

  // Apply pricing override if present
  const overrideStr = localStorage.getItem('valePricingOverride');
  if (overrideStr) {
    try {
      const overridePricing = JSON.parse(overrideStr);
      pricingConfig = overridePricing;
    } catch (e) {
      console.error('Erro ao carregar tabela de preços customizada', e);
    }
  }
}

// Build the instrument list UI
function buildInstrumentList() {
  const container = document.getElementById('instrumentList');
  container.innerHTML = '';
  const instruments = pricingConfig.instrumentos;
  Object.keys(instruments).forEach((key) => {
    const instrument = instruments[key];
    const wrapper = document.createElement('div');
    wrapper.className = 'instrument-item';
    const label = document.createElement('label');
    label.textContent = instrument.label;
    label.setAttribute('for', `inst-${key}`);
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '0';
    qtyInput.value = '0';
    qtyInput.id = `inst-${key}`;
    qtyInput.name = `inst-${key}`;
    wrapper.appendChild(label);
    wrapper.appendChild(qtyInput);
    container.appendChild(wrapper);
  });
}

// Build the services list UI
function buildServiceList() {
  const container = document.getElementById('serviceList');
  container.innerHTML = '';
  const services = pricingConfig.servicos;
  Object.keys(services).forEach((key) => {
    const service = services[key];
    const wrapper = document.createElement('div');
    wrapper.className = 'service-item';
    const label = document.createElement('label');
    label.textContent = service.label;
    label.setAttribute('for', `srv-${key}`);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `srv-${key}`;
    checkbox.name = `srv-${key}`;
    wrapper.appendChild(label);
    wrapper.appendChild(checkbox);
    container.appendChild(wrapper);
  });
}

// Gather data from the form
function gatherFormData() {
  const form = document.getElementById('quoteForm');
  const formData = new FormData(form);
  const data = {
    client: {
      name: formData.get('clientName').trim(),
      email: formData.get('clientEmail').trim(),
      phone: formData.get('clientPhone')?.trim() || ''
    },
    productionType: formData.get('productionType'),
    vocals: parseInt(formData.get('vocals')) || 0,
    instruments: {},
    services: [],
    notes: formData.get('notes')?.trim() || ''
  };
  // gather instruments and quantities
  Object.keys(pricingConfig.instrumentos).forEach((key) => {
    const qty = parseInt(formData.get(`inst-${key}`)) || 0;
    if (qty > 0) {
      data.instruments[key] = qty;
    }
  });
  // gather services
  Object.keys(pricingConfig.servicos).forEach((key) => {
    const checked = formData.get(`srv-${key}`);
    if (checked) {
      data.services.push(key);
    }
  });
  return data;
}

// Calculate cost and build cost breakdown
function calculateCost(data) {
  let total = 0;
  const breakdown = [];
  // vocals
  if (data.vocals > 0) {
    const cost = pricingConfig.voz * data.vocals;
    total += cost;
    breakdown.push({ label: `${data.vocals} voz(es)`, value: cost });
  }
  // instruments
  Object.entries(data.instruments).forEach(([key, qty]) => {
    const instrument = pricingConfig.instrumentos[key];
    const cost = instrument.price * qty;
    total += cost;
    breakdown.push({ label: `${qty}× ${instrument.label}`, value: cost });
  });
  // services
  data.services.forEach((srvKey) => {
    const service = pricingConfig.servicos[srvKey];
    const cost = service.price;
    total += cost;
    breakdown.push({ label: service.label, value: cost });
  });
  return { total, breakdown };
}

// Format currency in Brazilian Real
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Update footer year
function updateCurrentYear() {
  const year = new Date().getFullYear();
  const yearSpan = document.getElementById('currentYear');
  const yearAdminSpan = document.getElementById('currentYearAdmin');
  if (yearSpan) yearSpan.textContent = year;
  if (yearAdminSpan) yearAdminSpan.textContent = year;
}

// Main initialization
async function init() {
  try {
    await loadConfiguration();
    buildInstrumentList();
    buildServiceList();
    updateCurrentYear();
  } catch (err) {
    console.error(err);
    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.hidden = false;
      feedback.textContent = 'Erro ao carregar configurações. Atualize a página ou verifique os arquivos.';
    }
  }
}

// Handle quote generation
async function handleGenerateQuote() {
  const button = document.getElementById('generateQuote');
  button.disabled = true;
  button.textContent = 'Gerando...';
  try {
    const data = gatherFormData();
    const { total, breakdown } = calculateCost(data);
    // Show total cost on the page
    const totalCostEl = document.getElementById('totalCost');
    if (totalCostEl) {
      totalCostEl.textContent = `Total estimado: ${formatCurrency(total)}`;
    }
    // Generate persuasive text
    const pitch = generatePitch(data, breakdown, total);
    // Generate PDF
    await createPDF(data, breakdown, total, pitch);
    // Provide feedback
    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.hidden = false;
      feedback.textContent = 'Orçamento gerado com sucesso! O download deve iniciar automaticamente.';
    }
  } catch (err) {
    console.error(err);
    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.hidden = false;
      feedback.style.color = '#ff7272';
      feedback.textContent = 'Ocorreu um erro ao gerar o orçamento. Tente novamente.';
    }
  } finally {
    button.disabled = false;
    button.textContent = 'Gerar Orçamento em PDF';
  }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  init();
  const genButton = document.getElementById('generateQuote');
  genButton?.addEventListener('click', () => handleGenerateQuote());
});