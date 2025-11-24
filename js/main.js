import { renderProducts } from "./ui/renderProducts.js";
import { renderCart } from "./ui/renderCart.js";
import { renderProductPage } from "./ui/renderProductPage.js";
import { renderServices } from "./ui/renderServices.js";
import { renderBookings } from "./ui/renderBookings.js";
import { renderMerch } from "./ui/renderMerch.js";
import { setupTheme } from "./core/theme.js";
import { renderMerchPage } from "./ui/renderMerchPage.js";

document.addEventListener("DOMContentLoaded", () => {
  setupTheme();
  renderProducts();
  renderProductPage();
  renderCart();
  renderServices();
  renderBookings();
  renderMerch();
  renderMerchPage();
});
