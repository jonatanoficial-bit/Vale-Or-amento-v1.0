const STORAGE_KEYS = {
  pricingOverride: "vale.pricing.override.v2",
  expansions: "vale.expansions.local.v2",
  quotes: "vale.quotes.history.v2",
  password: "vale.admin.password.v2"
};

async function safeFetchJson(path) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, extension) {
  if (!isObject(extension)) {
    return extension;
  }

  const result = structuredClone(base ?? {});
  for (const [key, value] of Object.entries(extension)) {
    if (Array.isArray(value)) {
      result[key] = structuredClone(value);
      continue;
    }

    if (isObject(value)) {
      result[key] = deepMerge(result[key] ?? {}, value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

export async function loadPricing() {
  const base = await safeFetchJson("data/pricing.json");
  if (!base) {
    throw new Error("Não foi possível carregar a tabela base de preços.");
  }

  let pricing = structuredClone(base);

  const manifest = await safeFetchJson("dlc/manifest.json");
  if (manifest?.dlc?.length) {
    for (const dlc of manifest.dlc) {
      if (!dlc.enabled || !dlc.file) continue;
      const content = await safeFetchJson(`dlc/${dlc.file.replace("./", "")}`);
      if (content) pricing = deepMerge(pricing, content);
    }
  }

  const localExpansions = JSON.parse(localStorage.getItem(STORAGE_KEYS.expansions) || "[]");
  for (const expansion of localExpansions) {
    pricing = deepMerge(pricing, expansion.payload || {});
  }

  const override = JSON.parse(localStorage.getItem(STORAGE_KEYS.pricingOverride) || "null");
  if (override) {
    pricing = deepMerge(pricing, override);
  }

  return pricing;
}

export function savePricingOverride(partialPricing) {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.pricingOverride) || "{}");
  const merged = deepMerge(current, partialPricing || {});
  localStorage.setItem(STORAGE_KEYS.pricingOverride, JSON.stringify(merged));
}

export function clearPricingOverride() {
  localStorage.removeItem(STORAGE_KEYS.pricingOverride);
}

export function exportPricing(pricing) {
  const blob = new Blob([JSON.stringify(pricing, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `vale-pricing-${pricing.meta?.version || "v2"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importPricingJson(file) {
  return file.text().then((text) => JSON.parse(text));
}

export function getLocalExpansions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.expansions) || "[]");
}

export function saveLocalExpansions(expansions) {
  localStorage.setItem(STORAGE_KEYS.expansions, JSON.stringify(expansions));
}

export function getQuoteHistory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.quotes) || "[]");
}

export function pushQuoteHistory(entry) {
  const history = getQuoteHistory();
  history.unshift(entry);
  localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(history.slice(0, 200)));
}

export function clearQuoteHistory() {
  localStorage.removeItem(STORAGE_KEYS.quotes);
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getAdminPassword() {
  return localStorage.getItem(STORAGE_KEYS.password) || "admin123";
}

export function setAdminPassword(password) {
  localStorage.setItem(STORAGE_KEYS.password, password);
}
