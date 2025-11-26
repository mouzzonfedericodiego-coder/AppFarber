// core.js
(function () {
  const THEME_KEY = "farberTheme";
  const STORAGE_PREFIX = "farberPro_";

  function storageKey(key) {
    return STORAGE_PREFIX + key;
  }

  // ====== UTILS ======
  function normalizarTexto(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function formatMoney(num) {
    const n = Number(num) || 0;
    return (
      "$ " +
      n
        .toFixed(0)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    );
  }

  function generateId(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(16)
      .slice(2)}`;
  }

  function readStorage(key, defaultValue) {
    try {
      const raw = localStorage.getItem(storageKey(key));
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(value));
    } catch {
      // ignore
    }
  }

  // ====== TOASTS ======
  let toastContainer = null;

  function ensureToastContainer() {
    if (!toastContainer) {
      toastContainer = document.getElementById("toastContainer");
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.className = "toast-container";
        document.body.appendChild(toastContainer);
      }
    }
  }

  function showToast(message, type = "info") {
    ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;

    const iconSpan = document.createElement("span");
    iconSpan.className = "toast__icon";
    iconSpan.textContent =
      type === "success" ? "✔" : type === "error" ? "⚠" : "ℹ";

    const textSpan = document.createElement("span");
    textSpan.className = "toast__text";
    textSpan.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.className = "toast__close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => {
      toast.remove();
    });

    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    toast.appendChild(closeBtn);

    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
  }

  // ====== LOADER ======
  function createLoader() {
    let loader = document.getElementById("appLoader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "appLoader";
      loader.className = "loader";
      document.body.appendChild(loader);
    }

    loader.innerHTML = `
      <div class="loader__inner">
        <div class="loader__logo"></div>
        <div class="loader__bar">
          <div class="loader__bar-fill"></div>
        </div>
        <p class="loader__text">Cargando panel de presupuestos...</p>
      </div>
    `;

    window.addEventListener("load", () => {
      setTimeout(() => {
        loader.classList.add("loader--hide");
        setTimeout(() => loader.remove(), 450);
      }, 3000);
    });
  }

  // ====== TEMA ======
  function applyTheme(theme) {
    const darkOn = theme === "dark";
    document.body.classList.toggle("theme-dark", darkOn);

    const toggle = document.getElementById("themeToggle");
    const label = document.getElementById("themeLabelMode");

    if (toggle) toggle.checked = darkOn;
    if (label) label.textContent = darkOn ? "Oscuro" : "Claro";
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      saved = null;
    }

    if (!saved) {
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;
      saved = prefersDark ? "dark" : "light";
    }

    applyTheme(saved);

    const toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.addEventListener("change", () => {
        const darkOn = toggle.checked;
        const theme = darkOn ? "dark" : "light";
        applyTheme(theme);
        try {
          localStorage.setItem(THEME_KEY, theme);
        } catch {
          // ignore
        }
      });
    }
  }

  // ====== NAV / SIDEBAR / MODAL ======
  function initNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const navLinks = document.querySelectorAll(".js-nav-link");
    const sections = document.querySelectorAll(".section");

    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar--open");
      });
    }

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const sectionName = link.getAttribute("data-section");
        if (!sectionName) return;

        navLinks.forEach((l) =>
          l.classList.remove("sidebar__link--active")
        );
        link.classList.add("sidebar__link--active");

        sections.forEach((section) => {
          if (section.id === `section-${sectionName}`) {
            section.classList.add("section--active");
          } else {
            section.classList.remove("section--active");
          }
        });

        if (
          window.innerWidth <= 960 &&
          sidebar &&
          sidebar.classList.contains("sidebar--open")
        ) {
          sidebar.classList.remove("sidebar--open");
        }
      });
    });

    // Plataforma fullscreen
    const layoutRoot = document.getElementById("layoutRoot");
    const toggleEmbedFull = document.getElementById("toggleEmbedFull");
    if (layoutRoot && toggleEmbedFull) {
      toggleEmbedFull.addEventListener("click", () => {
        const isFull =
          toggleEmbedFull.getAttribute("data-fullscreen") === "on";
        if (isFull) {
          layoutRoot.classList.remove("layout--embed-full");
          toggleEmbedFull.setAttribute("data-fullscreen", "off");
          toggleEmbedFull.textContent = "Pantalla completa";
        } else {
          layoutRoot.classList.add("layout--embed-full");
          toggleEmbedFull.setAttribute("data-fullscreen", "on");
          toggleEmbedFull.textContent = "Salir de pantalla completa";
        }
      });
    }

    // Modal genérico
    const modal = document.getElementById("genericModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    function openModal(title, body) {
      if (!modal) return;
      if (modalTitle) modalTitle.textContent = title || "Detalle";
      if (modalBody) modalBody.textContent = body || "";
      modal.classList.add("modal--open");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove("modal--open");
      modal.setAttribute("aria-hidden", "true");
    }

    window.CoreOpenModal = openModal;

    const modalTriggers = document.querySelectorAll(".js-open-modal");
    modalTriggers.forEach((btn) => {
      btn.addEventListener("click", () => {
        const title = btn.getAttribute("data-modal-title") || "";
        const body = btn.getAttribute("data-modal-body") || "";
        openModal(title, body);
      });
    });

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
  }

  // ====== VIDEOS PRODUCTO ======
  function initProductVideos() {
    const productVideos = document.querySelectorAll(".js-product-video");
    productVideos.forEach((video) => {
      video.addEventListener("mouseenter", () => {
        video.play().catch(() => {});
      });

      video.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
      });

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
  }

  // ====== DASHBOARD HELPERS (actualizado desde otros módulos) ======
  function setDashboardCounts({ budgetsToday, clients, products }) {
    const elBud = document.getElementById("dashTodayBudgets");
    const elCli = document.getElementById("dashClientsCount");
    const elProd = document.getElementById("dashProductsCount");

    if (elBud) elBud.textContent = budgetsToday ?? 0;
    if (elCli) elCli.textContent = clients ?? 0;
    if (elProd) elProd.textContent = products ?? 0;
  }

  // ====== INIT ======
  function init() {
    createLoader();
    initTheme();
    initNavigation();
    initProductVideos();
  }

  window.Core = {
    init,
    normalizarTexto,
    formatMoney,
    generateId,
    readStorage,
    writeStorage,
    showToast,
    initProductVideos,
    setDashboardCounts,
  };
})();
