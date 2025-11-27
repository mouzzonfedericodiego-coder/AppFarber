// budgets.js
(function () {
  const STORAGE_KEY = "budgets";
  const STATUS_OPTIONS = ["Borrador", "En revisión", "Aprobado", "Perdido"];

  let currentBudget = null;
  let config = null;

  // DOM refs
  let budgetTableBody,
    budgetDiscountInput,
    budgetShippingInput,
    budgetClientInput,
    budgetDateInput,
    budgetNotesInput,
    budgetCurrencySelect,
    budgetPaymentSelect,
    cartBadge;

  // Historial filters DOM
  let historySearchInput,
    historyClientSelect,
    historyStatusSelect,
    historyDateFromInput,
    historyDateToInput,
    historyResetBtn;

  function loadBudgets() {
    return Core.readStorage(STORAGE_KEY, []);
  }

  function saveBudgets(list) {
    Core.writeStorage(STORAGE_KEY, list);
  }

  function newBudget() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const cfg = config || Config.load();

    return {
      id: Core.generateId("bud"),
      clientId: null,
      clientName: "",
      date: dateStr,
      discountPercent: 0,
      shipping: cfg.defaultShipping ?? 0,
      currency: cfg.currency ?? "ARS",
      paymentMethod: "Transferencia",
      notes: "",
      items: [],
      status: "Borrador",
      total: 0,
    };
  }

  function ensureCurrentBudget() {
    if (!currentBudget) currentBudget = newBudget();
    return currentBudget;
  }

  function findItemIndex(productId) {
    const b = ensureCurrentBudget();
    return b.items.findIndex((i) => i.productId === productId);
  }

  function addProductById(productId) {
    const prod = Products.getById(productId);
    if (!prod) {
      Core.showToast("Producto no encontrado en catálogo.", "error");
      return;
    }
    const b = ensureCurrentBudget();
    const idx = findItemIndex(prod.id);

    if (idx >= 0) {
      b.items[idx].quantity += 1;
    } else {
      b.items.push({
        productId: prod.id,
        name: prod.name,
        unitPrice: prod.price,
        quantity: 1,
      });
    }

    Core.showToast("Producto agregado al presupuesto.", "success");
    renderBudgetTable();
  }

  function removeItem(productId) {
    const b = ensureCurrentBudget();
    b.items = b.items.filter((i) => i.productId !== productId);
    renderBudgetTable();
    Core.showToast("Producto quitado del presupuesto.", "info");
  }

  function updateQuantity(productId, quantity) {
    const b = ensureCurrentBudget();
    const idx = findItemIndex(productId);
    if (idx < 0) return;
    b.items[idx].quantity = quantity < 1 ? 1 : quantity;
    renderBudgetTable();
  }

  function readFormIntoBudget() {
    const b = ensureCurrentBudget();

    if (budgetClientInput) {
      b.clientName = budgetClientInput.value.trim();

      // Vinculamos con un cliente si coincide el nombre
      const clients = window.Clients?.load?.() || [];
      const normName = Core.normalizarTexto(b.clientName);
      const found = clients.find(
        (c) => Core.normalizarTexto(c.name) === normName
      );
      b.clientId = found ? found.id : null;
    }

    if (budgetDateInput) b.date = budgetDateInput.value || b.date;
    if (budgetNotesInput) b.notes = budgetNotesInput.value.trim();
    if (budgetCurrencySelect) b.currency = budgetCurrencySelect.value;
    if (budgetPaymentSelect) b.paymentMethod = budgetPaymentSelect.value;

    b.discountPercent = budgetDiscountInput
      ? Number(budgetDiscountInput.value || 0)
      : 0;
    b.shipping = budgetShippingInput
      ? Number(budgetShippingInput.value || 0)
      : 0;
  }

  function calcTotals() {
    const b = ensureCurrentBudget();
    const cfg = config || Config.load();

    let subtotal = 0;
    b.items.forEach((i) => {
      subtotal += i.unitPrice * i.quantity;
    });

    const discountPercent = Math.min(
      b.discountPercent,
      cfg.maxDiscount ?? 100
    );
    const discountAmount = (subtotal * discountPercent) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const ivaPercent = cfg.ivaPercent ?? 21;
    const iva = (subtotalAfterDiscount * ivaPercent) / 100;
    const shipping = b.shipping || 0;
    const totalFinal = subtotalAfterDiscount + iva + shipping;

    b.total = totalFinal;

    return {
      subtotal,
      discountAmount,
      discountPercent,
      iva,
      shipping,
      totalFinal,
    };
  }

  function renderBudgetTable() {
    budgetTableBody =
      budgetTableBody || document.getElementById("budgetItemsBody");
    if (!budgetTableBody) return;

    readFormIntoBudget();
    const b = ensureCurrentBudget();

    budgetTableBody.innerHTML = "";
    b.items.forEach((item, index) => {
      const tr = document.createElement("tr");
      const subtotal = item.unitPrice * item.quantity;
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${Core.formatMoney(item.unitPrice)}</td>
        <td>
          <div class="qty-control">
            <button class="qty-control__btn" data-action="dec">−</button>
            <input class="qty-control__input" type="number" min="1" value="${item.quantity}" />
            <button class="qty-control__btn" data-action="inc">+</button>
          </div>
        </td>
        <td>${Core.formatMoney(subtotal)}</td>
        <td>
          <button class="btn btn--ghost btn--small" data-action="remove">
            Quitar
          </button>
        </td>
      `;
      tr.dataset.productId = item.productId;
      budgetTableBody.appendChild(tr);
    });

    // Eventos unidades / quitar
    budgetTableBody.querySelectorAll("tr").forEach((tr) => {
      const productId = tr.dataset.productId;
      if (!productId) return;
      const decBtn = tr.querySelector('button[data-action="dec"]');
      const incBtn = tr.querySelector('button[data-action="inc"]');
      const removeBtn = tr.querySelector('button[data-action="remove"]');
      const qtyInput = tr.querySelector(".qty-control__input");

      if (decBtn) {
        decBtn.addEventListener("click", () => {
          const b = ensureCurrentBudget();
          const idx = findItemIndex(productId);
          if (idx < 0) return;
          const curr = b.items[idx].quantity;
          if (curr > 1) {
            updateQuantity(productId, curr - 1);
          }
        });
      }
      if (incBtn) {
        incBtn.addEventListener("click", () => {
          const b = ensureCurrentBudget();
          const idx = findItemIndex(productId);
          if (idx < 0) return;
          const curr = b.items[idx].quantity;
          updateQuantity(productId, curr + 1);
        });
      }
      if (qtyInput) {
        qtyInput.addEventListener("change", () => {
          let v = parseInt(qtyInput.value, 10);
          if (!v || v < 1) {
            v = 1;
            qtyInput.value = "1";
            Core.showToast("La cantidad mínima es 1.", "info");
          }
          updateQuantity(productId, v);
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener("click", () => {
          removeItem(productId);
        });
      }
    });

    // Totales
    const totals = calcTotals();
    const elSub = document.getElementById("summarySubtotal");
    const elDesc = document.getElementById("summaryDiscount");
    const elShip = document.getElementById("summaryShipping");
    const elIva = document.getElementById("summaryIVA");
    const elTot = document.getElementById("summaryTotal");

    if (elSub) elSub.textContent = Core.formatMoney(totals.subtotal);
    if (elDesc)
      elDesc.textContent = `${Core.formatMoney(
        totals.discountAmount
      )} (${totals.discountPercent}%)`;
    if (elShip) elShip.textContent = Core.formatMoney(totals.shipping);
    if (elIva) elIva.textContent = Core.formatMoney(totals.iva);
    if (elTot) elTot.textContent = Core.formatMoney(totals.totalFinal);

    // Badge carrito
    if (!cartBadge) cartBadge = document.getElementById("cartBadge");
    if (cartBadge) {
      const units = b.items.reduce((acc, i) => acc + i.quantity, 0);
      cartBadge.textContent = units;
    }

    updateSavedTables();
  }

  function clearBudget() {
    currentBudget = newBudget();
    if (budgetClientInput) budgetClientInput.value = "";
    if (budgetDateInput) budgetDateInput.value = currentBudget.date;
    if (budgetNotesInput) budgetNotesInput.value = "";
    if (budgetCurrencySelect)
      budgetCurrencySelect.value = currentBudget.currency;
    if (budgetPaymentSelect)
      budgetPaymentSelect.value = currentBudget.paymentMethod;
    if (budgetDiscountInput)
      budgetDiscountInput.value = currentBudget.discountPercent;
    if (budgetShippingInput)
      budgetShippingInput.value = currentBudget.shipping;
    renderBudgetTable();
    Core.showToast("Presupuesto limpiado.", "info");
  }

  function saveCurrentBudget() {
    readFormIntoBudget();
    const b = ensureCurrentBudget();
    if (!b.clientName) {
      Core.showToast("Indicá un cliente para el presupuesto.", "error");
      return;
    }

    const list = loadBudgets();
    const idx = list.findIndex((x) => x.id === b.id);
    const totals = calcTotals();
    b.total = totals.totalFinal;

    if (!b.status) b.status = "Borrador";

    if (idx >= 0) {
      list[idx] = { ...b };
    } else {
      list.push({ ...b });
    }

    saveBudgets(list);
    updateSavedTables();
    updateDashboardCounts();
    Core.showToast("Presupuesto guardado.", "success");

    // Crear uno nuevo para seguir
    currentBudget = newBudget();
    clearBudget();
  }

  // ----- RENDERIZADOS AUXILIARES -----
  function buildStatusChip(status) {
    const st = status || "Borrador";
    const key =
      st === "Aprobado"
        ? "aprobado"
        : st === "En revisión"
        ? "revision"
        : st === "Perdido"
        ? "perdido"
        : "borrador";
    return `<span class="status-chip status-chip--${key}">${st}</span>`;
  }

  function renderSavedBudgetsTable(allBudgets) {
    const savedTbody = document.querySelector("#savedBudgetsTable tbody");
    if (!savedTbody) return;

    savedTbody.innerHTML = "";
    allBudgets.slice(0, 50).forEach((b, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${b.clientName}</td>
          <td>${b.date}</td>
          <td>${Core.formatMoney(b.total || 0)}</td>
          <td style="display:flex; gap:0.4rem;">
  <button class="btn btn--ghost js-duplicateBudget" data-id="${b.id}">
      Duplicar
  </button>

  <button class="btn btn--danger js-deleteBudget" data-id="${b.id}">
      Eliminar
  </button>
</td>
        `;
      savedTbody.appendChild(tr);
    });

    attachDuplicateHandlers(savedTbody);
  }

  function renderDashboardBudgetsTable(allBudgets) {
    const dashTbody = document.querySelector(
      "#dashboardLastBudgetsTable tbody"
    );
    if (!dashTbody) return;

    dashTbody.innerHTML = "";
    allBudgets.slice(0, 5).forEach((b, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${b.clientName}</td>
          <td>${b.date}</td>
          <td>${Core.formatMoney(b.total || 0)}</td>
          <td>${buildStatusChip(b.status)}</td>
        `;
      dashTbody.appendChild(tr);
    });
  }

  function applyHistoryFilters(allBudgets) {
    let res = allBudgets;
    const text = historySearchInput
      ? Core.normalizarTexto(historySearchInput.value || "")
      : "";
    const statusFilter = historyStatusSelect
      ? historyStatusSelect.value
      : "";
    const clientFilter = historyClientSelect
      ? historyClientSelect.value
      : "";
    const from = historyDateFromInput?.value || "";
    const to = historyDateToInput?.value || "";

    if (text) {
      res = res.filter((b, index) => {
        const base = Core.normalizarTexto(
          `${b.clientName} ${b.id} ${index + 1}`
        );
        return base.includes(text);
      });
    }

    if (clientFilter) {
      res = res.filter((b) => (b.clientId || "") === clientFilter);
    }

    if (statusFilter) {
      res = res.filter((b) => (b.status || "Borrador") === statusFilter);
    }

    if (from) {
      res = res.filter((b) => (b.date || "") >= from);
    }
    if (to) {
      res = res.filter((b) => (b.date || "") <= to);
    }

    return res;
  }

  function renderHistoryBudgetsTable(filteredBudgets) {
    const histTbody = document.querySelector("#historyBudgetsTable tbody");
    if (!histTbody) return;

    histTbody.innerHTML = "";
    filteredBudgets.forEach((b, index) => {
      const status = b.status || "Borrador";
      const statusOptions = STATUS_OPTIONS.map(
        (s) =>
          `<option value="${s}" ${
            s === status ? "selected" : ""
          }>${s}</option>`
      ).join("");

      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${b.clientName}</td>
          <td>${b.date}</td>
          <td>${Core.formatMoney(b.total || 0)}</td>
          <td>${buildStatusChip(status)}</td>
          <td>
            <select class="status-select" data-id="${b.id}">
              ${statusOptions}
            </select>
            <button class="btn btn--ghost btn--small js-duplicate-budget" data-id="${b.id}">
              Duplicar
            </button>
          </td>
        `;
      histTbody.appendChild(tr);
    });

    // Cambio de estado
    histTbody.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", () => {
        const id = select.getAttribute("data-id");
        const newStatus = select.value;
        const list = loadBudgets();
        const idx = list.findIndex((b) => b.id === id);
        if (idx >= 0) {
          list[idx].status = newStatus;
          saveBudgets(list);
          updateSavedTables();
          updateDashboardCounts();
          Core.showToast("Estado actualizado.", "success");
        }
      });
    });

    attachDuplicateHandlers(histTbody);
  }

  function attachDuplicateHandlers(scope) {
    scope.querySelectorAll(".js-duplicate-budget").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const list = loadBudgets();
        const original = list.find((b) => b.id === id);
        if (!original) return;

        const duplicated = {
          ...original,
          id: Core.generateId("bud"),
          status: "Borrador",
          date: new Date().toISOString().slice(0, 10),
        };
        list.push(duplicated);
        saveBudgets(list);
        updateSavedTables();
        updateDashboardCounts();
        Core.showToast("Presupuesto duplicado.", "success");
      });
    });
  }

  function updateSavedTables() {
    const budgets = loadBudgets()
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    renderSavedBudgetsTable(budgets);
    renderDashboardBudgetsTable(budgets);

    const filtered = applyHistoryFilters(budgets);
    renderHistoryBudgetsTable(filtered);
  }

  function updateDashboardCounts() {
    const budgets = loadBudgets();
    const todayStr = new Date().toISOString().slice(0, 10);
    const budgetsToday = budgets.filter((b) => b.date === todayStr).length;
    const clients = Clients.load().length;
    const products = Products.getAll().length;

    Core.setDashboardCounts({ budgetsToday, clients, products });
  }

  function downloadPdf() {
    Core.showToast(
      "Usá la opción de imprimir del navegador para exportar como PDF.",
      "info"
    );
    window.print();
  }

  function getTodayCount() {
    const budgets = loadBudgets();
    const todayStr = new Date().toISOString().slice(0, 10);
    return budgets.filter((b) => b.date === todayStr).length;
  }

  function applyConfig(cfg) {
    config = cfg;
    if (budgetShippingInput) {
      budgetShippingInput.value = cfg.defaultShipping ?? 0;
    }
    if (budgetCurrencySelect) {
      budgetCurrencySelect.value = cfg.currency ?? "ARS";
    }
    renderBudgetTable();
  }

  function initCartButtonScroll() {
    const cartBtn = document.getElementById("cartButton");
    if (!cartBtn) return;

    cartBtn.addEventListener("click", () => {
      const card = document.getElementById("budgetGeneratedCard");
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function populateHistoryClientFilter() {
    historyClientSelect = document.getElementById("historyClientFilter");
    if (!historyClientSelect) return;

    const clients = window.Clients?.load?.() || [];

    // Guardamos valor actual para no resetear al usuario
    const currentVal = historyClientSelect.value || "";

    historyClientSelect.innerHTML =
      `<option value="">Todos</option>` +
      clients
        .map(
          (c) =>
            `<option value="${c.id}">${c.name}</option>`
        )
        .join("");

    // restaurar selección si sigue existiendo
    if (
      currentVal &&
      clients.some((c) => c.id === currentVal)
    ) {
      historyClientSelect.value = currentVal;
    }
  }

  function initHistoryFilters() {
    historySearchInput = document.getElementById("historySearch");
    historyClientSelect = document.getElementById("historyClientFilter");
    historyStatusSelect = document.getElementById("historyStatusFilter");
    historyDateFromInput = document.getElementById("historyDateFrom");
    historyDateToInput = document.getElementById("historyDateTo");
    historyResetBtn = document.getElementById("historyResetFilters");

    if (historySearchInput) {
      historySearchInput.addEventListener("input", updateSavedTables);
    }
    if (historyClientSelect) {
      historyClientSelect.addEventListener("change", updateSavedTables);
    }
    if (historyStatusSelect) {
      historyStatusSelect.addEventListener("change", updateSavedTables);
    }
    if (historyDateFromInput) {
      historyDateFromInput.addEventListener("change", updateSavedTables);
    }
    if (historyDateToInput) {
      historyDateToInput.addEventListener("change", updateSavedTables);
    }
    if (historyResetBtn) {
      historyResetBtn.addEventListener("click", () => {
        if (historySearchInput) historySearchInput.value = "";
        if (historyClientSelect) historyClientSelect.value = "";
        if (historyStatusSelect) historyStatusSelect.value = "";
        if (historyDateFromInput) historyDateFromInput.value = "";
        if (historyDateToInput) historyDateToInput.value = "";
        updateSavedTables();
      });
    }

    populateHistoryClientFilter();
  }

  function init() {
    config = Config.load();

    budgetTableBody = document.getElementById("budgetItemsBody");
    budgetDiscountInput = document.getElementById("budgetDiscount");
    budgetShippingInput = document.getElementById("budgetShipping");
    budgetClientInput = document.getElementById("budgetClient");
    budgetDateInput = document.getElementById("budgetDate");
    budgetNotesInput = document.getElementById("budgetNotes");
    budgetCurrencySelect = document.getElementById("budgetCurrency");
    budgetPaymentSelect = document.getElementById("budgetPayment");
    cartBadge = document.getElementById("cartBadge");

    currentBudget = newBudget();
    if (budgetDateInput) budgetDateInput.value = currentBudget.date;
    if (budgetShippingInput) budgetShippingInput.value = currentBudget.shipping;
    if (budgetCurrencySelect)
      budgetCurrencySelect.value = currentBudget.currency;

    if (budgetDiscountInput) {
      budgetDiscountInput.addEventListener("change", renderBudgetTable);
    }
    if (budgetShippingInput) {
      budgetShippingInput.addEventListener("change", renderBudgetTable);
    }
    if (budgetClientInput) {
      budgetClientInput.addEventListener("change", () => readFormIntoBudget());
    }
    if (budgetNotesInput) {
      budgetNotesInput.addEventListener("change", () => readFormIntoBudget());
    }
    if (budgetCurrencySelect) {
      budgetCurrencySelect.addEventListener("change", renderBudgetTable);
    }
    if (budgetPaymentSelect) {
      budgetPaymentSelect.addEventListener("change", () =>
        readFormIntoBudget()
      );
    }

    const saveBtn = document.getElementById("saveBudgetBtn");
    if (saveBtn) {
      saveBtn.addEventListener("click", saveCurrentBudget);
    }

    const clearBtn = document.getElementById("clearBudgetBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!ensureCurrentBudget().items.length) {
          clearBudget();
          return;
        }
        if (
          window.confirm(
            "¿Querés limpiar el presupuesto actual? Esta acción no se puede deshacer."
          )
        ) {
          clearBudget();
        }
      });
    }

    const pdfBtn = document.getElementById("downloadPdfBtn");
    if (pdfBtn) {
      pdfBtn.addEventListener("click", downloadPdf);
    }

    initCartButtonScroll();
    initHistoryFilters();

    renderBudgetTable();
    updateSavedTables();
    updateDashboardCounts();
  }

  // Esta función la usan Clientes para refrescar el select de cliente en Historial
  function refreshHistoryClientFilter() {
    populateHistoryClientFilter();
    updateSavedTables();
  }
  
    // --- ELIMINAR PRESUPUESTO GUARDADO ---
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".js-deleteBudget");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    if (!id) return;

    if (!window.confirm("¿Seguro que querés eliminar este presupuesto?")) {
      return;
    }

    // Usamos las funciones internas correctas
    let list = loadBudgets();
    list = list.filter((b) => b.id !== id);
    saveBudgets(list);

    // Actualizamos todas las vistas que dependen de los presupuestos
    updateSavedTables();

    Core.showToast("Presupuesto eliminado", "success");
  });

  window.Budgets = {
    init,
    addProductById,
    applyConfig,
    getTodayCount,
    refreshHistoryClientFilter,
  };
})();
