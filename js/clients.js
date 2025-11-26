// clients.js
(function () {
  const STORAGE_KEY = "clients";

  // ---- Storage básico ----
  function load() {
    return Core.readStorage(STORAGE_KEY, []);
  }

  function save(list) {
    Core.writeStorage(STORAGE_KEY, list);
  }

  function getById(id) {
    return load().find((c) => c.id === id) || null;
  }

  // ---- Helpers para presupuestos ----
  function getBudgets() {
    // Leemos directo el storage de presupuestos
    return Core.readStorage("budgets", []);
  }

  function getBudgetCountByClientId(clientId) {
    if (!clientId) return 0;
    const budgets = getBudgets();
    return budgets.filter((b) => b.clientId === clientId).length;
  }

  // Devuelve id del cliente cuyo nombre coincide (case-insensitive)
  function resolveClientIdByName(name) {
    if (!name) return null;
    const norm = Core.normalizarTexto(name);
    const clients = load();
    const found = clients.find(
      (c) => Core.normalizarTexto(c.name) === norm
    );
    return found ? found.id : null;
  }

  // ---- Render de tabla ----
  function renderTable() {
    const tbody = document.querySelector("#clientsTable tbody");
    if (!tbody) return;

    const searchInput = document.getElementById("clientsSearch");
    const text = searchInput
      ? Core.normalizarTexto(searchInput.value || "")
      : "";

    const clients = load();
    const budgets = getBudgets();

    const withCounts = clients.map((c) => {
      const count = budgets.filter((b) => b.clientId === c.id).length;
      return { ...c, budgetsCount: count };
    });

    let filtered = withCounts;
    if (text) {
      filtered = withCounts.filter((c) => {
        const base = Core.normalizarTexto(
          `${c.name} ${c.contact} ${c.email} ${c.phone}`
        );
        return base.includes(text);
      });
    }

    tbody.innerHTML = "";
    filtered.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.name}</td>
        <td>${c.contact || "-"}</td>
        <td>${c.email || "-"}</td>
        <td>${c.phone || "-"}</td>
        <td>${c.budgetsCount || 0}</td>
        <td style="white-space:nowrap;display:flex;gap:4px;">
          <button class="btn btn--ghost btn--small js-edit-client" data-id="${c.id}">
            Editar
          </button>
          <button class="btn btn--ghost btn--small js-delete-client" data-id="${c.id}">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Editar
    tbody.querySelectorAll(".js-edit-client").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const client = getById(id);
        if (!client) return;
        fillForm(client);
        Core.showToast("Cliente cargado en el formulario.", "info");
      });
    });

    // Eliminar
    tbody.querySelectorAll(".js-delete-client").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const clients = load();
        const client = clients.find((c) => c.id === id);
        if (!client) return;

        const used = getBudgetCountByClientId(id) > 0;
        const msg = used
          ? "Este cliente tiene presupuestos asociados. ¿Seguro que querés eliminarlo? Los presupuestos guardados conservarán el nombre, pero perderán el vínculo."
          : "¿Seguro que querés eliminar este cliente?";

        if (!window.confirm(msg)) return;

        const updated = clients.filter((c) => c.id !== id);
        save(updated);
        fillForm(null);
        renderTable();
        updateDashboardCounts();
        Core.showToast("Cliente eliminado.", "success");
        // Actualizamos filtros de historial
        if (window.Budgets && typeof Budgets.refreshHistoryClientFilter === "function") {
          Budgets.refreshHistoryClientFilter();
        }
      });
    });
  }

  // ---- Formulario ----
  function fillForm(client) {
    const idInput = document.getElementById("clientId");
    const nameInput = document.getElementById("clientName");
    const contactInput = document.getElementById("clientContact");
    const emailInput = document.getElementById("clientEmail");
    const phoneInput = document.getElementById("clientPhone");
    const notesInput = document.getElementById("clientNotes");

    if (!idInput || !nameInput) return;

    if (!client) {
      idInput.value = "";
      nameInput.value = "";
      if (contactInput) contactInput.value = "";
      if (emailInput) emailInput.value = "";
      if (phoneInput) phoneInput.value = "";
      if (notesInput) notesInput.value = "";
      return;
    }

    idInput.value = client.id || "";
    nameInput.value = client.name || "";
    if (contactInput) contactInput.value = client.contact || "";
    if (emailInput) emailInput.value = client.email || "";
    if (phoneInput) phoneInput.value = client.phone || "";
    if (notesInput) notesInput.value = client.notes || "";
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const idInput = document.getElementById("clientId");
    const nameInput = document.getElementById("clientName");
    const contactInput = document.getElementById("clientContact");
    const emailInput = document.getElementById("clientEmail");
    const phoneInput = document.getElementById("clientPhone");
    const notesInput = document.getElementById("clientNotes");

    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) {
      Core.showToast("El nombre del cliente es obligatorio.", "error");
      return;
    }

    const idExisting = idInput?.value || "";
    const isEdit = Boolean(idExisting);
    const clients = load();

    let clientId = idExisting;
    if (!clientId) {
      clientId = Core.generateId("cli");
    }

    const newClient = {
      id: clientId,
      name,
      contact: contactInput?.value.trim() || "",
      email: emailInput?.value.trim() || "",
      phone: phoneInput?.value.trim() || "",
      notes: notesInput?.value.trim() || "",
      createdAt: new Date().toISOString(),
    };

    let newList;
    if (isEdit) {
      const idx = clients.findIndex((c) => c.id === clientId);
      if (idx >= 0) {
        newList = [...clients];
        newList[idx] = newClient;
      } else {
        newList = [...clients, newClient];
      }
    } else {
      newList = [...clients, newClient];
    }

    save(newList);
    fillForm(null);
    renderTable();
    updateDashboardCounts();

    Core.showToast(
      isEdit ? "Cliente actualizado." : "Cliente creado.",
      "success"
    );

    // Actualizar select de clientes en Historial
    if (window.Budgets && typeof Budgets.refreshHistoryClientFilter === "function") {
      Budgets.refreshHistoryClientFilter();
    }
  }

  // ---- Dashboard ----
  function updateDashboardCounts() {
    Core.setDashboardCounts({
      budgetsToday: window.Budgets?.getTodayCount?.() ?? 0,
      clients: load().length,
      products: window.Products?.getAll?.().length ?? 0,
    });
  }

  // ---- Inicialización ----
  function init() {
    const form = document.getElementById("clientForm");
    const resetBtn = document.getElementById("clientFormReset");
    const searchInput = document.getElementById("clientsSearch");

    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        fillForm(null);
        Core.showToast("Formulario limpiado.", "info");
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", renderTable);
    }

    renderTable();
    updateDashboardCounts();
  }

  window.Clients = {
    init,
    load,
    getById,
    resolveClientIdByName,
  };
})();
