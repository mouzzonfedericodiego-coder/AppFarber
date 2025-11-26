// exports.js
(function () {
  const STORAGE_BUDGETS = "budgets";
  const STORAGE_CLIENTS = "clients";
  const STORAGE_PRODUCTS_CUSTOM = "productsCustom";

  // ---------- Helpers de storage ----------

  function safeReadStorage(key, fallback) {
    if (!window.Core || typeof Core.readStorage !== "function") {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        return JSON.parse(raw);
      } catch (e) {
        console.error("Error leyendo storage local", key, e);
        return fallback;
      }
    }

    try {
      return Core.readStorage(key, fallback);
    } catch (e) {
      console.error("Error leyendo storage Core", key, e);
      return fallback;
    }
  }

  function safeWriteStorage(key, value) {
    if (!window.Core || typeof Core.writeStorage !== "function") {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("Error escribiendo storage local", key, e);
      }
      return;
    }

    try {
      Core.writeStorage(key, value);
    } catch (e) {
      console.error("Error escribiendo storage Core", key, e);
    }
  }

  function showToast(message, type) {
    if (window.Core && typeof Core.showToast === "function") {
      Core.showToast(message, type || "info");
    } else {
      console.log(type ? `[${type}]` : "", message);
      alert(message);
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

  // ---------- EXPORTAR ----------

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

  // ---------- IMPORTAR BACKUP COMPLETO ----------

  function importBackupFromJsonText(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON inválido", e);
      showToast("El archivo no contiene un JSON válido.", "error");
      return;
    }

    // Si es un array, seguramente sea un export parcial
    if (Array.isArray(data)) {
      showToast(
        "Este archivo parece ser una lista simple. Para importar, usá el backup completo generado con 'Exportar TODO (.json)'.",
        "error"
      );
      return;
    }

    const clients = Array.isArray(data.clients) ? data.clients : null;
    const budgets = Array.isArray(data.budgets) ? data.budgets : null;

    let productsCustom = null;
    if (data.products && typeof data.products === "object") {
      if (Array.isArray(data.products.customOnly)) {
        productsCustom = data.products.customOnly;
      }
    }

    if (!clients && !budgets && !productsCustom) {
      showToast(
        "No se encontraron secciones reconocidas en el backup (clients, budgets, products.customOnly).",
        "error"
      );
      return;
    }

    if (
      !confirm(
        "Esta acción reemplaza los datos locales de clientes, presupuestos y productos creados por vos con los del archivo.\n\n¿Querés continuar?"
      )
    ) {
      return;
    }

    if (clients) safeWriteStorage(STORAGE_CLIENTS, clients);
    if (budgets) safeWriteStorage(STORAGE_BUDGETS, budgets);
    if (productsCustom) safeWriteStorage(STORAGE_PRODUCTS_CUSTOM, productsCustom);

    showToast("Backup importado correctamente. Recargando datos...", "success");

    setTimeout(function () {
      window.location.reload();
    }, 800);
  }

  function handleImportBackupFile(inputEl) {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) {
      showToast("Elegí primero un archivo .json de backup.", "error");
      return;
    }

    const file = inputEl.files[0];
    const name = (file.name || "").toLowerCase();

    if (!name.endsWith(".json")) {
      if (
        !confirm(
          "El archivo no termina en .json. ¿Seguro que es un backup válido generado por este panel?"
        )
      ) {
        return;
      }
    }

    const reader = new FileReader();
    reader.onerror = function () {
      showToast("No se pudo leer el archivo.", "error");
    };
    reader.onload = function (evt) {
      importBackupFromJsonText(evt.target.result || "");
    };
    reader.readAsText(file, "utf-8");
  }

  // ---------- INIT ----------

  function init() {
    // Botones de exportación
    const allBtn = document.getElementById("exportAllBtn");
    const budgetsBtn = document.getElementById("exportBudgetsBtn");
    const clientsBtn = document.getElementById("exportClientsBtn");
    const productsBtn = document.getElementById("exportProductsBtn");

    if (allBtn) allBtn.addEventListener("click", exportAll);
    if (budgetsBtn) budgetsBtn.addEventListener("click", exportBudgets);
    if (clientsBtn) clientsBtn.addEventListener("click", exportClients);
    if (productsBtn) productsBtn.addEventListener("click", exportProducts);

    // Importar backup
    const importInput = document.getElementById("importBackupFile");
    const importBtn = document.getElementById("importBackupBtn");

    if (importBtn && importInput) {
      importBtn.addEventListener("click", function () {
        handleImportBackupFile(importInput);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);

  // API global opcional
  window.Exports = {
    exportAll,
    exportBudgets,
    exportClients,
    exportProducts,
    importBackupFromJsonText,
  };
})();
