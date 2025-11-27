// orders.js
(function () {
  const STORAGE_ORDERS = "orders";

  function $(id) {
    return document.getElementById(id);
  }

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
      alert(message);
    }
  }

  function loadOrders() {
    return safeReadStorage(STORAGE_ORDERS, []) || [];
  }

  function saveOrders(list) {
    safeWriteStorage(STORAGE_ORDERS, list || []);
  }

  function generateId() {
    return "ord_" + Date.now().toString(36) + "_" + Math.random().toString(16).slice(2);
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function computeOrderStatus(order) {
    if (!order || !order.items || order.items.length === 0) return "vacio";
    const total = order.items.length;
    const received = order.items.filter((it) => it.received).length;
    if (received === 0) return "pendiente";
    if (received >= total) return "completo";
    return "parcial";
  }

  // Lee lo que está en el presupuesto actual y lo convierte en "pedido"
  function readCurrentBudgetAsOrder() {
    const tbody = $("budgetItemsBody");
    if (!tbody) {
      showToast("No se encontró la tabla del presupuesto.", "error");
      return null;
    }
    const rows = Array.from(tbody.querySelectorAll("tr"));
    if (rows.length === 0) {
      showToast("El presupuesto está vacío. Agregá productos antes de pasar a pedidos.", "error");
      return null;
    }

    const items = [];
    rows.forEach((row, idx) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 5) return;
      const nameCell = cells[1];
      const qtyCell = cells[3];
      const subtotalCell = cells[4];

      const rawName = (nameCell.textContent || "").trim();
      const name = rawName.replace(/\(custom\)/i, "").trim();
      const qty = parseFloat((qtyCell.textContent || "1").replace(/[^\d.,]/g, "").replace(",", "."));
      const subtotal = parseFloat((subtotalCell.textContent || "0").replace(/[^\d.,]/g, "").replace(",", "."));

      if (!name) return;
      const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
      const unitPrice = safeQty ? subtotal / safeQty : subtotal;

      items.push({
        id: generateId() + "_item" + idx,
        name,
        qty: safeQty,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
        subtotal: Number.isFinite(subtotal) ? subtotal : 0,
        received: false,
      });
    });

    if (items.length === 0) {
      showToast("No se pudieron leer los ítems del presupuesto.", "error");
      return null;
    }

    const clientPreviewEl = $("budgetDocClientPreview") || $("budgetClient");
    const datePreviewEl = $("budgetDocDatePreview") || $("budgetDate");
    const numberEl = $("budgetDocNumber");

    const clientName = clientPreviewEl
      ? (clientPreviewEl.value || clientPreviewEl.textContent || "").trim()
      : "";
    const dateRaw = datePreviewEl
      ? (datePreviewEl.value || datePreviewEl.textContent || "").trim()
      : "";
    const number =
      numberEl && (numberEl.textContent || "").trim()
        ? (numberEl.textContent || "").trim()
        : "";

    const createdAt = todayISO();

    const order = {
      id: generateId(),
      number: number || null,
      clientName: clientName || "Sin nombre",
      createdAt,
      budgetDate: dateRaw || createdAt,
      paymentDate: createdAt, // asumimos que la venta se concreta hoy
      deliveryDate: null,
      status: "pendiente",
      items,
    };

    order.status = computeOrderStatus(order);
    return order;
  }

  function addCurrentBudgetAsOrder() {
    const order = readCurrentBudgetAsOrder();
    if (!order) return;
    const list = loadOrders();
    list.push(order);
    saveOrders(list);
    renderOrdersTable();
    renderRecepcionesTable();
    showToast("Pedido creado a partir del presupuesto actual.", "success");
  }

  function formatDateShort(iso) {
    if (!iso) return "—";
    if (iso.includes("/")) return iso;
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }

  // Tabla de Pedidos
  function renderOrdersTable() {
    const tbody = $("ordersTableBody");
    if (!tbody) return;
    const list = loadOrders();
    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; font-size:0.85rem; color:#6b7280;">
            No hay pedidos cargados todavía.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list
      .map((ord) => {
        const status = computeOrderStatus(ord);
        const statusLabel =
          status === "completo"
            ? "Completo"
            : status === "parcial"
            ? "Parcial"
            : status === "pendiente"
            ? "Pendiente"
            : "Vacío";

        return `
          <tr data-order-id="${ord.id}">
            <td>${ord.number || "—"}</td>
            <td>${ord.clientName}</td>
            <td>${formatDateShort(ord.paymentDate || ord.budgetDate)}</td>
            <td>${formatDateShort(ord.deliveryDate)}</td>
            <td>
              <span class="status-dot status-dot--${status}"></span>
              <span class="status-label">${statusLabel}</span>
            </td>
            <td style="text-align:right;">
              <button class="btn btn--ghost btn-sm js-order-detail" data-order-id="${ord.id}">
                Detalle
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // Tabla de Recepción
  function renderRecepcionesTable() {
    const tbody = $("recepcionesTableBody");
    if (!tbody) return;
    const list = loadOrders();
    const rows = [];

    list.forEach((ord) => {
      if (!ord.items || !ord.items.length) return;
      ord.items.forEach((item) => {
        rows.push({
          orderId: ord.id,
          orderNumber: ord.number,
          clientName: ord.clientName,
          name: item.name,
          qty: item.qty,
          received: !!item.received,
        });
      });
    });

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; font-size:0.85rem; color:#6b7280;">
            No hay ítems pendientes de recepción.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rows
      .map((row) => {
        const safeName = row.name.replace(/"/g, "&quot;");
        return `
          <tr data-order-id="${row.orderId}" data-item-name="${safeName}">
            <td>${row.orderNumber || "—"}</td>
            <td>${row.clientName}</td>
            <td>${row.name}</td>
            <td>${row.qty}</td>
            <td style="text-align:center;">
              <label class="recepcion-toggle">
                <input
                  type="checkbox"
                  class="js-recepcion-toggle"
                  data-order-id="${row.orderId}"
                  data-item-name="${safeName}"
                  ${row.received ? "checked" : ""}
                />
                <span class="recepcion-toggle__fake ${row.received ? "recepcion-toggle__fake--checked" : ""}"></span>
              </label>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  function openOrderDetail(orderId) {
    const list = loadOrders();
    const order = list.find((o) => o.id === orderId);
    if (!order) return;

    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");
    if (!modalBody || !modalTitle) return;

    modalTitle.textContent = `Pedido ${order.number || ""} – ${order.clientName}`;

    let html = `
      <p><strong>Fecha presupuesto:</strong> ${formatDateShort(order.budgetDate)}</p>
      <p><strong>Fecha pago / seña:</strong> ${formatDateShort(order.paymentDate)}</p>
      <p><strong>Fecha entrega estimada:</strong> ${formatDateShort(order.deliveryDate)}</p>
      <hr style="margin:0.75rem 0;" />
      <h4>Productos incluidos</h4>
      <ul style="padding-left:1.1rem; margin:0.4rem 0;">
    `;

    order.items.forEach((it) => {
      html += `<li>${it.name} · ${it.qty} u.</li>`;
    });

    html += "</ul>";

    modalBody.innerHTML = html;

    const modal = document.getElementById("genericModal");
    if (modal) {
      modal.setAttribute("aria-hidden", "false");
      modal.classList.add("modal--open");
    }
  }

  function toggleItemReceived(orderId, itemName, checked) {
    const list = loadOrders();
    const order = list.find((o) => o.id === orderId);
    if (!order || !order.items) return;
    const item = order.items.find((it) => it.name === itemName);
    if (!item) return;
    item.received = checked;
    order.status = computeOrderStatus(order);
    saveOrders(list);
    renderOrdersTable();
  }

  function attachEvents() {
    const sendToOrdersBtn = $("sendToOrdersBtn");
    if (sendToOrdersBtn) {
      sendToOrdersBtn.addEventListener("click", addCurrentBudgetAsOrder);
    }

    const ordersTable = $("ordersTableBody");
    if (ordersTable) {
      ordersTable.addEventListener("click", function (evt) {
        const btn = evt.target.closest(".js-order-detail");
        if (btn) {
          const id = btn.getAttribute("data-order-id");
          if (id) openOrderDetail(id);
        }
      });
    }

    const recepTable = $("recepcionesTableBody");
    if (recepTable) {
      recepTable.addEventListener("change", function (evt) {
        const input = evt.target;
        if (!(input instanceof HTMLInputElement)) return;
        if (!input.classList.contains("js-recepcion-toggle")) return;
        const orderId = input.getAttribute("data-order-id");
        const itemName = input.getAttribute("data-item-name");
        if (!orderId || !itemName) return;
        toggleItemReceived(orderId, itemName, input.checked);
        renderRecepcionesTable();
      });
    }
  }

  function init() {
    renderOrdersTable();
    renderRecepcionesTable();
    attachEvents();
  }

  document.addEventListener("DOMContentLoaded", init);

  window.Orders = {
    addCurrentBudgetAsOrder,
    renderOrdersTable,
    renderRecepcionesTable,
  };
})();
