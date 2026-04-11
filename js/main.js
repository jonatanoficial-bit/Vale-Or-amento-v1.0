import { loadPricing, pushQuoteHistory } from "./dataStore.js";
import { buildPitch } from "./pitchAI.js";
import { generateQuotePdf } from "./pdfGenerator.js";

const state = {
  pricing: null,
  latestCalculation: null,
  latestQuote: null
};

const dom = {};

document.addEventListener("DOMContentLoaded", async () => {
  cacheDom();
  dom.currentYear.textContent = new Date().getFullYear();
  bindEvents();

  try {
    state.pricing = await loadPricing();
    applyMetaToUi(state.pricing);
    renderPackages();
    renderInstruments();
    renderServices();
    updateSummary();
  } catch (error) {
    console.error(error);
    alert("Falha ao carregar a tabela de preços. Verifique os arquivos do projeto.");
  }
});

function cacheDom() {
  dom.form = document.getElementById("quoteForm");
  dom.packageSelect = document.getElementById("packageSelect");
  dom.songCount = document.getElementById("songCount");
  dom.productionType = document.getElementById("productionType");
  dom.priorityLevel = document.getElementById("priorityLevel");
  dom.releaseGoal = document.getElementById("releaseGoal");
  dom.vocals = document.getElementById("vocals");
  dom.partnerStudioHours = document.getElementById("partnerStudioHours");
  dom.revisionRounds = document.getElementById("revisionRounds");
  dom.instrumentList = document.getElementById("instrumentList");
  dom.serviceGroups = document.getElementById("serviceGroups");
  dom.summaryState = document.getElementById("summaryState");
  dom.summaryGrid = document.getElementById("summaryGrid");
  dom.healthyFloorDisplay = document.getElementById("healthyFloorDisplay");
  dom.idealPriceDisplay = document.getElementById("idealPriceDisplay");
  dom.premiumPriceDisplay = document.getElementById("premiumPriceDisplay");
  dom.summaryDetail = document.getElementById("summaryDetail");
  dom.actionIdealValue = document.getElementById("actionIdealValue");
  dom.reviewButton = document.getElementById("reviewButton");
  dom.reviewSection = document.getElementById("reviewSection");
  dom.reviewContent = document.getElementById("reviewContent");
  dom.reviewSubtotal = document.getElementById("reviewSubtotal");
  dom.reviewDiscount = document.getElementById("reviewDiscount");
  dom.reviewTotal = document.getElementById("reviewTotal");
  dom.depositDisplay = document.getElementById("depositDisplay");
  dom.paymentBreakdown = document.getElementById("paymentBreakdown");
  dom.discountType = document.getElementById("discountType");
  dom.discountValue = document.getElementById("discountValue");
  dom.quoteProfile = document.getElementById("quoteProfile");
  dom.paymentTemplate = document.getElementById("paymentTemplate");
  dom.backButton = document.getElementById("backButton");
  dom.generatePdfButton = document.getElementById("generatePdfButton");
  dom.warningBox = document.getElementById("warningBox");
  dom.currentYear = document.getElementById("currentYear");
  dom.footerBuildInfo = document.getElementById("footerBuildInfo");
  dom.depositBadge = document.querySelector("[data-deposit-badge]");
  dom.validityBadge = document.querySelector("[data-validity-badge]");
  dom.versionNodes = document.querySelectorAll("[data-version]");
  dom.buildNodes = document.querySelectorAll("[data-build]");
}

function bindEvents() {
  document.addEventListener("input", (event) => {
    if (event.target.closest("#quoteForm") || event.target.closest("#reviewSection")) {
      updateSummary();
      if (!dom.reviewSection.hidden) renderReview();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.closest("#quoteForm") || event.target.closest("#reviewSection")) {
      if (event.target === dom.discountType) {
        dom.discountValue.disabled = event.target.value === "none";
        if (event.target.value === "none") dom.discountValue.value = 0;
      }
      updateSummary();
      if (!dom.reviewSection.hidden) renderReview();
    }
  });

  dom.reviewButton.addEventListener("click", () => {
    if (!dom.form.reportValidity()) return;
    renderReview();
    dom.reviewSection.hidden = false;
    dom.reviewSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  dom.backButton.addEventListener("click", () => {
    dom.reviewSection.hidden = true;
    dom.reviewButton.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  dom.generatePdfButton.addEventListener("click", () => {
    if (!state.latestQuote) return;
    const quote = buildQuotePayload();
    state.latestQuote = quote;
    pushQuoteHistory({
      number: quote.number,
      generatedAt: quote.meta.generatedAt,
      client: quote.client.name,
      artist: quote.client.artistName || "",
      packageLabel: quote.packageInfo.label,
      profileLabel: quote.calculations.profileLabel,
      finalValue: quote.calculations.finalTotalFormatted,
      profileValue: quote.calculations.profileValueFormatted,
      discount: quote.calculations.discountFormatted
    });
    generateQuotePdf(quote);
  });
}

function applyMetaToUi(pricing) {
  dom.versionNodes.forEach((node) => {
    node.textContent = pricing.meta.version;
  });
  dom.buildNodes.forEach((node) => {
    node.textContent = pricing.meta.build;
  });
  dom.footerBuildInfo.textContent = `Versão ${pricing.meta.version} • Build ${pricing.meta.build} • ${pricing.meta.builtAt}`;
  dom.depositBadge.textContent = `${pricing.settings.depositPercent}%`;
  dom.validityBadge.textContent = `${pricing.settings.validityDays} dias`;
}

function renderPackages() {
  const options = Object.entries(state.pricing.packages)
    .map(([id, pack]) => `<option value="${id}">${pack.label} - ${formatCurrency(pack.basePrice)}</option>`)
    .join("");
  dom.packageSelect.innerHTML = options;
}

function renderInstruments() {
  dom.instrumentList.innerHTML = Object.entries(state.pricing.instruments)
    .map(([id, item]) => `
      <div class="selection-item">
        <input type="checkbox" class="toggle instrument-toggle" data-instrument-id="${id}" id="instrument-${id}" />
        <div class="item-meta">
          <label class="item-title" for="instrument-${id}">${item.label}</label>
          <div class="item-price">${formatCurrency(item.price)} • ${item.description || "Elemento adicional de produção"}</div>
        </div>
        <div class="inline-input">
          <label for="instrument-qty-${id}">Qtd.</label>
          <input type="number" id="instrument-qty-${id}" data-instrument-qty="${id}" min="1" value="1" disabled />
        </div>
      </div>`)
    .join("");

  dom.instrumentList.querySelectorAll(".instrument-toggle").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const qty = dom.instrumentList.querySelector(`[data-instrument-qty="${checkbox.dataset.instrumentId}"]`);
      qty.disabled = !checkbox.checked;
      if (!checkbox.checked) qty.value = 1;
      updateSummary();
    });
  });
}

function renderServices() {
  const grouped = {};
  Object.entries(state.pricing.services).forEach(([id, service]) => {
    const category = service.category || "Outros";
    grouped[category] = grouped[category] || [];
    grouped[category].push({ id, ...service });
  });

  dom.serviceGroups.innerHTML = Object.entries(grouped)
    .map(([category, items]) => `
      <div class="service-group">
        <h3>${category}</h3>
        <div class="service-group-grid">
          ${items
            .map(
              (service) => `
              <div class="service-item">
                <input type="checkbox" class="toggle service-toggle" data-service-id="${service.id}" id="service-${service.id}" />
                <div class="item-meta">
                  <label class="item-title" for="service-${service.id}">${service.label}</label>
                  <div class="item-price">${formatCurrency(service.price)} / ${service.unit || "item"}</div>
                </div>
                <div class="inline-input">
                  <label for="service-qty-${service.id}">Qtd.</label>
                  <input type="number" id="service-qty-${service.id}" data-service-qty="${service.id}" min="1" value="1" disabled />
                </div>
              </div>`
            )
            .join("")}
        </div>
      </div>`)
    .join("");

  dom.serviceGroups.querySelectorAll(".service-toggle").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const qty = dom.serviceGroups.querySelector(`[data-service-qty="${checkbox.dataset.serviceId}"]`);
      qty.disabled = !checkbox.checked;
      if (!checkbox.checked) qty.value = 1;
      updateSummary();
    });
  });
}

function collectSelections() {
  const packageId = dom.packageSelect.value;
  const packageInfo = state.pricing.packages[packageId];
  const songCount = clampNumber(dom.songCount.value, 1);
  const productionType = dom.productionType.value;
  const priorityLevel = dom.priorityLevel.value;
  const releaseGoal = dom.releaseGoal.value;
  const vocals = clampNumber(dom.vocals.value, 0);
  const partnerStudioHours = clampNumber(dom.partnerStudioHours.value, 0);
  const revisionRounds = clampNumber(dom.revisionRounds.value, 0);

  const selectedInstruments = [];
  dom.instrumentList.querySelectorAll(".instrument-toggle:checked").forEach((checkbox) => {
    const id = checkbox.dataset.instrumentId;
    const qtyInput = dom.instrumentList.querySelector(`[data-instrument-qty="${id}"]`);
    const qty = clampNumber(qtyInput?.value, 1);
    selectedInstruments.push({ id, qty, ...state.pricing.instruments[id] });
  });

  const selectedServices = [];
  dom.serviceGroups.querySelectorAll(".service-toggle:checked").forEach((checkbox) => {
    const id = checkbox.dataset.serviceId;
    const qtyInput = dom.serviceGroups.querySelector(`[data-service-qty="${id}"]`);
    const qty = clampNumber(qtyInput?.value, 1);
    selectedServices.push({ id, qty, ...state.pricing.services[id] });
  });

  return {
    packageId,
    packageInfo,
    songCount,
    productionType,
    priorityLevel,
    releaseGoal,
    vocals,
    partnerStudioHours,
    revisionRounds,
    selectedInstruments,
    selectedServices
  };
}

function calculateQuote() {
  if (!state.pricing) return null;

  const selection = collectSelections();
  const settings = state.pricing.settings;
  const breakdown = [];

  let idealSubtotal = 0;

  let packageValue = selection.packageInfo.basePrice;
  if (selection.packageInfo.pricingMode === "per_song") {
    packageValue = selection.packageInfo.basePrice * selection.songCount;
  } else if (selection.packageInfo.pricingMode === "project") {
    const includedSongs = selection.packageInfo.includedSongs || 1;
    const extraSongs = Math.max(0, selection.songCount - includedSongs);
    packageValue = selection.packageInfo.basePrice + extraSongs * (selection.packageInfo.extraSongPrice || 0);
  }
  breakdown.push({ label: `${selection.packageInfo.label}${selection.songCount > 1 ? ` (${selection.songCount} faixas)` : ""}`, value: packageValue });
  idealSubtotal += packageValue;

  const extraVoices = Math.max(0, selection.vocals - (selection.packageInfo.includedVoices || 1));
  if (extraVoices > 0) {
    const value = extraVoices * settings.extraVoicePrice * Math.max(1, selection.songCount);
    breakdown.push({ label: `Vozes adicionais (${extraVoices}x)`, value });
    idealSubtotal += value;
  }

  if (selection.partnerStudioHours > 0) {
    const value = selection.partnerStudioHours * (state.pricing.services.captacao_hora?.price || 0);
    breakdown.push({ label: `Captação em estúdio parceiro (${selection.partnerStudioHours}h)`, value });
    idealSubtotal += value;
  }

  if (selection.revisionRounds > 0) {
    const value = selection.revisionRounds * settings.extraRevisionPrice;
    breakdown.push({ label: `Revisões extras (${selection.revisionRounds}x)`, value });
    idealSubtotal += value;
  }

  selection.selectedInstruments.forEach((item) => {
    const value = item.qty * item.price * Math.max(1, selection.songCount);
    breakdown.push({ label: `${item.label} (${item.qty}x)`, value });
    idealSubtotal += value;
  });

  selection.selectedServices.forEach((item) => {
    const multiplier = ["faixa", "música"].includes((item.unit || "").toLowerCase()) ? selection.songCount : 1;
    const value = item.qty * item.price * multiplier;
    breakdown.push({ label: `${item.label} (${item.qty}x)`, value });
    idealSubtotal += value;
  });

  const complexityMultiplier = state.pricing.settings.complexityMultipliers[selection.productionType] || 1;
  const priorityMultiplier = state.pricing.settings.priorityMultipliers[selection.priorityLevel] || 1;
  const adjustedIdeal = roundCurrency(idealSubtotal * complexityMultiplier * priorityMultiplier * settings.idealFactor);
  const healthyFloor = roundCurrency(adjustedIdeal * settings.healthyFactor);
  const premiumValue = roundCurrency(adjustedIdeal * settings.premiumFactor);

  return {
    ...selection,
    breakdown,
    idealSubtotal: roundCurrency(idealSubtotal),
    adjustedIdeal,
    healthyFloor,
    premiumValue,
    complexityMultiplier,
    priorityMultiplier,
    formattedSubtotal: formatCurrency(roundCurrency(idealSubtotal)),
    formattedIdeal: formatCurrency(adjustedIdeal),
    formattedHealthyFloor: formatCurrency(healthyFloor),
    formattedPremium: formatCurrency(premiumValue)
  };
}

function updateSummary() {
  const calculation = calculateQuote();
  state.latestCalculation = calculation;

  if (!calculation) return;

  dom.summaryGrid.hidden = false;
  dom.summaryState.hidden = true;
  dom.healthyFloorDisplay.textContent = calculation.formattedHealthyFloor;
  dom.idealPriceDisplay.textContent = calculation.formattedIdeal;
  dom.premiumPriceDisplay.textContent = calculation.formattedPremium;
  dom.actionIdealValue.textContent = calculation.formattedIdeal;
  dom.summaryDetail.innerHTML = `
    <div class="payment-line"><span>Pacote base</span><strong>${calculation.packageInfo.label}</strong></div>
    <div class="payment-line"><span>Subtotal dos itens</span><strong>${calculation.formattedSubtotal}</strong></div>
    <div class="payment-line"><span>Complexidade</span><strong>${multiplierLabel(calculation.complexityMultiplier)}</strong></div>
    <div class="payment-line"><span>Prazo</span><strong>${multiplierLabel(calculation.priorityMultiplier)}</strong></div>
    <div class="payment-line"><span>Faixas / vozes</span><strong>${calculation.songCount} / ${calculation.vocals}</strong></div>
  `;
}

function renderReview() {
  const quote = buildQuotePayload();
  state.latestQuote = quote;

  dom.reviewContent.innerHTML = `
    <div class="review-panel">
      <h3>Escopo resumido</h3>
      <div class="payment-line"><span>Cliente</span><strong>${escapeHtml(quote.client.name)}</strong></div>
      <div class="payment-line"><span>Projeto</span><strong>${escapeHtml(quote.client.artistName || quote.client.name)}</strong></div>
      <div class="payment-line"><span>Pacote</span><strong>${escapeHtml(quote.packageInfo.label)}</strong></div>
      <div class="payment-line"><span>Objetivo</span><strong>${escapeHtml(quote.client.releaseGoalLabel)}</strong></div>
      <div class="payment-line"><span>Prioridade</span><strong>${escapeHtml(quote.client.priorityLabel)}</strong></div>
    </div>
    <div class="review-panel">
      <h3>Composição do valor</h3>
      <div class="table-scroll">
        <table class="breakdown-table">
          <thead>
            <tr><th>Item</th><th>Valor</th></tr>
          </thead>
          <tbody>
            ${quote.breakdown.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${item.formattedValue}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
    <div class="review-panel">
      <h3>Faixas de decisão</h3>
      <div class="payment-line"><span>Piso saudável</span><strong>${quote.calculations.healthyFloorFormatted}</strong></div>
      <div class="payment-line"><span>Valor ideal Vale</span><strong>${quote.calculations.idealFormatted}</strong></div>
      <div class="payment-line"><span>Referência premium</span><strong>${quote.calculations.premiumFormatted}</strong></div>
      <div class="payment-line"><span>Perfil selecionado</span><strong>${quote.calculations.profileLabel}</strong></div>
    </div>
    <div class="review-panel">
      <h3>Lógica da proposta</h3>
      <p>${escapeHtml(quote.pitch)}</p>
    </div>
  `;

  dom.reviewSubtotal.textContent = quote.calculations.profileValueFormatted;
  dom.reviewDiscount.textContent = quote.calculations.discountFormatted;
  dom.reviewTotal.textContent = quote.calculations.finalTotalFormatted;
  dom.depositDisplay.textContent = quote.calculations.depositFormatted;
  dom.paymentBreakdown.innerHTML = quote.paymentPlan.map((line) => `<div class="payment-line"><span>${escapeHtml(line.label)}</span><strong>${escapeHtml(line.value)}</strong></div>`).join("");

  if (quote.calculations.isBelowHealthyFloor) {
    dom.warningBox.hidden = false;
    dom.warningBox.textContent = `Atenção: o valor final (${quote.calculations.finalTotalFormatted}) ficou abaixo do piso saudável (${quote.calculations.healthyFloorFormatted}). Use esse desconto apenas em situação excepcional.`;
  } else {
    dom.warningBox.hidden = true;
  }
}

function buildQuotePayload() {
  const calculation = state.latestCalculation || calculateQuote();
  const client = {
    name: document.getElementById("clientName").value.trim(),
    artistName: document.getElementById("clientArtistName").value.trim(),
    email: document.getElementById("clientEmail").value.trim(),
    phone: document.getElementById("clientPhone").value.trim(),
    segment: document.getElementById("clientSegment").value,
    segmentLabel: getSelectedLabel("clientSegment"),
    salesChannel: document.getElementById("salesChannel").value,
    salesChannelLabel: getSelectedLabel("salesChannel"),
    songCount: calculation.songCount,
    productionType: calculation.productionType,
    productionTypeLabel: getSelectedLabel("productionType"),
    priorityLevel: calculation.priorityLevel,
    priorityLabel: getSelectedLabel("priorityLevel"),
    releaseGoal: calculation.releaseGoal,
    releaseGoalLabel: getSelectedLabel("releaseGoal"),
    vocals: calculation.vocals,
    partnerStudioHours: calculation.partnerStudioHours,
    revisionRounds: calculation.revisionRounds,
    references: document.getElementById("references").value.trim(),
    notes: document.getElementById("notes").value.trim()
  };

  const discountType = dom.discountType.value;
  const discountValueInput = clampNumber(dom.discountValue.value, 0);
  const selectedProfile = dom.quoteProfile.value;
  const profileMap = {
    healthy: {
      label: "Piso saudável",
      value: calculation.healthyFloor
    },
    premium: {
      label: "Referência premium",
      value: calculation.premiumValue
    },
    ideal: {
      label: "Valor ideal Vale",
      value: calculation.adjustedIdeal
    }
  };
  const profile = profileMap[selectedProfile] || profileMap.ideal;

  let discount = 0;
  if (discountType === "value") {
    discount = discountValueInput;
  } else if (discountType === "percentage") {
    discount = roundCurrency(profile.value * (discountValueInput / 100));
  }
  discount = Math.min(discount, profile.value);
  const finalTotal = roundCurrency(Math.max(0, profile.value - discount));
  const depositPercent = dom.paymentTemplate.value === "standard"
    ? state.pricing.settings.depositPercent
    : dom.paymentTemplate.value === "half"
      ? 50
      : state.pricing.settings.depositPercent;
  const deposit = roundCurrency(finalTotal * (depositPercent / 100));
  const balance = roundCurrency(finalTotal - deposit);

  const paymentPlan = buildPaymentPlan(finalTotal, deposit, balance, dom.paymentTemplate.value);
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + state.pricing.settings.validityDays);
  const number = generateQuoteNumber(now);

  const quote = {
    number,
    issueDate: formatDate(now),
    validUntil: formatDate(validUntil),
    client,
    packageInfo: calculation.packageInfo,
    breakdown: calculation.breakdown.map((item) => ({ ...item, formattedValue: formatCurrency(item.value) })),
    selections: {
      instrumentLabels: calculation.selectedInstruments.map((item) => item.label),
      serviceLabels: calculation.selectedServices.map((item) => item.label)
    },
    calculations: {
      subtotal: calculation.idealSubtotal,
      subtotalFormatted: calculation.formattedSubtotal,
      healthyFloor: calculation.healthyFloor,
      healthyFloorFormatted: calculation.formattedHealthyFloor,
      ideal: calculation.adjustedIdeal,
      idealFormatted: calculation.formattedIdeal,
      premium: calculation.premiumValue,
      premiumFormatted: calculation.formattedPremium,
      profileLabel: profile.label,
      profileValue: profile.value,
      profileValueFormatted: formatCurrency(profile.value),
      discount,
      discountFormatted: formatCurrency(discount),
      finalTotal,
      finalTotalFormatted: formatCurrency(finalTotal),
      deposit,
      depositFormatted: formatCurrency(deposit),
      balance,
      balanceFormatted: formatCurrency(balance),
      isBelowHealthyFloor: finalTotal < calculation.healthyFloor
    },
    paymentPlan,
    meta: {
      version: state.pricing.meta.version,
      build: state.pricing.meta.build,
      appName: state.pricing.meta.appName,
      footerNote: state.pricing.settings.footerNote,
      generatedAt: `${formatDate(now)} ${now.toLocaleTimeString("pt-BR")}`
    }
  };

  quote.pitch = buildPitch(quote);
  return quote;
}

function buildPaymentPlan(finalTotal, deposit, balance, template) {
  switch (template) {
    case "half":
      return [
        { label: "Entrada na aprovação", value: formatCurrency(roundCurrency(finalTotal / 2)) },
        { label: "Saldo na entrega final", value: formatCurrency(roundCurrency(finalTotal - roundCurrency(finalTotal / 2))) }
      ];
    case "pix3": {
      const first = deposit;
      const remaining = roundCurrency(finalTotal - first);
      const installment = roundCurrency(remaining / 3);
      const lastInstallment = roundCurrency(remaining - installment * 2);
      return [
        { label: `Entrada (${state.pricing.settings.depositPercent}%)`, value: formatCurrency(first) },
        { label: "Parcela 1 do saldo", value: formatCurrency(installment) },
        { label: "Parcela 2 do saldo", value: formatCurrency(installment) },
        { label: "Parcela 3 do saldo", value: formatCurrency(lastInstallment) }
      ];
    }
    case "custom":
      return [
        { label: "Condição personalizada", value: "Definir na negociação" },
        { label: "Sugestão-base", value: `${state.pricing.settings.depositPercent}% na aprovação e saldo na entrega` }
      ];
    default:
      return [
        { label: `Sinal (${state.pricing.settings.depositPercent}%)`, value: formatCurrency(deposit) },
        { label: "Saldo na entrega", value: formatCurrency(balance) }
      ];
  }
}

function generateQuoteNumber(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${state.pricing.meta.quotePrefix || "VP"}-${yyyy}${mm}${dd}-${hh}${min}`;
}

function multiplierLabel(value) {
  return `${value.toFixed(2).replace(".", ",")}x`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: state.pricing?.meta?.currency || "BRL"
  }).format(value || 0);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampNumber(value, min) {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < min) return min;
  return numeric;
}

function getSelectedLabel(selectId) {
  const select = document.getElementById(selectId);
  return select.options[select.selectedIndex]?.textContent || "";
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
