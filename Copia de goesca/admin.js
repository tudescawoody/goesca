const products = window.goescaProducts;
const categories = window.goescaCategories;
const categoryLabels = {
  Bano: "Baño",
};
const ADMIN_USER = "goesca.ventas";
const ADMIN_PASSWORD = "Seblyn";

const loginPanel = document.querySelector("#login-panel");
const adminPanel = document.querySelector("#admin-panel");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const logoutButton = document.querySelector("#logout-button");
const adminSearch = document.querySelector("#admin-search");
const adminProductList = document.querySelector("#admin-product-list");
const adminTabButtons = document.querySelectorAll("[data-admin-tab]");
const productsView = document.querySelector("#products-view");
const cashierView = document.querySelector("#cashier-view");
const receiptsView = document.querySelector("#receipts-view");
const newProductForm = document.querySelector("#new-product-form");
const newProductCategory = document.querySelector("#new-product-category");
const newProductFile = document.querySelector("#new-product-file");
const cashierSearch = document.querySelector("#cashier-search");
const cashierResults = document.querySelector("#cashier-results");
const cashierItems = document.querySelector("#cashier-items");
const cashierTotal = document.querySelector("#cashier-total");
const cashierPaid = document.querySelector("#cashier-paid");
const cashierChange = document.querySelector("#cashier-change");
const confirmSaleButton = document.querySelector("#confirm-sale");
const clearCashierButton = document.querySelector("#clear-cashier");
const clearReceiptsButton = document.querySelector("#clear-receipts");
const receiptsList = document.querySelector("#receipts-list");
const topCartCount = document.querySelector("#top-cart-count");
const menuButton = document.querySelector("[data-open-menu]");
const cartButton = document.querySelector("[data-open-cart]");
const drawerCategoryList = document.querySelector("[data-drawer-categories]");
const closeMenuButtons = document.querySelectorAll("[data-close-menu]");
const formatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const cashierCart = new Map();

function getProductChanges() {
  try {
    return JSON.parse(localStorage.getItem("goesca-product-changes") || "{}");
  } catch {
    return {};
  }
}

function saveProductChanges(changes) {
  localStorage.setItem("goesca-product-changes", JSON.stringify(changes));
}

function getReceipts() {
  try {
    return JSON.parse(localStorage.getItem("goesca-receipts") || "[]");
  } catch {
    return [];
  }
}

function saveReceipts(receipts) {
  localStorage.setItem("goesca-receipts", JSON.stringify(receipts));
}

function getCustomProducts() {
  try {
    return JSON.parse(localStorage.getItem("goesca-custom-products") || "[]");
  } catch {
    return [];
  }
}

function saveCustomProducts(customProducts) {
  localStorage.setItem("goesca-custom-products", JSON.stringify(customProducts));
}

function getCategoryLabel(category) {
  return categoryLabels[category] || category;
}

function formatPrice(value) {
  return formatter.format(value);
}

function showAdmin() {
  loginPanel.classList.add("is-hidden");
  adminPanel.classList.remove("is-hidden");
  renderProducts();
}

function showLogin() {
  loginPanel.classList.remove("is-hidden");
  adminPanel.classList.add("is-hidden");
}

function isLoggedIn() {
  return localStorage.getItem("goesca-admin-session") === "true";
}

function formatInputValue(value) {
  return Number.isFinite(value) ? value : "";
}

function parseDiscountPercent(value) {
  const percent = Number.parseFloat(String(value).replace("%", "").replace(",", ".").replace("-", "").trim());

  if (Number.isNaN(percent) || percent <= 0) {
    return 0;
  }

  return Math.min(percent, 100);
}

function formatDiscount(value) {
  const percent = parseDiscountPercent(value);

  if (!percent) {
    return "";
  }

  return `-${percent}%`;
}

function calculateOfferPrice(beforeValue, discountValue) {
  const before = Number.parseInt(beforeValue, 10);
  const percent = parseDiscountPercent(discountValue);

  if (Number.isNaN(before) || before <= 0 || !percent) {
    return Number.parseInt(beforeValue, 10) || 0;
  }

  return Math.round((before * (100 - percent)) / 100);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createCategoryOptions(selectedCategory) {
  return categories
    .filter((category) => category !== "Todos" && category !== "Ofertas")
    .map((category) => {
      const selected = category === selectedCategory ? "selected" : "";
      return `<option value="${escapeHtml(category)}" ${selected}>${escapeHtml(getCategoryLabel(category))}</option>`;
    })
    .join("");
}

function renderNewProductCategories() {
  newProductCategory.innerHTML = categories
    .filter((category) => category !== "Todos" && category !== "Ofertas")
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(getCategoryLabel(category))}</option>`)
    .join("");
}

function getVisibleProducts() {
  const search = adminSearch.value.trim().toLowerCase();

  if (!search) {
    return products;
  }

  return products.filter((product) => {
    const category = getCategoryLabel(product.category).toLowerCase();
    return product.title.toLowerCase().includes(search) || category.includes(search);
  });
}

function getProduct(productId) {
  return products.find((product) => product.id === productId);
}

function createAdminProduct(product) {
  const row = document.createElement("article");
  row.className = `admin-product-card${product.hotSale ? " is-hot-sale" : ""}`;
  row.innerHTML = `
    <button class="admin-product-summary" type="button" data-toggle-product="${product.id}">
      <img src="${product.image}" alt="" loading="lazy" data-admin-preview="${product.id}" />
      <span>
        <strong>${escapeHtml(product.title)}</strong>
        <small>${escapeHtml(product.id)} · ${formatPrice(product.price)}</small>
      </span>
      <span class="admin-expand-icon">›</span>
    </button>
    <div class="admin-product-details" data-product-details="${product.id}">
      <div class="admin-product-main">
        <div class="admin-product-identity">
          <label>
            Nombre
            <input type="text" value="${escapeHtml(product.title)}" data-admin-title="${product.id}" />
          </label>
          <label>
            Categoria
            <select data-admin-category="${product.id}">
              ${createCategoryOptions(product.category)}
            </select>
          </label>
          <label class="admin-file-label">
            Foto
            <input type="file" accept="image/*" data-admin-file="${product.id}" />
            <input type="hidden" value="${escapeHtml(product.image)}" data-admin-image="${product.id}" />
          </label>
        </div>
        <div class="admin-product-fields">
          <label class="admin-price-field">
            <span data-admin-price-label="${product.id}">${product.hotSale ? "Precio de oferta" : "Precio"}</span>
            <input type="number" min="0" step="100" value="${formatInputValue(product.price)}" data-admin-price="${product.id}" />
          </label>
          <div class="admin-offer-fields">
            <label>
              Precio anterior
              <input type="number" min="0" step="100" value="${formatInputValue(product.before)}" data-admin-before="${product.id}" />
            </label>
            <label>
              Porcentaje oferta
              <input type="text" value="${escapeHtml(product.discount)}" placeholder="20%" data-admin-discount="${product.id}" />
            </label>
          </div>
        </div>
        <label class="admin-hot-sale">
          <input type="checkbox" ${product.hotSale ? "checked" : ""} data-admin-hot-sale="${product.id}" />
          Mostrar en Precio imbatible
        </label>
        <div class="admin-actions">
          <button class="save-product-button" type="button" data-save-product="${product.id}">Guardar</button>
          <button class="reset-product-button" type="button" data-reset-product="${product.id}">Restaurar</button>
        </div>
      </div>
    </div>
  `;
  return row;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  adminProductList.replaceChildren(...visibleProducts.map(createAdminProduct));
}

function setActiveTab(tabName) {
  const showCashier = tabName === "cashier";
  const showReceipts = tabName === "receipts";

  productsView.classList.toggle("is-hidden", showCashier || showReceipts);
  cashierView.classList.toggle("is-hidden", !showCashier);
  receiptsView.classList.toggle("is-hidden", !showReceipts);
  adminTabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminTab === tabName);
  });

  if (showCashier) {
    cashierSearch.focus();
    renderCashierResults();
    renderCashier();
  }

  if (showReceipts) {
    renderReceipts();
  }
}

function saveProduct(productId) {
  const titleInput = document.querySelector(`[data-admin-title="${productId}"]`);
  const categoryInput = document.querySelector(`[data-admin-category="${productId}"]`);
  const imageInput = document.querySelector(`[data-admin-image="${productId}"]`);
  const priceInput = document.querySelector(`[data-admin-price="${productId}"]`);
  const beforeInput = document.querySelector(`[data-admin-before="${productId}"]`);
  const discountInput = document.querySelector(`[data-admin-discount="${productId}"]`);
  const hotSaleInput = document.querySelector(`[data-admin-hot-sale="${productId}"]`);
  const changes = getProductChanges();
  const isHotSale = hotSaleInput.checked;
  const discount = isHotSale ? formatDiscount(discountInput.value) : "";
  const price = isHotSale && discount ? calculateOfferPrice(beforeInput.value, discount) : Number.parseInt(priceInput.value, 10) || 0;
  const before = isHotSale ? Number.parseInt(beforeInput.value, 10) || price : price;

  changes[productId] = {
    title: titleInput.value.trim(),
    category: categoryInput.value,
    image: imageInput.value.trim(),
    price,
    before,
    discount,
    hotSale: isHotSale,
  };

  saveProductChanges(changes);
  window.location.reload();
}

function resetProduct(productId) {
  const changes = getProductChanges();
  delete changes[productId];
  saveProductChanges(changes);
  window.location.reload();
}

function previewProductImage(productId, imageSource) {
  const preview = document.querySelector(`[data-admin-preview="${productId}"]`);

  if (!preview || !imageSource) {
    return;
  }

  preview.src = imageSource;
}

function updateOfferFields(productId) {
  const card = document.querySelector(`[data-toggle-product="${productId}"]`)?.closest(".admin-product-card");
  const hotSaleInput = document.querySelector(`[data-admin-hot-sale="${productId}"]`);
  const label = document.querySelector(`[data-admin-price-label="${productId}"]`);

  if (!card || !hotSaleInput) {
    return;
  }

  card.classList.toggle("is-hot-sale", hotSaleInput.checked);

  if (label) {
    label.textContent = hotSaleInput.checked ? "Precio de oferta" : "Precio";
  }
}

function updateOfferPrice(productId) {
  const hotSaleInput = document.querySelector(`[data-admin-hot-sale="${productId}"]`);
  const productDiscountInput = document.querySelector(`[data-admin-discount="${productId}"]`);
  const productBeforeInput = document.querySelector(`[data-admin-before="${productId}"]`);
  const productPriceInput = document.querySelector(`[data-admin-price="${productId}"]`);

  if (!hotSaleInput?.checked || !productDiscountInput || !productBeforeInput || !productPriceInput) {
    return;
  }

  const discount = formatDiscount(productDiscountInput.value);

  if (!discount) {
    return;
  }

  productPriceInput.value = calculateOfferPrice(productBeforeInput.value, discount);
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
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

function renderCartCount() {
  const cart = new Map(JSON.parse(localStorage.getItem("goesca-cart") || "[]"));
  topCartCount.textContent = [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
}

function getCashierResults() {
  const search = cashierSearch.value.trim().toLowerCase();

  if (!search) {
    return products.slice(0, 8);
  }

  return products
    .filter((product) => {
      const category = getCategoryLabel(product.category).toLowerCase();
      return product.id.toLowerCase().includes(search) || product.title.toLowerCase().includes(search) || category.includes(search);
    })
    .slice(0, 12);
}

function renderCashierResults() {
  const results = getCashierResults();

  cashierResults.replaceChildren(...results.map((product) => {
    const row = document.createElement("article");
    row.className = "cashier-result";
    row.innerHTML = `
      <img src="${product.image}" alt="" loading="lazy" />
      <span>
        <strong>${escapeHtml(product.title)}</strong>
        <small>${escapeHtml(product.id)} · ${formatPrice(product.price)}</small>
      </span>
      <button type="button" data-cashier-add="${product.id}">Agregar</button>
    `;
    return row;
  }));
}

function addCashierProduct(productId) {
  cashierCart.set(productId, (cashierCart.get(productId) || 0) + 1);
  renderCashier();
}

function changeCashierQuantity(productId, nextQuantity) {
  if (nextQuantity <= 0) {
    cashierCart.delete(productId);
  } else {
    cashierCart.set(productId, nextQuantity);
  }

  renderCashier();
}

function renderCashier() {
  const items = [...cashierCart.entries()]
    .map(([productId, quantity]) => {
      const product = getProduct(productId);
      return product ? { ...product, quantity, subtotal: product.price * quantity } : null;
    })
    .filter(Boolean);
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const paid = Number.parseInt(cashierPaid.value, 10) || 0;
  const change = paid - total;

  cashierTotal.textContent = formatPrice(total);
  cashierChange.classList.toggle("is-missing", paid > 0 && change < 0);
  cashierChange.querySelector("span").textContent = change < 0 ? "Falta" : "Vuelto";
  cashierChange.querySelector("strong").textContent = formatPrice(Math.abs(change));

  if (!items.length) {
    cashierItems.innerHTML = '<p class="empty-cart">Agrega productos desde el buscador.</p>';
    return;
  }

  cashierItems.replaceChildren(...items.map((item) => {
    const row = document.createElement("article");
    row.className = "cashier-item";
    row.innerHTML = `
      <span>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${item.quantity} x ${formatPrice(item.price)}</small>
      </span>
      <div class="cashier-quantity">
        <button type="button" data-cashier-minus="${item.id}">-</button>
        <input type="number" min="1" value="${item.quantity}" data-cashier-quantity="${item.id}" />
        <button type="button" data-cashier-plus="${item.id}">+</button>
      </div>
      <strong>${formatPrice(item.subtotal)}</strong>
    `;
    return row;
  }));
}

function getCashierItems() {
  return [...cashierCart.entries()]
    .map(([productId, quantity]) => {
      const product = getProduct(productId);
      return product ? { id: product.id, title: product.title, price: product.price, quantity, subtotal: product.price * quantity } : null;
    })
    .filter(Boolean);
}

function confirmSale() {
  const items = getCashierItems();

  if (!items.length) {
    return;
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const paid = Number.parseInt(cashierPaid.value, 10) || 0;
  const receipt = {
    id: `boleta-${Date.now()}`,
    date: new Date().toLocaleString("es-CL"),
    items,
    total,
    paid,
    change: paid - total,
  };
  const receipts = getReceipts();

  receipts.unshift(receipt);
  saveReceipts(receipts);
  cashierCart.clear();
  cashierPaid.value = "";
  renderCashier();
  renderReceipts();
  setActiveTab("receipts");
}

function renderReceipts() {
  const receipts = getReceipts();

  if (!receipts.length) {
    receiptsList.innerHTML = '<p class="empty-cart">Aun no hay ventas confirmadas.</p>';
    return;
  }

  receiptsList.replaceChildren(...receipts.map((receipt) => {
    const row = document.createElement("article");
    row.className = "receipt-card";
    const changeLabel = receipt.change < 0 ? "Falta" : "Vuelto";
    row.innerHTML = `
      <div class="receipt-top">
        <strong>${escapeHtml(receipt.id)}</strong>
        <span>${escapeHtml(receipt.date)}</span>
      </div>
      <div class="receipt-lines">
        ${receipt.items.map((item) => `<p>${item.quantity} x ${escapeHtml(item.title)} <strong>${formatPrice(item.subtotal)}</strong></p>`).join("")}
      </div>
      <div class="receipt-total">
        <span>Total: ${formatPrice(receipt.total)}</span>
        <span>Pagado: ${formatPrice(receipt.paid)}</span>
        <span>${changeLabel}: ${formatPrice(Math.abs(receipt.change))}</span>
      </div>
    `;
    return row;
  }));
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.querySelector("#admin-user").value.trim();
  const password = document.querySelector("#admin-password").value;

  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    localStorage.setItem("goesca-admin-session", "true");
    loginError.textContent = "";
    showAdmin();
    return;
  }

  loginError.textContent = "Usuario o contraseña incorrectos.";
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("goesca-admin-session");
  showLogin();
});

adminSearch.addEventListener("input", renderProducts);

adminTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.adminTab);
  });
});

newProductForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const file = newProductFile.files[0];

  if (!file) {
    return;
  }

  readImageFile(file).then((imageData) => {
    const customProducts = getCustomProducts();
    const title = document.querySelector("#new-product-title").value.trim();
    const price = Number.parseInt(document.querySelector("#new-product-price").value, 10) || 0;
    const product = {
      id: `custom-${Date.now()}`,
      title,
      category: newProductCategory.value,
      detail: "Producto agregado desde administracion.",
      price,
      before: price,
      discount: "",
      hotSale: false,
      image: imageData,
    };

    customProducts.unshift(product);
    saveCustomProducts(customProducts);
    window.location.reload();
  });
});

adminProductList.addEventListener("input", (event) => {
  const imageInput = event.target.closest("[data-admin-image]");
  const discountInput = event.target.closest("[data-admin-discount]");
  const beforeInput = event.target.closest("[data-admin-before]");

  if (imageInput) {
    previewProductImage(imageInput.dataset.adminImage, imageInput.value);
    return;
  }

  if (!discountInput && !beforeInput) {
    return;
  }

  const productId = (discountInput || beforeInput).dataset.adminDiscount || (discountInput || beforeInput).dataset.adminBefore;
  updateOfferPrice(productId);
});

adminProductList.addEventListener("change", (event) => {
  const fileInput = event.target.closest("[data-admin-file]");
  const discountInput = event.target.closest("[data-admin-discount]");
  const hotSaleInput = event.target.closest("[data-admin-hot-sale]");

  if (fileInput) {
    const file = fileInput.files[0];

    if (!file) {
      return;
    }

    readImageFile(file).then((imageData) => {
      const productId = fileInput.dataset.adminFile;
      const imageInput = document.querySelector(`[data-admin-image="${productId}"]`);

      imageInput.value = imageData;
      previewProductImage(productId, imageData);
    });
    return;
  }

  if (!discountInput) {
    if (hotSaleInput) {
      updateOfferFields(hotSaleInput.dataset.adminHotSale);
      updateOfferPrice(hotSaleInput.dataset.adminHotSale);
    }

    return;
  }

  discountInput.value = formatDiscount(discountInput.value);
  updateOfferPrice(discountInput.dataset.adminDiscount);
});

adminProductList.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-product]");
  const saveButton = event.target.closest("[data-save-product]");
  const resetButton = event.target.closest("[data-reset-product]");

  if (toggleButton) {
    const card = toggleButton.closest(".admin-product-card");
    card.classList.toggle("is-open");
  }

  if (saveButton) {
    saveProduct(saveButton.dataset.saveProduct);
  }

  if (resetButton) {
    resetProduct(resetButton.dataset.resetProduct);
  }
});

cashierSearch.addEventListener("input", renderCashierResults);

cashierResults.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-cashier-add]");

  if (!addButton) {
    return;
  }

  addCashierProduct(addButton.dataset.cashierAdd);
});

cashierItems.addEventListener("click", (event) => {
  const plusButton = event.target.closest("[data-cashier-plus]");
  const minusButton = event.target.closest("[data-cashier-minus]");

  if (plusButton) {
    const productId = plusButton.dataset.cashierPlus;
    changeCashierQuantity(productId, (cashierCart.get(productId) || 0) + 1);
  }

  if (minusButton) {
    const productId = minusButton.dataset.cashierMinus;
    changeCashierQuantity(productId, (cashierCart.get(productId) || 0) - 1);
  }
});

cashierItems.addEventListener("change", (event) => {
  const quantityInput = event.target.closest("[data-cashier-quantity]");

  if (!quantityInput) {
    return;
  }

  const quantity = Number.parseInt(quantityInput.value, 10) || 1;
  changeCashierQuantity(quantityInput.dataset.cashierQuantity, quantity);
});

clearCashierButton.addEventListener("click", () => {
  cashierCart.clear();
  cashierPaid.value = "";
  renderCashier();
});

cashierPaid.addEventListener("input", renderCashier);

confirmSaleButton.addEventListener("click", confirmSale);

clearReceiptsButton.addEventListener("click", () => {
  saveReceipts([]);
  renderReceipts();
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
renderCartCount();
renderNewProductCategories();
renderCashierResults();
renderReceipts();

if (isLoggedIn()) {
  showAdmin();
} else {
  showLogin();
}
