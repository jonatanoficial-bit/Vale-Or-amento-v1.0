import {
  loadPricing,
  savePricingOverride,
  clearPricingOverride,
  exportPricing,
  importPricingJson,
  getLocalExpansions,
  saveLocalExpansions,
  getQuoteHistory,
  clearQuoteHistory,
  downloadCsv,
  getAdminPassword,
  setAdminPassword
} from "./dataStore.js";

let pricing = null;
let localExpansions = [];

const dom = {};

document.addEventListener("DOMContentLoaded", async () => {
  cacheDom();
  dom.currentYearAdmin.textContent = new Date().getFullYear();
  bindBaseEvents();

  try {
    pricing = await loadPricing();
    localExpansions = getLocalExpansions();
    applyMeta();
  } catch (error) {
    console.error(error);
    alert("Falha ao carregar a tabela administrativa.");
  }
});

function cacheDom() {
  dom.adminLogin = document.getElementById("adminLogin");
  dom.adminPanel = document.getElementById("adminPanel");
  dom.passwordInput = document.getElementById("adminPassword");
  dom.loginButton = document.getElementById("adminLoginButton");
  dom.loginError = document.getElementById("loginError");
  dom.meta = document.getElementById("adminMeta");
  dom.depositPercent = document.getElementById("depositPercent");
  dom.validityDays = document.getElementById("validityDays");
  dom.healthyFactor = document.getElementById("healthyFactor");
  dom.idealFactor = document.getElementById("idealFactor");
  dom.premiumFactor = document.getElementById("premiumFactor");
  dom.extraVoicePrice = document.getElementById("extraVoicePrice");
  dom.extraRevisionPrice = document.getElementById("extraRevisionPrice");
  dom.weekendSupportPrice = document.getElementById("weekendSupportPrice");
  dom.saveSettingsButton = document.getElementById("saveSettingsButton");
  dom.pricingTables = document.getElementById("pricingTables");
  dom.savePricingButton = document.getElementById("savePricingButton");
  dom.resetPricingButton = document.getElementById("resetPricingButton");
  dom.exportPricingBtn = document.getElementById("exportPricingBtn");
  dom.pricingFileInput = document.getElementById("pricingFileInput");
  dom.expansionList = document.getElementById("expansionList");
  dom.addExpansionBtn = document.getElementById("addExpansionBtn");
  dom.expansionModal = document.getElementById("expansionModal");
  dom.expansionModalTitle = document.getElementById("expansionModalTitle");
  dom.expansionName = document.getElementById("expansionName");
  dom.expansionJson = document.getElementById("expansionJson");
  dom.saveExpansionBtn = document.getElementById("saveExpansionBtn");
  dom.cancelExpansionBtn = document.getElementById("cancelExpansionBtn");
  dom.marketReferenceList = document.getElementById("marketReferenceList");
  dom.historyList = document.getElementById("historyList");
  dom.exportHistoryButton = document.getElementById("exportHistoryButton");
  dom.clearHistoryButton = document.getElementById("clearHistoryButton");
  dom.newPassword = document.getElementById("newPassword");
  dom.confirmPassword = document.getElementById("confirmPassword");
  dom.changePasswordButton = document.getElementById("changePasswordButton");
  dom.logoutBtn = document.getElementById("logoutBtn");
  dom.currentYearAdmin = document.getElementById("currentYearAdmin");
  dom.footerBuildInfoAdmin = document.getElementById("footerBuildInfoAdmin");
  dom.versionNodes = document.querySelectorAll("[data-version]");
  dom.buildNodes = document.querySelectorAll("[data-build]");
}

function bindBaseEvents() {
  dom.loginButton.addEventListener("click", handleLogin);
  dom.passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleLogin();
  });
  dom.logoutBtn.addEventListener("click", () => {
    dom.adminPanel.hidden = true;
    dom.adminLogin.hidden = false;
  });
}

function handleLogin() {
  if (dom.passwordInput.value === getAdminPassword()) {
    dom.loginError.hidden = true;
    dom.adminLogin.hidden = true;
    dom.adminPanel.hidden = false;
    hydrateAdmin();
  } else {
    dom.loginError.hidden = false;
  }
}

function applyMeta() {
  dom.versionNodes.forEach((node) => (node.textContent = pricing.meta.version));
  dom.buildNodes.forEach((node) => (node.textContent = pricing.meta.build));
  dom.footerBuildInfoAdmin.textContent = `Versão ${pricing.meta.version} • Build ${pricing.meta.build} • ${pricing.meta.builtAt}`;
}

function hydrateAdmin() {
  renderMeta();
  hydrateSettings();
  renderPricingTables();
  renderExpansions();
  renderMarketReferences();
  renderHistory();
  bindAdminEvents();
}

function bindAdminEvents() {
  dom.saveSettingsButton.onclick = saveSettings;
  dom.savePricingButton.onclick = savePricingChanges;
  dom.resetPricingButton.onclick = async () => {
    clearPricingOverride();
    pricing = await loadPricing();
    hydrateAdmin();
  };
  dom.exportPricingBtn.onclick = () => exportPricing(pricing);
  dom.pricingFileInput.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importPricingJson(file);
      savePricingOverride(imported);
      pricing = await loadPricing();
      hydrateAdmin();
      alert("Tabela importada com sucesso.");
    } catch {
      alert("JSON inválido.");
    }
  };
  dom.addExpansionBtn.onclick = openExpansionModal;
  dom.cancelExpansionBtn.onclick = closeExpansionModal;
  dom.saveExpansionBtn.onclick = saveExpansion;
  dom.exportHistoryButton.onclick = exportHistory;
  dom.clearHistoryButton.onclick = () => {
    if (!confirm("Tem certeza que deseja limpar o histórico local?")) return;
    clearQuoteHistory();
    renderHistory();
  };
  dom.changePasswordButton.onclick = changePassword;
}

function renderMeta() {
  dom.meta.innerHTML = `
    <div class="meta-pill"><span>App</span><strong>${pricing.meta.appName}</strong></div>
    <div class="meta-pill"><span>Estratégia</span><strong>${pricing.meta.strategy}</strong></div>
    <div class="meta-pill"><span>Versão</span><strong>${pricing.meta.version}</strong></div>
    <div class="meta-pill"><span>Build</span><strong>${pricing.meta.build}</strong></div>
    <div class="meta-pill"><span>Atualizado em</span><strong>${pricing.meta.builtAt}</strong></div>
    <div class="meta-pill"><span>Senha ativa</span><strong>Personalizável</strong></div>
  `;
}

function hydrateSettings() {
  dom.depositPercent.value = pricing.settings.depositPercent;
  dom.validityDays.value = pricing.settings.validityDays;
  dom.healthyFactor.value = pricing.settings.healthyFactor;
  dom.idealFactor.value = pricing.settings.idealFactor;
  dom.premiumFactor.value = pricing.settings.premiumFactor;
  dom.extraVoicePrice.value = pricing.settings.extraVoicePrice;
  dom.extraRevisionPrice.value = pricing.settings.extraRevisionPrice;
  dom.weekendSupportPrice.value = pricing.settings.weekendSupportPrice;
}

function renderPricingTables() {
  dom.pricingTables.innerHTML = `
    ${renderTableCard("Pacotes", pricing.packages, "package")}
    ${renderTableCard("Instrumentos / elementos", pricing.instruments, "instrument")}
    ${renderTableCard("Serviços adicionais", pricing.services, "service")}
  `;
}

function renderTableCard(title, data, type) {
  return `
    <div class="admin-table-card">
      <h3>${title}</h3>
      <div class="table-scroll">
        <table class="price-table">
          <thead>
            <tr><th>Item</th><th>Descrição</th><th>Preço (R$)</th></tr>
          </thead>
          <tbody>
            ${Object.entries(data)
              .map(([id, item]) => `
                <tr>
                  <td>${item.label}</td>
                  <td>${item.description || item.category || item.unit || "-"}</td>
                  <td><input type="number" step="1" min="0" data-price-type="${type}" data-price-id="${id}" value="${item.basePrice ?? item.price}" /></td>
                </tr>`)
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function saveSettings() {
  const override = {
    settings: {
      depositPercent: Number(dom.depositPercent.value),
      validityDays: Number(dom.validityDays.value),
      healthyFactor: Number(dom.healthyFactor.value),
      idealFactor: Number(dom.idealFactor.value),
      premiumFactor: Number(dom.premiumFactor.value),
      extraVoicePrice: Number(dom.extraVoicePrice.value),
      extraRevisionPrice: Number(dom.extraRevisionPrice.value),
      weekendSupportPrice: Number(dom.weekendSupportPrice.value)
    }
  };
  savePricingOverride(override);
  pricing = mergePricing(pricing, override);
  alert("Parâmetros comerciais salvos.");
}

function savePricingChanges() {
  const override = { packages: {}, instruments: {}, services: {} };
  dom.pricingTables.querySelectorAll("[data-price-id]").forEach((input) => {
    const type = input.dataset.priceType;
    const id = input.dataset.priceId;
    const value = Number(input.value || 0);
    if (type === "package") {
      override.packages[id] = { basePrice: value };
    } else if (type === "instrument") {
      override.instruments[id] = { price: value };
    } else {
      override.services[id] = { price: value };
    }
  });
  savePricingOverride(override);
  pricing = mergePricing(pricing, override);
  alert("Tabela de preços salva.");
}

function renderExpansions() {
  if (!localExpansions.length) {
    dom.expansionList.innerHTML = '<div class="expansion-card">Nenhuma expansão local cadastrada.</div>';
    return;
  }

  dom.expansionList.innerHTML = localExpansions
    .map((expansion, index) => `
      <div class="expansion-card">
        <div class="footer-inline">
          <strong>${expansion.name}</strong>
          <button class="secondary-btn" data-remove-expansion="${index}">Remover</button>
        </div>
        <pre>${escapeHtml(JSON.stringify(expansion.payload, null, 2))}</pre>
      </div>`)
    .join("");

  dom.expansionList.querySelectorAll("[data-remove-expansion]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.removeExpansion);
      localExpansions.splice(index, 1);
      saveLocalExpansions(localExpansions);
      renderExpansions();
    });
  });
}

function openExpansionModal() {
  dom.expansionModal.hidden = false;
  dom.expansionName.value = "";
  dom.expansionJson.value = "";
}

function closeExpansionModal() {
  dom.expansionModal.hidden = true;
}

function saveExpansion() {
  try {
    const payload = JSON.parse(dom.expansionJson.value);
    localExpansions.push({ name: dom.expansionName.value.trim() || "Expansão", payload });
    saveLocalExpansions(localExpansions);
    closeExpansionModal();
    renderExpansions();
    alert("Expansão salva.");
  } catch {
    alert("JSON da expansão é inválido.");
  }
}

function renderMarketReferences() {
  dom.marketReferenceList.innerHTML = pricing.marketReferences
    .map((item) => `
      <div class="reference-card">
        <div>
          <strong>${item.source}</strong>
          <p>${item.summary}</p>
        </div>
        <span class="badge">${item.positioning}</span>
      </div>`)
    .join("");
}

function renderHistory() {
  const history = getQuoteHistory();
  if (!history.length) {
    dom.historyList.innerHTML = '<div class="history-item">Nenhum orçamento gerado neste navegador ainda.</div>';
    return;
  }

  dom.historyList.innerHTML = history
    .map((entry) => `
      <div class="history-item">
        <div>
          <strong>${entry.number}</strong>
          <p>${escapeHtml(entry.client)} ${entry.artist ? `• ${escapeHtml(entry.artist)}` : ""}</p>
          <small>${escapeHtml(entry.packageLabel)} • ${escapeHtml(entry.profileLabel)}</small>
        </div>
        <div>
          <strong>${escapeHtml(entry.finalValue)}</strong>
          <p><small>${escapeHtml(entry.generatedAt)}</small></p>
        </div>
      </div>`)
    .join("");
}

function exportHistory() {
  const history = getQuoteHistory();
  if (!history.length) {
    alert("Nenhum orçamento no histórico.");
    return;
  }
  const rows = [
    ["numero", "data", "cliente", "artista", "pacote", "perfil", "valor_final", "valor_base", "desconto"],
    ...history.map((item) => [item.number, item.generatedAt, item.client, item.artist, item.packageLabel, item.profileLabel, item.finalValue, item.profileValue, item.discount])
  ];
  downloadCsv("vale-historico-orcamentos.csv", rows);
}

function changePassword() {
  const password = dom.newPassword.value;
  const confirmPassword = dom.confirmPassword.value;
  if (!password || password.length < 6) {
    alert("A nova senha precisa ter pelo menos 6 caracteres.");
    return;
  }
  if (password !== confirmPassword) {
    alert("As senhas não coincidem.");
    return;
  }
  setAdminPassword(password);
  dom.newPassword.value = "";
  dom.confirmPassword.value = "";
  alert("Senha atualizada com sucesso.");
}

function mergePricing(base, override) {
  const result = structuredClone(base);
  for (const [section, values] of Object.entries(override)) {
    if (typeof values !== "object" || Array.isArray(values)) {
      result[section] = values;
      continue;
    }
    result[section] = result[section] || {};
    for (const [id, payload] of Object.entries(values)) {
      if (typeof payload !== "object" || Array.isArray(payload)) {
        result[section][id] = payload;
      } else {
        result[section][id] = { ...(result[section][id] || {}), ...payload };
      }
    }
  }
  return result;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
