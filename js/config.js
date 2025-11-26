// config.js
(function () {
  const STORAGE_KEY = "config";

  const DEFAULT_CONFIG = {
    ivaPercent: 21,
    maxDiscount: 30,
    defaultShipping: 0,
    currency: "ARS",
    companyName: "Farber Muebles SRL",
    cuit: "30-00000000-0",
    bank: "Banco Galicia",
    cbu: "0000000000000000000000",
  };

  function loadConfig() {
    const cfg = Core.readStorage(STORAGE_KEY, DEFAULT_CONFIG);
    return { ...DEFAULT_CONFIG, ...cfg };
  }

  function saveConfig(cfg) {
    Core.writeStorage(STORAGE_KEY, cfg);
  }

  function applyToForm(cfg) {
    const iva = document.getElementById("configIva");
    const maxDesc = document.getElementById("configMaxDiscount");
    const ship = document.getElementById("configDefaultShipping");
    const cur = document.getElementById("configCurrency");
    const name = document.getElementById("configCompanyName");
    const cuit = document.getElementById("configCuit");
    const bank = document.getElementById("configBank");
    const cbu = document.getElementById("configCbu");

    if (iva) iva.value = cfg.ivaPercent;
    if (maxDesc) maxDesc.value = cfg.maxDiscount;
    if (ship) ship.value = cfg.defaultShipping;
    if (cur) cur.value = cfg.currency;
    if (name) name.value = cfg.companyName;
    if (cuit) cuit.value = cfg.cuit;
    if (bank) bank.value = cfg.bank;
    if (cbu) cbu.value = cfg.cbu;
  }

  function readFromForm() {
    const iva = Number(
      document.getElementById("configIva")?.value || DEFAULT_CONFIG.ivaPercent
    );
    const maxDesc = Number(
      document.getElementById("configMaxDiscount")?.value ||
        DEFAULT_CONFIG.maxDiscount
    );
    const ship = Number(
      document.getElementById("configDefaultShipping")?.value ||
        DEFAULT_CONFIG.defaultShipping
    );
    const cur =
      document.getElementById("configCurrency")?.value ||
      DEFAULT_CONFIG.currency;
    const name =
      document.getElementById("configCompanyName")?.value ||
      DEFAULT_CONFIG.companyName;
    const cuit =
      document.getElementById("configCuit")?.value || DEFAULT_CONFIG.cuit;
    const bank =
      document.getElementById("configBank")?.value || DEFAULT_CONFIG.bank;
    const cbu =
      document.getElementById("configCbu")?.value || DEFAULT_CONFIG.cbu;

    return {
      ivaPercent: iva,
      maxDiscount: maxDesc,
      defaultShipping: ship,
      currency: cur,
      companyName: name,
      cuit,
      bank,
      cbu,
    };
  }

  function initForm() {
    const form = document.getElementById("configForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const cfg = readFromForm();
      saveConfig(cfg);
      Core.showToast("Configuración guardada.", "success");

      if (window.Budgets && typeof Budgets.applyConfig === "function") {
        Budgets.applyConfig(cfg);
      }
    });
  }

  function init() {
    const cfg = loadConfig();
    applyToForm(cfg);
  }

  window.Config = {
    init,
    load: loadConfig,
  };

  document.addEventListener("DOMContentLoaded", initForm);
})();
