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

const productGrid = document.querySelector("#product-grid");
const productCount = document.querySelector("#product-count");
const categoryList = document.querySelector("#category-list");
const topCartCount = document.querySelector("#top-cart-count");
const menuButton = document.querySelector("[data-open-menu]");
const cartButton = document.querySelector("[data-open-cart]");
const categoryMenu = document.querySelector(".category-menu");
const drawerCategoryList = document.querySelector("[data-drawer-categories]");
const closeMenuButtons = document.querySelectorAll("[data-close-menu]");
const carouselSlides = [...document.querySelectorAll(".carousel-slide")];
const carouselDots = [...document.querySelectorAll(".carousel-dot")];
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");
const cart = new Map(JSON.parse(localStorage.getItem("goesca-cart") || "[]"));
let activeCategory = "Ofertas";
let activeSlide = 0;
let carouselTimer;

function formatPrice(value) {
  return formatter.format(value);
}

function showSlide(index) {
  activeSlide = (index + carouselSlides.length) % carouselSlides.length;

  carouselSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === activeSlide);
  });

  carouselDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === activeSlide);
  });
}

function startCarousel() {
  carouselTimer = window.setInterval(() => {
    showSlide(activeSlide + 1);
  }, 4800);
}

function restartCarousel() {
  window.clearInterval(carouselTimer);
  startCarousel();
}

function createCategoryButton(category) {
  const link = document.createElement("a");
  link.className = "category-button";
  link.textContent = categoryLabels[category] || category;
  link.href = category === "Todos" ? "index.html" : `category.html?category=${encodeURIComponent(category)}`;
  link.classList.toggle("is-active", category === activeCategory);
  return link;
}

function renderCategories() {
  categoryList.replaceChildren(...categories.map(createCategoryButton));
}

function renderDrawerCategories() {
  drawerCategoryList.replaceChildren(...categories.map((category) => {
    const link = document.createElement("a");
    link.className = "drawer-category-link";
    link.textContent = categoryLabels[category] || category;
    link.href = category === "Todos" ? "index.html" : `category.html?category=${encodeURIComponent(category)}`;
    return link;
  }));
}

function getVisibleProducts() {
  if (activeCategory === "Todos") {
    return products;
  }

  if (activeCategory === "Ofertas") {
    return products.filter((product) => product.hotSale || product.discount).slice(0, 4);
  }

  return products.filter((product) => product.category === activeCategory);
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
      <p class="product-detail">${product.detail}</p>
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

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  productGrid.replaceChildren(...visibleProducts.map(createProductCard));
  productCount.textContent = `${visibleProducts.length} productos`;
}

function getProduct(productId) {
  return products.find((product) => product.id === productId);
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

function addToCart(productId) {
  const input = getQuantityInput(productId);
  const quantity = normalizeQuantity(input?.value);
  const current = cart.get(productId) || 0;

  cart.set(productId, current + quantity);
  renderCart();
}

function getCartSummary() {
  return [...cart.entries()]
    .map(([productId, quantity]) => {
      const product = getProduct(productId);

      if (!product) {
        return null;
      }

      return {
        ...product,
        quantity,
        subtotal: product.price * quantity,
      };
    })
    .filter(Boolean);
}

function renderCart() {
  const summary = getCartSummary();
  const totalItems = summary.reduce((sum, item) => sum + item.quantity, 0);

  localStorage.setItem("goesca-cart", JSON.stringify([...cart.entries()]));
  topCartCount.textContent = totalItems;
}

prevButton.addEventListener("click", () => {
  showSlide(activeSlide - 1);
  restartCarousel();
});

nextButton.addEventListener("click", () => {
  showSlide(activeSlide + 1);
  restartCarousel();
});

carouselDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showSlide(Number(dot.dataset.carouselDot));
    restartCarousel();
  });
});

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

renderCategories();
renderDrawerCategories();
renderProducts();
renderCart();
startCarousel();
