// Toggle del menú en mobile
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

if (menuToggle && sidebar) {
  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar--open");
  });
}

// Cambio de secciones al hacer clic en el sidebar
const navLinks = document.querySelectorAll(".js-nav-link");
const sections = document.querySelectorAll(".section");

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();

    const sectionName = link.getAttribute("data-section");
    if (!sectionName) return;

    // Activo en el menú
    navLinks.forEach((l) => l.classList.remove("sidebar__link--active"));
    link.classList.add("sidebar__link--active");

    // Mostrar la sección correspondiente
    sections.forEach((section) => {
      if (section.id === `section-${sectionName}`) {
        section.classList.add("section--active");
      } else {
        section.classList.remove("section--active");
      }
    });

    // En móvil, cerramos el menú al elegir una opción
    if (window.innerWidth <= 768 && sidebar.classList.contains("sidebar--open")) {
      sidebar.classList.remove("sidebar--open");
    }
  });
});

// Modal genérico
const modal = document.getElementById("genericModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

function openModal(title, body) {
  if (!modal) return;
  if (modalTitle) modalTitle.textContent = title || "Detalle";
  if (modalBody) modalBody.textContent = body || "Contenido de ejemplo...";
  modal.classList.add("modal--open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("modal--open");
  modal.setAttribute("aria-hidden", "true");
}

// Abrir modal al hacer clic en botones con .js-open-modal
const modalTriggers = document.querySelectorAll(".js-open-modal");
modalTriggers.forEach((btn) => {
  btn.addEventListener("click", () => {
    const title = btn.getAttribute("data-modal-title") || "";
    const body = btn.getAttribute("data-modal-body") || "";
    openModal(title, body);
  });
});

// Cerrar modal (botones y fondo)
if (modal) {
  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (
      target.classList.contains("js-modal-close") ||
      target.getAttribute("data-close") === "backdrop"
    ) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("modal--open")) {
      closeModal();
    }
  });
}

// Búsqueda simple y filtro por estado en la tabla de presupuestos del Dashboard
function normalizarTexto(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const searchInputs = document.querySelectorAll(".js-search-input");
const filterSelects = document.querySelectorAll(".js-filter-select");

// Filtro por texto
searchInputs.forEach((input) => {
  input.addEventListener("input", () => {
    const tableId = input.getAttribute("data-table-id");
    const table = tableId ? document.getElementById(tableId) : null;
    if (!table) return;

    const filterText = normalizarTexto(input.value || "");
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row) => {
      const cellsText = normalizarTexto(row.innerText || "");
      const matchesText = cellsText.includes(filterText);
      row.dataset.textMatch = matchesText ? "1" : "0";
      actualizarVisibilidadFila(row);
    });
  });
});

// Filtro por estado (Aprobado, En revisión, Borrador)
filterSelects.forEach((select) => {
  select.addEventListener("change", () => {
    const tableId = select.getAttribute("data-table-id");
    const table = tableId ? document.getElementById(tableId) : null;
    if (!table) return;

    const filterValue = select.value;
    const rows = table.querySelectorAll("tbody tr");

    rows.forEach((row) => {
      const estadoCell = row.querySelector("td:nth-child(4)");
      const estadoText = estadoCell ? estadoCell.innerText.trim() : "";
      const matchesEstado = !filterValue || estadoText === filterValue;
      row.dataset.estadoMatch = matchesEstado ? "1" : "0";
      actualizarVisibilidadFila(row);
    });
  });
});

// Combinar filtros de texto + estado
function actualizarVisibilidadFila(row) {
  const textMatch = row.dataset.textMatch !== "0"; // por defecto true
  const estadoMatch = row.dataset.estadoMatch !== "0"; // por defecto true
  if (textMatch && estadoMatch) {
    row.style.display = "";
  } else {
    row.style.display = "none";
  }
}

// ========= PANTALLA COMPLETA PARA LA PLATAFORMA =========
const layoutRoot = document.getElementById("layoutRoot");
const toggleEmbedFull = document.getElementById("toggleEmbedFull");

if (layoutRoot && toggleEmbedFull) {
  toggleEmbedFull.addEventListener("click", () => {
    const isFull = toggleEmbedFull.getAttribute("data-fullscreen") === "on";

    if (isFull) {
      // Salir del modo pantalla completa
      layoutRoot.classList.remove("layout--embed-full");
      toggleEmbedFull.setAttribute("data-fullscreen", "off");
      toggleEmbedFull.textContent = "Pantalla completa";
    } else {
      // Entrar en modo pantalla completa
      layoutRoot.classList.add("layout--embed-full");
      toggleEmbedFull.setAttribute("data-fullscreen", "on");
      toggleEmbedFull.textContent = "Salir de pantalla completa";
    }
  });
}

// ========= TEMA CLARO / OSCURO =========
const themeToggle = document.getElementById("themeToggle");
const themeLabelMode = document.getElementById("themeLabelMode");

if (themeToggle) {
  themeToggle.addEventListener("change", () => {
    const darkOn = themeToggle.checked;
    document.body.classList.toggle("theme-dark", darkOn);
    if (themeLabelMode) {
      themeLabelMode.textContent = darkOn ? "Oscuro" : "Claro";
    }
  });
}

// ========= ANIMACIÓN VIDEOS DE PRODUCTOS (hover) =========
const productVideos = document.querySelectorAll(".js-product-video");

productVideos.forEach((video) => {
  // Desktop: reproducir al pasar el mouse
  video.addEventListener("mouseenter", () => {
    video.play().catch(() => {});
  });

  video.addEventListener("mouseleave", () => {
    video.pause();
    video.currentTime = 0;
  });

  // Mobile: tocar para reproducir/pausar
  video.addEventListener(
    "touchstart",
    () => {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    },
    { passive: true }
  );
});
