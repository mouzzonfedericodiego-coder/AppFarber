// exports.js
(function () {
  const STORAGE_BUDGETS = "budgets";
  const STORAGE_CLIENTS = "clients";
  const STORAGE_PRODUCTS_CUSTOM = "productsCustom";

  function safeReadStorage(key, fallback) {
    if (!window.Core || typeof Core.readStorage !== "function") {
      return fallback;
    }
    try {
      return Core.readStorage(key, fallback);
    } catch (e) {
      console.error("Error leyendo storage", key, e);
      return fallback;
    }
  }

  function showToast(message, type) {
    if (window.Core && typeof Core.showToast === "function") {
      Core.showToast(message, type || "info");
    } else {
      console.log(message);
    }
  }

  function todayStamp() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }

  function downloadJson(data, filename) {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Archivo exportado correctamente.", "success");
    } catch (e) {
      console.error("Error exportando JSON", e);
      showToast("No se pudo exportar el archivo.", "error");
    }
  }

  // ----- Exportadores -----

  function exportAll() {
    const stamp = todayStamp();
    const clients =
      (window.Clients && typeof Clients.load === "function"
        ? Clients.load()
        : safeReadStorage(STORAGE_CLIENTS, [])) || [];

    const productsAll =
      (window.Products && typeof Products.getAll === "function"
        ? Products.getAll()
        : []) || [];

    const productsCustom = safeReadStorage(STORAGE_PRODUCTS_CUSTOM, []);
    const budgets = safeReadStorage(STORAGE_BUDGETS, []);

    const payload = {
      app: "Farber Panel Pro",
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      clients,
      products: {
        all: productsAll,
        customOnly: productsCustom,
      },
      budgets,
    };

    downloadJson(payload, `farber-backup-${stamp}.json`);
  }

  function exportBudgets() {
    const stamp = todayStamp();
    const budgets = safeReadStorage(STORAGE_BUDGETS, []);
    downloadJson(budgets, `farber-presupuestos-${stamp}.json`);
  }

  function exportClients() {
    const stamp = todayStamp();
    const clients =
      (window.Clients && typeof Clients.load === "function"
        ? Clients.load()
        : safeReadStorage(STORAGE_CLIENTS, [])) || [];
    downloadJson(clients, `farber-clientes-${stamp}.json`);
  }

  function exportProducts() {
    const stamp = todayStamp();
    const productsAll =
      (window.Products && typeof Products.getAll === "function"
        ? Products.getAll()
        : []) || [];
    downloadJson(productsAll, `farber-productos-${stamp}.json`);
  }

  // ----- INIT -----

  function init() {
    const allBtn = document.getElementById("exportAllBtn");
    const budgetsBtn = document.getElementById("exportBudgetsBtn");
    const clientsBtn = document.getElementById("exportClientsBtn");
    const productsBtn = document.getElementById("exportProductsBtn");

    if (allBtn) allBtn.addEventListener("click", exportAll);
    if (budgetsBtn) budgetsBtn.addEventListener("click", exportBudgets);
    if (clientsBtn) clientsBtn.addEventListener("click", exportClients);
    if (productsBtn) productsBtn.addEventListener("click", exportProducts);
  }

  document.addEventListener("DOMContentLoaded", init);

  // Por si en algún momento querés llamar a mano desde consola
  window.Exports = {
    exportAll,
    exportBudgets,
    exportClients,
    exportProducts,
  };
})();
