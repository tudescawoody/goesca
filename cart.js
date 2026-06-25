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

const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const checkoutButton = document.querySelector("#checkout-button");
const topCartCount = document.querySelector("#top-cart-count");
const menuButton = document.querySelector("[data-open-menu]");
const cartButton = document.querySelector("[data-open-cart]");
const drawerCategoryList = document.querySelector("[data-drawer-categories]");
const closeMenuButtons = document.querySelectorAll("[data-close-menu]");
const cart = new Map(JSON.parse(localStorage.getItem("goesca-cart") || "[]"));

function formatPrice(value) {
  return formatter.format(value);
}

function getCategoryLabel(category) {
  return categoryLabels[category] || category;
}

function renderDrawerCategories() {
  drawerCategoryList.replaceChildren(...categories.map((category) => {
    const link = document.createElement("a");
    link.className = "drawer-category-link";
    link.textContent = getCategoryLabel(category);
    link.href = category === "Todos" ? "index.html" : `category.html?category=${encodeURIComponent(category)}`;
    return link;
  }));
}

function saveCart() {
  localStorage.setItem("goesca-cart", JSON.stringify([...cart.entries()]));
}

function getProduct(productId) {
  return products.find((product) => product.id === productId);
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

function removeFromCart(productId) {
  cart.delete(productId);
  saveCart();
  renderCart();
}

function renderCart() {
  const summary = getCartSummary();
  const totalItems = summary.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = summary.reduce((sum, item) => sum + item.subtotal, 0);

  topCartCount.textContent = totalItems;
  cartTotal.textContent = formatPrice(totalPrice);
  checkoutButton.disabled = summary.length === 0;

  if (summary.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">Tu carrito esta vacio.</p>';
    return;
  }

  cartItems.replaceChildren(
    ...summary.map((item) => {
      const row = document.createElement("article");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-top">
          <p class="cart-item-name">${item.title}</p>
          <span class="cart-item-subtotal">${formatPrice(item.subtotal)}</span>
        </div>
        <div class="cart-item-bottom">
          <span class="cart-item-meta">${item.quantity} x ${formatPrice(item.price)}</span>
          <button class="remove-item" type="button" data-remove-product="${item.id}">Quitar</button>
        </div>
      `;
      return row;
    }),
  );
}

function checkoutCart() {
  const summary = getCartSummary();
  const totalPrice = summary.reduce((sum, item) => sum + item.subtotal, 0);
  const lines = summary.map((item) => `- ${item.quantity} x ${item.title}: ${formatPrice(item.subtotal)}`);
  const message = [`Hola Goesca, quiero cotizar estos productos:`, ...lines, `Total estimado: ${formatPrice(totalPrice)}`].join("\n");
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
}

cartItems.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-product]");

  if (!removeButton) {
    return;
  }

  removeFromCart(removeButton.dataset.removeProduct);
});

checkoutButton.addEventListener("click", checkoutCart);
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
renderCart();
