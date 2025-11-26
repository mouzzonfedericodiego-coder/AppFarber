// products.js
(function () {
  const PRODUCT_CATALOG = [
    {
      id: "dubai-negro",
      name: "Estación DUBAI negra",
      code: "DUBAI-NEGRO",
      category: "Estaciones",
      price: 350000,
      poster: "assets/product_images/dubai_negro.webp",
      video: "assets/videos/dubai_negro.mp4",
    },
    {
      id: "dubai-blanco",
      name: "Estación DUBAI blanca",
      code: "DUBAI-BLANCO",
      category: "Estaciones",
      price: 360000,
      poster: "assets/product_images/dubai_negro.webp",
      video: "assets/videos/dubai_negro.mp4",
    },
    {
      id: "zen-ergo",
      name: "Silla Zen Ergo",
      code: "ZEN-ERGO",
      category: "Sillas",
      price: 120000,
      poster: "assets/product_images/zen_ergo_negro.webp",
      video: "assets/videos/zen_ergo_negro.mp4",
    },
    {
      id: "silla-nordica",
      name: "Silla Nórdica madera",
      code: "NORDICA-MAD",
      category: "Sillas",
      price: 110000,
      poster: "assets/product_images/zen_ergo_negro.webp",
      video: "assets/videos/zen_ergo_negro.mp4",
    },
    {
      id: "armario-bajo",
      name: "Armario bajo puerta batiente",
      code: "ARM-BAJO",
      category: "Armarios",
      price: 95000,
      poster: "assets/product_images/armario_bajo_puerta_batiente.webp",
      video: "assets/videos/ram.mp4",
    },
    {
      id: "biblioteca-baja",
      name: "Biblioteca baja 2 puertas",
      code: "BIB-BAJA",
      category: "Armarios",
      price: 98000,
      poster: "assets/product_images/armario_bajo_puerta_batiente.webp",
      video: "assets/videos/ram.mp4",
    },
  ];

  function getAll() {
    return [...PRODUCT_CATALOG];
  }

  function getById(id) {
    return PRODUCT_CATALOG.find((p) => p.id === id) || null;
  }

  function renderProductsGrid() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const items = PRODUCT_CATALOG.map((p) => {
      const meta = `${p.category} · Código ${p.code}`;
      const price = Core.formatMoney(p.price);
      return `
        <article class="product-card">
          <div class="product-card__image-placeholder">
            ${p.category}
          </div>
          <h3 class="product-card__title">${p.name}</h3>
          <p class="product-card__meta">${meta}</p>
          <p class="product-card__price">${price}</p>
          <button
            class="btn btn--ghost btn--small js-open-modal"
            data-modal-title="${p.name}"
            data-modal-body="Editar ${p.name}: código ${p.code}, categoría ${p.category}, precio ${price}."
          >
            Editar
          </button>
        </article>
      `;
    }).join("");

    grid.innerHTML = items;

    // Enganchar modales
    const buttons = grid.querySelectorAll(".js-open-modal");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const title = btn.getAttribute("data-modal-title") || "";
        const body = btn.getAttribute("data-modal-body") || "";
        window.CoreOpenModal?.(title, body);
      });
    });
  }

  // ----- CATÁLOGO PRESUPUESTOS -----
  let catalogSearchInput,
    catalogCategorySelect,
    catalogSortSelect,
    catalogResetBtn,
    catalogGrid;

  function buildCatalogCard(p) {
    const meta = `${p.category} · Código ${p.code}`;
    const price = Core.formatMoney(p.price);
    return `
      <article
        class="quote-product quote-product--reflected"
        data-product-id="${p.id}"
        data-product-name="${p.name}"
        data-product-price="${p.price}"
        data-product-category="${p.category}"
      >
        <div class="quote-product__media">
          <video
            class="quote-product__video js-product-video"
            muted
            loop
            preload="metadata"
            poster="${p.poster}"
          >
            <source src="${p.video}" type="video/mp4" />
          </video>
          <div class="quote-product__overlay">
            <span class="quote-product__overlay-label">Ver vista</span>
          </div>
        </div>
        <div class="quote-product__body">
          <h4 class="quote-product__title">${p.name}</h4>
          <p class="quote-product__meta">${meta}</p>
          <p class="quote-product__price">${price}</p>
          <button class="btn btn--ghost btn--small js-add-product" type="button">
            Agregar
          </button>
        </div>
      </article>
    `;
  }

  function renderCatalogGrid(productsToRender) {
    if (!catalogGrid) return;

    if (!productsToRender.length) {
      catalogGrid.innerHTML = `
        <p style="font-size:0.85rem; color:#9ca3af; grid-column:1/-1;">
          No se encontraron productos con esos filtros.
        </p>
      `;
    } else {
      catalogGrid.innerHTML = productsToRender.map(buildCatalogCard).join("");
    }

    Core.initProductVideos();

    // Botón agregar → Presupuesto
    const cards = catalogGrid.querySelectorAll(".quote-product");
    cards.forEach((card) => {
      const btn = card.querySelector(".js-add-product");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const id = card.getAttribute("data-product-id");
        if (!id) return;
        if (window.Budgets && typeof Budgets.addProductById === "function") {
          Budgets.addProductById(id);
        } else {
          Core.showToast("El módulo de presupuestos aún no está listo.", "error");
        }
      });
    });
  }

  function applyCatalogFilters() {
    let filtered = getAll();

    if (catalogSearchInput) {
      const text = Core.normalizarTexto(catalogSearchInput.value || "");
      if (text) {
        filtered = filtered.filter((p) => {
          const base = Core.normalizarTexto(
            `${p.name} ${p.code} ${p.category}`
          );
          return base.includes(text);
        });
      }
    }

    if (catalogCategorySelect) {
      const cat = catalogCategorySelect.value;
      if (cat) {
        filtered = filtered.filter((p) => p.category === cat);
      }
    }

    if (catalogSortSelect) {
      const sort = catalogSortSelect.value;
      if (sort === "priceAsc") {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sort === "priceDesc") {
        filtered.sort((a, b) => b.price - a.price);
      }
    }

    renderCatalogGrid(filtered);
  }

  function initCatalogModule() {
    catalogSearchInput = document.getElementById("catalogSearch");
    catalogCategorySelect = document.getElementById("catalogCategory");
    catalogSortSelect = document.getElementById("catalogSort");
    catalogResetBtn = document.getElementById("catalogResetBtn");
    catalogGrid = document.getElementById("catalogGrid");

    if (!catalogGrid) return;

    if (catalogSearchInput) {
      catalogSearchInput.addEventListener("input", applyCatalogFilters);
    }
    if (catalogCategorySelect) {
      catalogCategorySelect.addEventListener("change", applyCatalogFilters);
    }
    if (catalogSortSelect) {
      catalogSortSelect.addEventListener("change", applyCatalogFilters);
    }
    if (catalogResetBtn) {
      catalogResetBtn.addEventListener("click", () => {
        if (catalogSearchInput) catalogSearchInput.value = "";
        if (catalogCategorySelect) catalogCategorySelect.value = "";
        if (catalogSortSelect) catalogSortSelect.value = "";
        applyCatalogFilters();
      });
    }

    applyCatalogFilters();
  }

  function init() {
    renderProductsGrid();
    initCatalogModule();

    // Dashboard: cantidad de productos
    if (window.Core && typeof Core.setDashboardCounts === "function") {
      const prev = { budgetsToday: 0, clients: 0, products: getAll().length };
      Core.setDashboardCounts(prev);
    }
  }

  window.Products = {
    init,
    getAll,
    getById,
  };
})();
