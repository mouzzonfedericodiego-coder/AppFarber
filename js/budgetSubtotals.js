// budgetSubtotals.js
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function parseAmount(text) {
    if (!text) return 0;
    // Quitar todo lo que no sea dígito, coma o punto
    let clean = text.replace(/[^\d.,-]/g, "").trim();
    if (!clean) return 0;

    // Caso típico: 12.345,67 o 12,345.67
    // Simplificación: quitamos separadores de miles y usamos punto como decimal
    // Primero, si hay más de un separador, asumimos que el último es decimal.
    const lastComma = clean.lastIndexOf(",");
    const lastDot = clean.lastIndexOf(".");

    if (lastComma > -1 && lastDot > -1) {
      // Hay ambos: nos quedamos con el último como decimal
      if (lastComma > lastDot) {
        // coma decimal -> quitar todos los puntos (miles) y cambiar coma por punto
        clean = clean.replace(/\./g, "").replace(",", ".");
      } else {
        // punto decimal -> quitar comas (miles)
        clean = clean.replace(/,/g, "");
      }
    } else if (lastComma > -1) {
      // Solo coma -> decimal
      clean = clean.replace(/\./g, "").replace(",", ".");
    } else {
      // Solo punto o solo números -> ya sirve, quitar comas si las hubiera
      clean = clean.replace(/,/g, "");
    }

    const num = parseFloat(clean);
    return Number.isFinite(num) ? num : 0;
  }

  function getGroupNameFromRow(row) {
    const cells = row.querySelectorAll("td");
    if (!cells[1] || !cells[4]) return null;

    const label = cells[1].textContent.toLowerCase();

    // Si contiene "(custom)", lo tratamos como ítem personalizado
    if (label.includes("(custom)")) {
      return "Ítems personalizados";
    }

    return "Productos Farber";
  }

  function computeSubtotals() {
    const tbody = $("budgetItemsBody");
    const box = $("budgetSubtotalsBox");
    if (!tbody || !box) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (rows.length === 0) {
      box.innerHTML = "";
      box.style.display = "none";
      return;
    }

    const subtotals = {};

    rows.forEach((row) => {
      const group = getGroupNameFromRow(row);
      if (!group) return;

      const cells = row.querySelectorAll("td");
      const subtotalCell = cells[4]; // columna "Subtotal"
      if (!subtotalCell) return;

      const amount = parseAmount(subtotalCell.textContent);
      if (!subtotals[group]) subtotals[group] = 0;
      subtotals[group] += amount;
    });

    const groups = Object.keys(subtotals);
    if (groups.length === 0) {
      box.innerHTML = "";
      box.style.display = "none";
      return;
    }

    // Render: pequeño resumen compacto
    let html = '<div class="budget-subtotals__inner">';
    html += '<span class="budget-subtotals__title">Subtotales por grupo:</span>';
    html += '<div class="budget-subtotals__list">';

    groups.forEach((g) => {
      const amount = subtotals[g];
      html += `
        <div class="budget-subtotals__item">
          <span class="budget-subtotals__item-label">${g}</span>
          <span class="budget-subtotals__item-value">$ ${amount.toLocaleString()}</span>
        </div>
      `;
    });

    html += "</div></div>";

    box.innerHTML = html;
    box.style.display = "block";
  }

  function initObserver() {
    const tbody = $("budgetItemsBody");
    if (!tbody) return;

    const observer = new MutationObserver(function () {
      computeSubtotals();
    });

    observer.observe(tbody, {
      childList: true,
      subtree: false,
    });

    // Cálculo inicial
    computeSubtotals();
  }

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initObserver);
    } else {
      initObserver();
    }
  }

  init();

  // Exponer por si en el futuro queremos recalcular a mano
  window.BudgetSubtotals = {
    recompute: computeSubtotals,
  };
})();
