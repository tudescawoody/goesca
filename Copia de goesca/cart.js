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
const quoteForm = document.querySelector("#quote-form");
const checkoutButton = document.querySelector("#checkout-button");
const customerName = document.querySelector("#customer-name");
const customerPhone = document.querySelector("#customer-phone");
const quoteStatus = document.querySelector("#quote-status");
const topCartCount = document.querySelector("#top-cart-count");
const menuButton = document.querySelector("[data-open-menu]");
const cartButton = document.querySelector("[data-open-cart]");
const drawerCategoryList = document.querySelector("[data-drawer-categories]");
const closeMenuButtons = document.querySelectorAll("[data-close-menu]");
const cart = new Map(JSON.parse(localStorage.getItem("goesca-cart") || "[]"));
const callMeBotPhone = "56949417183";
const callMeBotApiKey = "9926003";

function formatPrice(value) {
  return formatter.format(value);
}

function formatWhatsappPrice(value) {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString("es-CL")} CLP`;
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
        subtotal: Number(product.price) * Number(quantity),
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

function clearCart() {
  cart.clear();
  saveCart();
  renderCart();
}

async function checkoutCart(event) {
  event.preventDefault();

  const summary = getCartSummary();
  // Datos del cliente para poder contactarlo cuando llegue la cotizacion.
  const clientName = customerName.value.trim();
  const clientPhone = customerPhone.value.trim();

  if (!summary.length || !clientName || !clientPhone) {
    return;
  }

  const totalPrice = summary.reduce((sum, item) => sum + Number(item.subtotal), 0);
  // Detalle limpio del carrito: producto, cantidad, precio unitario y subtotal.
  const lines = summary.map((item) => {
    return [
      `- ${item.title}`,
      `  Cantidad: ${item.quantity}`,
      `  Precio unitario: ${formatWhatsappPrice(item.price)}`,
      `  Subtotal: ${formatWhatsappPrice(item.subtotal)}`,
    ].join("\n");
  });
  const message = [
    "Nueva cotizacion Goesca",
    "",
    `Cliente: ${clientName}`,
    `Telefono: ${clientPhone}`,
    "",
    "Productos:",
    ...lines,
    "",
    `TOTAL ESTIMADO: ${formatWhatsappPrice(totalPrice)}`,
  ].join("\n");
  // CallMeBot requiere el mensaje codificado en la URL.
  const encodedMessage = encodeURIComponent(message);
  const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${callMeBotPhone}&text=${encodedMessage}&apikey=${callMeBotApiKey}`;

  checkoutButton.disabled = true;
  quoteStatus.textContent = "Enviando cotizacion...";

  try {
    // no-cors evita que el navegador bloquee la peticion por CORS.
    await fetch(callMeBotUrl, {
      method: "GET",
      mode: "no-cors",
    });

    quoteStatus.textContent = "Tu cotizacion ha sido enviada con exito. Te contactaremos pronto.";
    window.alert("Tu cotización ha sido enviada con éxito. Te contactaremos pronto.");
    clearCart();
    quoteForm.reset();
  } catch {
    quoteStatus.textContent = "No se pudo enviar la cotizacion. Intentalo nuevamente.";
    checkoutButton.disabled = false;
  }
}

cartItems.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-product]");

  if (!removeButton) {
    return;
  }

  removeFromCart(removeButton.dataset.removeProduct);
});

quoteForm.addEventListener("submit", checkoutCart);
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
