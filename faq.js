const categories = window.goescaCategories;
const categoryLabels = {
  Bano: "Baño",
};

const topCartCount = document.querySelector("#top-cart-count");
const menuButton = document.querySelector("[data-open-menu]");
const cartButton = document.querySelector("[data-open-cart]");
const drawerCategoryList = document.querySelector("[data-drawer-categories]");
const closeMenuButtons = document.querySelectorAll("[data-close-menu]");

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

function renderCartCount() {
  const cart = new Map(JSON.parse(localStorage.getItem("goesca-cart") || "[]"));
  topCartCount.textContent = [...cart.values()].reduce((sum, quantity) => sum + quantity, 0);
}

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
