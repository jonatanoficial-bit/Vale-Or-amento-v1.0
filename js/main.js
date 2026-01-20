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

  // Ensure new categories exist (backwards compatibility)
  if (!pricingConfig.producao) pricingConfig.producao = {};
  if (!pricingConfig.edicao) pricingConfig.edicao = {};
  if (!pricingConfig.carreira) pricingConfig.carreira = {};
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
    productionService: formData.get('productionService') || 'none',
    careerPlan: formData.get('careerPlan') || 'none',
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
  // Serviço de produção (single ou IA)
  if (data.productionService && data.productionService !== 'none') {
    const prod = pricingConfig.producao?.[data.productionService];
    if (prod) {
      total += prod.price;
      breakdown.push({ key: `producao_${data.productionService}`, label: prod.label, value: prod.price });
    }
  }
  // Instrumentos
  Object.entries(data.instruments).forEach(([key, qty]) => {
    const instrument = pricingConfig.instrumentos[key];
    if (!instrument) return;
    // Custo de instrumento próprio (por exemplo, contratação de músico)
    const cost = instrument.price * qty;
    total += cost;
    breakdown.push({ key: `inst_${key}`, label: `${qty}× ${instrument.label}`, value: cost });
  });
  // Vocais (captura)
  if (data.vocals > 0) {
    const voiceCost = pricingConfig.voz * data.vocals;
    total += voiceCost;
    breakdown.push({ key: 'voz', label: `${data.vocals} voz(es) (captura)`, value: voiceCost });
  }
  // Edição de instrumentos e vozes (automática)
  if (data.vocals > 0) {
    const editVoiceCost = pricingConfig.edicao?.voz?.price * data.vocals || 0;
    if (editVoiceCost > 0) {
      total += editVoiceCost;
      breakdown.push({ key: 'edicao_voz', label: `Edição de vozes (${data.vocals})`, value: editVoiceCost });
    }
  }
  const totalInstruments = Object.values(data.instruments).reduce((acc, qty) => acc + qty, 0);
  if (totalInstruments > 0) {
    const editInstCost = pricingConfig.edicao?.instrumento?.price * totalInstruments || 0;
    if (editInstCost > 0) {
      total += editInstCost;
      breakdown.push({ key: 'edicao_instrumento', label: `Edição de instrumentos (${totalInstruments})`, value: editInstCost });
    }
  }
  // Serviços adicionais (convencionais)
  data.services.forEach((srvKey) => {
    const service = pricingConfig.servicos?.[srvKey];
    if (!service) return;
    const cost = service.price;
    total += cost;
    breakdown.push({ key: `srv_${srvKey}`, label: service.label, value: cost });
  });
  // Plano de carreira
  if (data.careerPlan && data.careerPlan !== 'none') {
    const plan = pricingConfig.carreira?.[data.careerPlan];
    if (plan) {
      total += plan.price;
      breakdown.push({ key: `carreira_${data.careerPlan}`, label: plan.label, value: plan.price });
    }
  }
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
  const nextButton = document.getElementById('nextButton');
  const backButton = document.getElementById('backButton');
  const confirmButton = document.getElementById('confirmButton');
  const discountTypeSelect = document.getElementById('discountType');
  const discountValueInput = document.getElementById('discountValue');

  nextButton?.addEventListener('click', () => {
    showReview();
  });

  backButton?.addEventListener('click', () => {
    // Return to form
    document.getElementById('reviewSection').hidden = true;
    document.getElementById('quoteForm').hidden = false;
    document.getElementById('feedback').hidden = true;
  });

  confirmButton?.addEventListener('click', async () => {
    await handleConfirm();
  });

  discountTypeSelect?.addEventListener('change', () => {
    const type = discountTypeSelect.value;
    if (type === 'none') {
      discountValueInput.disabled = true;
      discountValueInput.value = 0;
    } else {
      discountValueInput.disabled = false;
    }
    computeFinalTotal();
  });

  discountValueInput?.addEventListener('input', () => {
    computeFinalTotal();
  });
});

// Current quote state
let currentQuote = null;

// Show the review section with summary and discount options
function showReview() {
  const data = gatherFormData();
  const { total, breakdown } = calculateCost(data);
  currentQuote = { data, breakdown, subtotal: total };
  // Render breakdown in reviewContent
  const reviewContent = document.getElementById('reviewContent');
  reviewContent.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'review-list';
  breakdown.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.label}:</strong> ${formatCurrency(item.value)}`;
    list.appendChild(li);
  });
  // Subtotal display
  document.getElementById('subtotalDisplay').textContent = `Subtotal: ${formatCurrency(total)}`;
  reviewContent.appendChild(list);
  // Reset discount inputs
  const discountType = document.getElementById('discountType');
  const discountValue = document.getElementById('discountValue');
  discountType.value = 'none';
  discountValue.value = 0;
  discountValue.disabled = true;
  // Compute final total
  computeFinalTotal();
  // Show review section, hide form
  document.getElementById('quoteForm').hidden = true;
  document.getElementById('reviewSection').hidden = false;
  // Hide old feedback
  document.getElementById('feedback').hidden = true;
}

// Compute discount and final total, update UI
function computeFinalTotal() {
  if (!currentQuote) return;
  const discountType = document.getElementById('discountType').value;
  const discountValue = parseFloat(document.getElementById('discountValue').value) || 0;
  const subtotal = currentQuote.subtotal;
  let discountAmount = 0;
  if (discountType === 'value') {
    discountAmount = Math.min(discountValue, subtotal);
  } else if (discountType === 'percentage') {
    const percentage = discountValue / 100;
    discountAmount = subtotal * percentage;
  }
  const finalTotal = Math.max(0, subtotal - discountAmount);
  // Update info texts
  const discountInfoEl = document.getElementById('discountInfo');
  const finalTotalEl = document.getElementById('finalTotal');
  if (discountType === 'none' || discountAmount === 0) {
    discountInfoEl.textContent = '';
  } else {
    discountInfoEl.textContent = `Desconto aplicado: -${formatCurrency(discountAmount)}`;
  }
  finalTotalEl.textContent = `Total final: ${formatCurrency(finalTotal)}`;
  currentQuote.discount = { type: discountType, value: discountValue, amount: discountAmount };
  currentQuote.finalTotal = finalTotal;
}

// Handle confirmation (generate PDF)
async function handleConfirm() {
  if (!currentQuote) return;
  const button = document.getElementById('confirmButton');
  button.disabled = true;
  button.textContent = 'Gerando...';
  try {
    const { data, breakdown, discount, finalTotal, subtotal } = currentQuote;
    // Build breakdown including discount if applied
    const finalBreakdown = [...breakdown];
    if (discount && discount.amount > 0) {
      finalBreakdown.push({ key: 'discount', label: 'Desconto', value: -discount.amount });
    }
    // Total line will be drawn in PDF generator separately
    // Generate pitch using subtotal (original total) or final total? Use final total for investment message
    const pitch = generatePitch(data, finalBreakdown, finalTotal);
    // Call PDF generator
    await createPDF(data, finalBreakdown, finalTotal, pitch);
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
    const button2 = document.getElementById('confirmButton');
    button2.disabled = false;
    button2.textContent = 'Gerar PDF';
  }
}