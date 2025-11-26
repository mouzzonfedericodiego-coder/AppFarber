// clients.js
(function () {
  const STORAGE_KEY = "clients";

  function loadClients() {
    return Core.readStorage(STORAGE_KEY, []);
  }

  function saveClients(list) {
    Core.writeStorage(STORAGE_KEY, list);
  }

  function renderClientsTable() {
    const tbody = document.querySelector("#clientsTable tbody");
    if (!tbody) return;

    const clients = loadClients();
    tbody.innerHTML = "";

    clients.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.name || ""}</td>
        <td>${c.cuit || ""}</td>
        <td>${c.contact || ""}</td>
        <td>${c.phone || ""}</td>
        <td>
          <button class="btn btn--ghost btn--small" data-id="${c.id}">
            Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Eliminar
    tbody.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const updated = loadClients().filter((c) => c.id !== id);
        saveClients(updated);
        renderClientsTable();
        updateClientsDatalist();
        Core.showToast("Cliente eliminado.", "info");
        updateDashboardCounts();
      });
    });
  }

  function updateClientsDatalist() {
    const dl = document.getElementById("clientsDatalist");
    if (!dl) return;

    const clients = loadClients();
    dl.innerHTML = clients
      .map(
        (c) =>
          `<option value="${c.name || ""}">${
            c.cuit ? "CUIT: " + c.cuit : ""
          }</option>`
      )
      .join("");
  }

  function updateDashboardCounts() {
    const clients = loadClients().length;
    const products = Products.getAll().length;
    Core.setDashboardCounts({
      budgetsToday: window.Budgets?.getTodayCount?.() ?? 0,
      clients,
      products,
    });
  }

  function initForm() {
    const form = document.getElementById("clientForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("clientName")?.value.trim();
      const cuit = document.getElementById("clientCuit")?.value.trim();
      const contact = document.getElementById("clientContact")?.value.trim();
      const phone = document.getElementById("clientPhone")?.value.trim();

      if (!name) {
        Core.showToast("El nombre del cliente es obligatorio.", "error");
        return;
      }

      const list = loadClients();
      list.push({
        id: Core.generateId("cli"),
        name,
        cuit,
        contact,
        phone,
      });
      saveClients(list);

      form.reset();
      renderClientsTable();
      updateClientsDatalist();
      updateDashboardCounts();
      Core.showToast("Cliente guardado.", "success");
    });
  }

  function init() {
    renderClientsTable();
    updateClientsDatalist();
    initForm();
    updateDashboardCounts();
  }

  window.Clients = {
    init,
    load: loadClients,
  };
})();
