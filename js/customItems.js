// customItems.js
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function addRowToBudget(item) {
    const tbody = $("budgetItemsBody");
    if (!tbody) return;

    const row = document.createElement("tr");
    row.classList.add("budget-item-row");

    row.innerHTML = `
      <td>–</td>
      <td>${item.name} <span style="font-size: 0.75rem; opacity: 0.7;">(custom)</span></td>
      <td>$${item.price.toLocaleString()}</td>
      <td>${item.qty}</td>
      <td>$${(item.qty * item.price).toLocaleString()}</td>
      <td>
        <button class="btn btn--ghost btn-sm remove-item-btn">X</button>
      </td>
    `;

    tbody.appendChild(row);

    updateBudgetTotals();
  }

  function updateBudgetTotals() {
    if (!window.Budgets || !Budgets.calculateSummary) return;
    Budgets.calculateSummary();
  }

  function init() {
    const btn = $("addCustomItemBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
      const name = $("customItemName").value.trim();
      const qty = parseInt($("customItemQty").value);
      const price = parseFloat($("customItemPrice").value);

      if (!name) {
        alert("Ingresá un nombre para el ítem.");
        return;
      }

      if (!qty || qty <= 0) {
        alert("Cantidad inválida.");
        return;
      }

      if (!price || price < 0) {
        alert("Precio inválido.");
        return;
      }

      addRowToBudget({ name, qty, price });

      $("customItemName").value = "";
      $("customItemQty").value = 1;
      $("customItemPrice").value = 0;
    });

    // Eliminar ítems desde la tabla
    document.addEventListener("click", function (evt) {
      if (evt.target.classList.contains("remove-item-btn")) {
        evt.target.closest("tr").remove();
        updateBudgetTotals();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
