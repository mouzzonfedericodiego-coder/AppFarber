// products.js
(function () {
  // -------- Catálogo base (hardcodeado) --------
  const BASE_PRODUCTS = [
    {
      id: "dubai-negro",
      name: "Estación DUBAI negra",
      code: "DUBAI-NEGRO",
      category: "Estaciones",
      price: 350000,
      poster: "assets/product_images/dubai_negro.webp",
      video: "assets/videos/dubai_negro.mp4",
      hot: true,
      origin: "base",
    },
    {
      id: "dubai-blanco",
      name: "Estación DUBAI blanca",
      code: "DUBAI-BLANCO",
      category: "Estaciones",
      price: 360000,
      poster: "assets/product_images/dubai_negro.webp",
      video: "assets/videos/dubai_negro.mp4",
      hot: false,
      origin: "base",
    },
    {
      id: "zen-ergo",
      name: "Silla Zen Ergo",
      code: "ZEN-ERGO",
      category: "Sillas",
      price: 120000,
      poster: "assets/product_images/zen_ergo_negro.webp",
      video: "assets/videos/zen_ergo_negro.mp4",
      hot: true,
      origin: "base",
    },
    {
      id: "silla-nordica",
      name: "Silla Nórdica madera",
      code: "NORDICA-MAD",
      category: "Sillas",
      price: 110000,
      poster: "assets/product_images/zen_ergo_negro.webp",
      video: "assets/videos/zen_ergo_negro.mp4",
      hot: false,
      origin: "base",
    },
    {
      id: "armario-bajo",
      name: "Armario bajo puerta batiente",
      code: "ARM-BAJO",
      category: "Armarios",
      price: 95000,
      poster: "assets/product_images/armario_bajo_puerta_batiente.webp",
      video: "assets/videos/ram.mp4",
      hot: false,
      origin: "base",
    },
    {
      id: "biblioteca-baja",
      name: "Biblioteca baja 2 puertas",
      code: "BIB-BAJA",
      category: "Armarios",
      price: 98000,
      poster: "assets/product_images/armario_bajo_puerta_batiente.webp",
      video: "assets/videos/ram.mp4",
      hot: false,
      origin: "base",
    },
  ];

  const STORAGE_KEY = "productsCustom";

  // -------- Storage de productos creados por el usuario --------
  function loadCustomProducts() {
    return Core.readStorage(STORAGE_KEY, []);
  }

  function saveCustomProducts(list) {
    Core.writeStorage(STORAGE_KEY, list);
  }

  // -------- API pública --------
  function getAll() {
    const custom = loadCustomProducts();
    return [...BASE_PRODUCTS, ...custom];
  }

  function getById(id) {
    return getAll().find((p) => p.id === id) || null;
  }

  // -------- RENDER: tarjetas (vista rápida) --------
  function renderProductsGrid() {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    const all = getAll();
    const cards = all
      .map((p) => {
        const meta = `${p.category} · Código ${p.code || "s/c"}`;
        const price = Core.formatMoney(p.price);
        const hotBadge = p.hot
          ? `<span class="badge-hot">HOT</span>`
          : "";

        return `
        <article class="product-card">
          <div class="product-card__image-placeholder">
            ${p.category}
          </div>
          <h3 class="product-card__title">${p.name}</h3>
          <p class="product-card__meta">${meta}</p>
          <p class="product-card__price">${price}</p>
          <p class="products-admin-origin">
            ${hotBadge}
            ${p.origin === "user" ? "· Creado por vos" : "· Catálogo base"}
          </p>
        </article>
      `;
      })
      .join("");

    grid.innerHTML = cards;
  }

  // -------- RENDER: catálogo para Presupuestos --------
  let catalogSearchInput,
    catalogCategorySelect,
    catalogSortSelect,
    catalogResetBtn,
    catalogGrid;

  function buildCatalogCard(p) {
    const meta = `${p.category} · Código ${p.code || "s/c"}`;
    const price = Core.formatMoney(p.price);
    const poster =
      p.poster || "assets/product_images/zen_ergo_negro.webp";
    const video = p.video || "assets/videos/zen_ergo_negro.mp4";

    const badgeHot = p.hot
      ? `<span class="quote-product__badge-hot">HOT</span>`
      : "";

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
            poster="${poster}"
          >
            <source src="${video}" type="video/mp4" />
          </video>
          <div class="quote-product__overlay">
            <span class="quote-product__overlay-label">Ver vista</span>
          </div>
          ${badgeHot}
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
          Core.showToast(
            "El módulo de presupuestos aún no está listo.",
            "error"
          );
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

  // -------- MÓDULO ADMINISTRABLE --------
  function fillProductForm(product) {
    const idInput = document.getElementById("prodId");
    const nameInput = document.getElementById("prodName");
    const codeInput = document.getElementById("prodCode");
    const catInput = document.getElementById("prodCategory");
    const priceInput = document.getElementById("prodPrice");
    const posterInput = document.getElementById("prodPoster");
    const videoInput = document.getElementById("prodVideo");
    const hotInput = document.getElementById("prodHot");

    if (!product) {
      if (idInput) idInput.value = "";
      if (nameInput) nameInput.value = "";
      if (codeInput) codeInput.value = "";
      if (catInput) catInput.value = "Estaciones";
      if (priceInput) priceInput.value = "";
      if (posterInput) posterInput.value = "";
      if (videoInput) videoInput.value = "";
      if (hotInput) hotInput.checked = false;
      return;
    }

    if (idInput) idInput.value = product.id;
    if (nameInput) nameInput.value = product.name || "";
    if (codeInput) codeInput.value = product.code || "";
    if (catInput) catInput.value = product.category || "Estaciones";
    if (priceInput) priceInput.value = product.price || "";
    if (posterInput) posterInput.value = product.poster || "";
    if (videoInput) videoInput.value = product.video || "";
    if (hotInput) hotInput.checked = !!product.hot;
  }

  function renderProductsAdminTable() {
    const tbody = document.querySelector("#productsAdminTable tbody");
    if (!tbody) return;

    const all = getAll();
    tbody.innerHTML = "";

    all.forEach((p) => {
      const tr = document.createElement("tr");
      const hotLabel = p.hot ? "Sí" : "No";
      const originLabel =
        p.origin === "user" ? "Creado por vos" : "Catálogo base";

      const canEdit = p.origin === "user";
      const editBtn =
        `<button class="btn btn--ghost btn--small js-edit-product" data-id="${p.id}">Editar</button>`;
      const deleteBtn = canEdit
        ? `<button class="btn btn--ghost btn--small js-delete-product" data-id="${p.id}">Eliminar</button>`
        : "";

      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${Core.formatMoney(p.price)}</td>
        <td>${hotLabel}</td>
        <td class="products-admin-origin">${originLabel}</td>
        <td style="white-space:nowrap; display:flex; gap:4px;">
          ${editBtn}
          ${deleteBtn}
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Editar
    tbody.querySelectorAll(".js-edit-product").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const prod = getById(id);
        if (!prod) return;
        if (prod.origin !== "user") {
          Core.showToast(
            "Los productos del catálogo base solo se pueden ver, no editar.",
            "info"
          );
          return;
        }
        fillProductForm(prod);
        Core.showToast("Producto cargado en el formulario.", "info");
      });
    });

    // Eliminar
    tbody.querySelectorAll(".js-delete-product").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const list = loadCustomProducts();
        const exists = list.some((p) => p.id === id);
        if (!exists) {
          Core.showToast(
            "Solo se pueden eliminar productos creados por vos.",
            "error"
          );
          return;
        }
        if (
          !window.confirm(
            "¿Seguro que querés eliminar este producto? Los presupuestos ya guardados no se modifican."
          )
        ) {
          return;
        }
        const updated = list.filter((p) => p.id !== id);
        saveCustomProducts(updated);
        renderProductsAdminTable();
        renderProductsGrid();
        applyCatalogFilters();
        Core.showToast("Producto eliminado.", "success");
        updateDashboardCounts();
      });
    });
  }

  function handleProductFormSubmit(event) {
    event.preventDefault();
    const idInput = document.getElementById("prodId");
    const nameInput = document.getElementById("prodName");
    const codeInput = document.getElementById("prodCode");
    const catInput = document.getElementById("prodCategory");
    const priceInput = document.getElementById("prodPrice");
    const posterInput = document.getElementById("prodPoster");
    const videoInput = document.getElementById("prodVideo");
    const hotInput = document.getElementById("prodHot");

    const name = nameInput?.value.trim();
    if (!name) {
      Core.showToast("El nombre del producto es obligatorio.", "error");
      return;
    }

    const price = Number(priceInput?.value || 0);
    if (!price || price < 0) {
      Core.showToast("Indicá un precio válido.", "error");
      return;
    }

    const idExisting = idInput?.value || "";
    const isEdit = Boolean(idExisting);
    const customList = loadCustomProducts();

    let productId = idExisting;
    if (!productId) {
      productId = "custom-" + Core.generateId("prod");
    }

    const newProd = {
      id: productId,
      name,
      code: codeInput?.value.trim() || "",
      category: catInput?.value || "Estaciones",
      price,
      poster: posterInput?.value.trim() || "",
      video: videoInput?.value.trim() || "",
      hot: !!(hotInput && hotInput.checked),
      origin: "user",
    };

    let newList;
    if (isEdit) {
      // actualizar
      const idx = customList.findIndex((p) => p.id === productId);
      if (idx >= 0) {
        newList = [...customList];
        newList[idx] = newProd;
      } else {
        // si por alguna razón el id no está en custom, lo agregamos
        newList = [...customList, newProd];
      }
    } else {
      newList = [...customList, newProd];
    }

    saveCustomProducts(newList);
    fillProductForm(null);
    renderProductsAdminTable();
    renderProductsGrid();
    applyCatalogFilters();
    updateDashboardCounts();

    Core.showToast(
      isEdit ? "Producto actualizado." : "Producto creado.",
      "success"
    );
  }

  function initAdminModule() {
    const form = document.getElementById("productForm");
    const resetBtn = document.getElementById("productFormReset");

    if (form) {
      form.addEventListener("submit", handleProductFormSubmit);
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        fillProductForm(null);
        Core.showToast("Formulario limpiado.", "info");
      });
    }

    renderProductsAdminTable();
    fillProductForm(null);
  }

  // -------- Dashboard counts helper --------
  function updateDashboardCounts() {
    const productsCount = getAll().length;
    Core.setDashboardCounts({
      budgetsToday: window.Budgets?.getTodayCount?.() ?? 0,
      clients: window.Clients?.load?.().length ?? 0,
      products: productsCount,
    });
  }

  // -------- INIT --------
  function init() {
    renderProductsGrid();
    initCatalogModule();
    initAdminModule();
    updateDashboardCounts();
  }

  window.Products = {
    init,
    getAll,
    getById,
  };
})();
