import { renderProducts } from "./ui/renderProducts.js";
import { renderCart } from "./ui/renderCart.js";
import { renderProductPage } from "./ui/renderProductPage.js";
import { renderServices } from "./ui/renderServices.js";
import { renderBookings } from "./ui/renderBookings.js";
import { renderMerch } from "./ui/renderMerch.js";
import { renderMerchPage } from "./ui/renderMerchPage.js";
import { setupTheme } from "./core/theme.js";

import { loadServices } from "./services/loadServices.js"; // NUEVO

document.addEventListener("DOMContentLoaded", async () => {
  setupTheme();

  // ⚡ PRE-CARGA LOS SERVICIOS ANTES DE QUE EL USUARIO HAGA SCROLL
  await loadServices();

  // Ahora renderiza todo normalmente
  renderProducts();
  renderProductPage();
  renderCart();
  renderServices();   // ahora carga instantáneo incluso scrolleando rápido
  renderBookings();
  renderMerch();
  renderMerchPage();

  // Refrescar AOS después de renderizar servicios
  if (window.AOS) AOS.refresh();
});
