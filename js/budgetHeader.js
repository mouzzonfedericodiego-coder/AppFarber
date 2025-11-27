// budgetHeader.js
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function formatDateToDDMMYYYY(value) {
    if (!value) return "—";
    const parts = value.split("-");
    if (parts.length !== 3) return value;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }

  function init() {
    const clientInput = $("budgetClient");
    const dateInput = $("budgetDate");

    const clientPreview = $("budgetDocClientPreview");
    const datePreview = $("budgetDocDatePreview");
    const numberSpan = $("budgetDocNumber");
    const saveBtn = $("saveBudgetBtn");

    // Actualizar nombre del cliente en el encabezado
    function updateClientPreview() {
      if (!clientPreview || !clientInput) return;
      const value = clientInput.value.trim();
      clientPreview.textContent = value || "Sin especificar";
    }

    // Actualizar fecha en el encabezado
    function updateDatePreview() {
      if (!datePreview || !dateInput) return;
      datePreview.textContent = formatDateToDDMMYYYY(dateInput.value);
    }

    // Inicializar / actualizar número de presupuesto
    function initBudgetNumber() {
      if (!numberSpan) return;
      let stored = localStorage.getItem("lastBudgetNumber");
      let num = stored ? parseInt(stored, 10) : 1;
      if (!Number.isFinite(num) || num <= 0) num = 1;
      numberSpan.textContent = String(num).padStart(4, "0");
    }

    function increaseBudgetNumber() {
      let stored = localStorage.getItem("lastBudgetNumber");
      let num = stored ? parseInt(stored, 10) : 1;
      if (!Number.isFinite(num) || num <= 0) num = 1;
      num += 1;
      localStorage.setItem("lastBudgetNumber", String(num));
      const numberSpan = $("budgetDocNumber");
      if (numberSpan) {
        numberSpan.textContent = String(num).padStart(4, "0");
      }
    }

    if (clientInput) {
      clientInput.addEventListener("input", updateClientPreview);
      updateClientPreview();
    }

    if (dateInput) {
      dateInput.addEventListener("input", updateDatePreview);
      updateDatePreview();
    }

    initBudgetNumber();

    // Cada vez que guardás un presupuesto, aumentamos el número
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        increaseBudgetNumber();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
