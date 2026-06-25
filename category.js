const products = window.goescaProducts;
const categories = window.goescaCategories;
const categoryLabels = {
  Bano: "Baño",
};
const formatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("category") || "Ofertas";
const sectionCategories = categories.filter((category) => category !== "Todos");
const categoryTitle = document.querySelector("#category-title");
const productGrid = document.querySelector("#product-grid");
const productCount = document.querySelector("#product-count");
const productSearch = document.querySelector("#product-search");
const prevCategory = document.querySelector("#prev-category");
const nextCategory = document.querySelector("#next-category");
const topCartCount = document.querySelector("#top-cart-count");
const menuButton = document.querySelector("[data-open-menu]");
const cartButton = document.querySelector("[data-open-cart]");
const drawerCategoryList = document.querySelector("[data-drawer-categories]");
const closeMenuButtons = document.querySelectorAll("[data-close-menu]");
const cart = new Map(JSON.parse(localStorage.getItem("goesca-cart") || "[]"));
let searchTerm = "";

function formatPrice(value) {
  return formatter.format(value);
}

function formatProductDetail(detail) {
  const parts = detail.split(" · ");
  const stockPart = parts.find((part) => part.trim().toLowerCase().startsWith("stock:"));
  const stock = stockPart ? Number.parseInt(stockPart.replace(/\D/g, ""), 10) : Number.NaN;
  const visibleParts = parts.filter((part) => !part.trim().toLowerCase().startsWith("stock:"));

  if (!Number.isNaN(stock) && stock < 3) {
    visibleParts.push(`<span class="low-stock">Últimos ${stock}</span>`);
  }

  return visibleParts.join(" · ");
}

function getCategoryLabel(category) {
  return categoryLabels[category] || category;
}

function getVisibleProducts() {
  if (searchTerm) {
    return products.filter((product) => {
      const searchable = `${product.title} ${product.detail} ${product.category} ${product.code || ""}`.toLowerCase();
      return searchable.includes(searchTerm);
    });
  }

  let visibleProducts;

  if (selectedCategory === "Ofertas") {
    visibleProducts = products.filter((product) => product.hotSale || product.discount);
  } else if (selectedCategory === "Todos") {
    visibleProducts = products;
  } else {
    visibleProducts = products.filter((product) => product.category === selectedCategory);
  }

  return visibleProducts;
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.innerHTML = `
    ${product.discount ? `<span class="sale-badge">${product.discount}</span>` : ""}
    <div class="product-visual" aria-hidden="true">
      <img class="product-photo" src="${product.image}" alt="" loading="lazy" />
    </div>
    <div class="product-body">
      <h3 class="product-title">${product.title}</h3>
      <p class="product-detail">${formatProductDetail(product.detail)}</p>
      <div class="price-row">
        <span class="price-now">${formatPrice(product.price)}</span>
        <span class="price-before">${formatPrice(product.before)}</span>
      </div>
      <div class="product-actions">
        <div class="quantity-control" aria-label="Cantidad para ${product.title}">
          <button class="quantity-button" type="button" data-quantity-minus="${product.id}">-</button>
          <input class="quantity-input" type="number" min="1" max="99" value="1" inputmode="numeric" data-quantity-input="${product.id}" aria-label="Cantidad" />
          <button class="quantity-button" type="button" data-quantity-plus="${product.id}">+</button>
        </div>
        <button class="add-to-cart-button" type="button" data-add-product="${product.id}">
          Agregar
        </button>
      </div>
    </div>
  `;
  return card;
}

function getQuantityInput(productId) {
  return document.querySelector(`[data-quantity-input="${productId}"]`);
}

function normalizeQuantity(value) {
  const quantity = Number.parseInt(value, 10);

  if (Number.isNaN(quantity) || quantity < 1) {
    return 1;
  }

  return Math.min(quantity, 99);
}

function updateQuantity(productId, nextQuantity) {
  const input = getQuantityInput(productId);

  if (!input) {
    return;
  }

  input.value = normalizeQuantity(nextQuantity);
}

function renderCartCount() {
  const totalItems = [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
  localStorage.setItem("goesca-cart", JSON.stringify([...cart.entries()]));
  topCartCount.textContent = totalItems;
}

function addToCart(productId) {
  const input = getQuantityInput(productId);
  const quantity = normalizeQuantity(input?.value);
  const current = cart.get(productId) || 0;

  cart.set(productId, current + quantity);
  renderCartCount();
}

function renderDrawerCategories() {
  drawerCategoryList.replaceChildren(...categories.map((category) => {
    const link = document.createElement("a");
    link.className = "drawer-category-link";
    link.textContent = getCategoryLabel(category);
    link.href = category === "Todos" ? "index.html" : `category.html?category=${encodeURIComponent(category)}`;
    link.classList.toggle("is-active", category === selectedCategory);
    return link;
  }));
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  const currentIndex = Math.max(sectionCategories.indexOf(selectedCategory), 0);
  const previousCategory = sectionCategories[(currentIndex - 1 + sectionCategories.length) % sectionCategories.length];
  const nextCategoryName = sectionCategories[(currentIndex + 1) % sectionCategories.length];

  document.title = `${getCategoryLabel(selectedCategory)} | Goesca`;
  categoryTitle.textContent = getCategoryLabel(selectedCategory);
  prevCategory.href = `category.html?category=${encodeURIComponent(previousCategory)}`;
  prevCategory.setAttribute("aria-label", `Ver ${getCategoryLabel(previousCategory)}`);
  nextCategory.href = `category.html?category=${encodeURIComponent(nextCategoryName)}`;
  nextCategory.setAttribute("aria-label", `Ver ${getCategoryLabel(nextCategoryName)}`);
  if (!visibleProducts.length) {
    productGrid.innerHTML = '<p class="empty-cart product-empty">No encontramos productos con esa busqueda.</p>';
  } else {
    productGrid.replaceChildren(...visibleProducts.map(createProductCard));
  }
  productCount.textContent = `${visibleProducts.length} productos`;
}

productGrid.addEventListener("click", (event) => {
  const plusButton = event.target.closest("[data-quantity-plus]");
  const minusButton = event.target.closest("[data-quantity-minus]");
  const addButton = event.target.closest("[data-add-product]");

  if (plusButton) {
    const productId = plusButton.dataset.quantityPlus;
    const input = getQuantityInput(productId);
    updateQuantity(productId, normalizeQuantity(input.value) + 1);
  }

  if (minusButton) {
    const productId = minusButton.dataset.quantityMinus;
    const input = getQuantityInput(productId);
    updateQuantity(productId, normalizeQuantity(input.value) - 1);
  }

  if (addButton) {
    addToCart(addButton.dataset.addProduct);
  }
});

productGrid.addEventListener("change", (event) => {
  const input = event.target.closest(".quantity-input");

  if (!input) {
    return;
  }

  input.value = normalizeQuantity(input.value);
});

productSearch?.addEventListener("input", () => {
  searchTerm = productSearch.value.trim().toLowerCase();
  renderProducts();
});

menuButton.addEventListener("click", () => {
  document.body.classList.add("menu-is-open");
});

closeMenuButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.body.classList.remove("menu-is-open");
  });
});

cartButton.addEventListener("click", () => {
  window.location.href = "cart.html";
});

renderDrawerCategories();
renderProducts();
renderCartCount();
