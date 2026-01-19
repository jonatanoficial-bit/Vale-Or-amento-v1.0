// admin.js
// Script para gerenciar a área administrativa do aplicativo.
// Permite login simples, gerenciamento de expansões (DLC) e exportação/importação de preços.

// Quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  // Elementos
  const loginCard = document.getElementById('adminLogin');
  const adminPanel = document.getElementById('adminPanel');
  const loginButton = document.getElementById('adminLoginButton');
  const passwordInput = document.getElementById('adminPassword');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const addExpansionBtn = document.getElementById('addExpansionBtn');
  const expansionModal = document.getElementById('expansionModal');
  const expansionNameInput = document.getElementById('expansionName');
  const expansionJsonInput = document.getElementById('expansionJson');
  const saveExpansionBtn = document.getElementById('saveExpansionBtn');
  const cancelExpansionBtn = document.getElementById('cancelExpansionBtn');
  const expansionList = document.getElementById('expansionList');
  const exportPricingBtn = document.getElementById('exportPricingBtn');
  const pricingFileInput = document.getElementById('pricingFileInput');

  // Set default password if not present
  if (!localStorage.getItem('valeAdminPassword')) {
    localStorage.setItem('valeAdminPassword', 'admin123');
  }

  // Login handler
  loginButton?.addEventListener('click', () => {
    const entered = passwordInput.value.trim();
    const saved = localStorage.getItem('valeAdminPassword');
    if (entered === saved) {
      // login success
      loginCard.hidden = true;
      adminPanel.hidden = false;
      loadExpansionsUI();
    } else {
      loginError.hidden = false;
    }
  });

  // Logout handler
  logoutBtn?.addEventListener('click', () => {
    adminPanel.hidden = true;
    loginCard.hidden = false;
    passwordInput.value = '';
    loginError.hidden = true;
  });

  // Load expansions into list
  function loadExpansionsUI() {
    expansionList.innerHTML = '';
    const expansions = getStoredExpansions();
    const keys = Object.keys(expansions);
    if (keys.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'Nenhuma expansão adicionada.';
      expansionList.appendChild(empty);
    } else {
      keys.forEach((id) => {
        const item = expansions[id];
        const wrapper = document.createElement('div');
        wrapper.className = 'expansion-item';
        const nameEl = document.createElement('span');
        nameEl.className = 'expansion-name';
        nameEl.textContent = item.name || id;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'secondary-btn';
        deleteBtn.textContent = 'Remover';
        deleteBtn.addEventListener('click', () => deleteExpansion(id));
        wrapper.appendChild(nameEl);
        wrapper.appendChild(deleteBtn);
        expansionList.appendChild(wrapper);
      });
    }
  }

  // Retrieve expansions from localStorage
  function getStoredExpansions() {
    const stored = localStorage.getItem('valeExpansions');
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Erro ao analisar expansões', e);
      return {};
    }
  }

  // Store expansions to localStorage
  function saveExpansions(expansions) {
    localStorage.setItem('valeExpansions', JSON.stringify(expansions));
  }

  // Delete expansion
  function deleteExpansion(id) {
    const expansions = getStoredExpansions();
    if (confirm('Tem certeza que deseja remover esta expansão?')) {
      delete expansions[id];
      saveExpansions(expansions);
      loadExpansionsUI();
    }
  }

  // Show modal to add expansion
  addExpansionBtn?.addEventListener('click', () => {
    expansionNameInput.value = '';
    expansionJsonInput.value = '';
    expansionModal.hidden = false;
  });

  // Cancel modal
  cancelExpansionBtn?.addEventListener('click', () => {
    expansionModal.hidden = true;
  });

  // Save expansion from modal
  saveExpansionBtn?.addEventListener('click', () => {
    const name = expansionNameInput.value.trim();
    const jsonText = expansionJsonInput.value.trim();
    if (!name || !jsonText) {
      alert('Preencha o nome e o conteúdo JSON da expansão.');
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      alert('O conteúdo JSON é inválido. Verifique a sintaxe.');
      return;
    }
    const expansions = getStoredExpansions();
    const id = `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    expansions[id] = { name, ...parsed };
    saveExpansions(expansions);
    expansionModal.hidden = true;
    loadExpansionsUI();
    alert('Expansão adicionada com sucesso! Para que seja carregada no aplicativo, atualize a página inicial.');
  });

  // Export pricing
  exportPricingBtn?.addEventListener('click', async () => {
    // Carrega pricing atual (base + expansões) e exporta como arquivo
    try {
      const baseRes = await fetch('data/pricing.json');
      const base = await baseRes.json();
      // merge expansions
      const expansions = getStoredExpansions();
      let combined = JSON.parse(JSON.stringify(base));
      Object.values(expansions).forEach((exp) => {
        if (exp.instrumentos) combined.instrumentos = { ...combined.instrumentos, ...exp.instrumentos };
        if (exp.servicos) combined.servicos = { ...combined.servicos, ...exp.servicos };
      });
      const blob = new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pricing_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Erro ao exportar tabela: ' + e.message);
    }
  });

  // Import pricing
  pricingFileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Save parsed pricing in localStorage override
      localStorage.setItem('valePricingOverride', JSON.stringify(parsed));
      alert('Nova tabela de preços importada com sucesso! Atualize a página inicial para aplicar as alterações.');
    } catch (err) {
      alert('Falha ao importar tabela: ' + err.message);
    }
  });
});