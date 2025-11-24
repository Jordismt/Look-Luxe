// js/ui/renderProductPage.js
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { $, safeFetchJson } from "../core/utils.js";

export async function renderProductPage() {
  const container = $("product-details");
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    container.innerHTML = `<div class="alert alert-warning">ID de producto no especificado.</div>`;
    return;
  }

  try {
    if (!state.products.length) {
      state.products = await safeFetchJson(CONFIG.PATH_PRODUCTS);
    }
    const p = state.products.find(p => String(p.id) === String(id));
    if (!p) {
      container.innerHTML = `<div class="alert alert-danger">Producto no encontrado.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="row align-items-center">
        <div class="col-md-5">
          <img src="${p.img}" class="img-fluid rounded shadow" alt="${p.name}">
        </div>
        <div class="col-md-7">
          <h1>${p.name}</h1>
          <p class="lead">${p.description || ""}</p>
          <h3 class="text-warning fw-bold">${p.price}€</h3>
          <button class="btn btn-dark mt-3" id="addProductBtn">Añadir al carrito</button>
          <a href="index.html" class="btn btn-outline-light mt-3 ms-2">Volver atrás</a>
        </div>
      </div>
    `;

    $("addProductBtn")?.addEventListener("click", () => {
      const idx = state.cart.findIndex(c => String(c.id) === String(p.id));
      if (idx >= 0) state.cart[idx].quantity++;
      else state.cart.push({ id: String(p.id), quantity: 1 });
      localStorage.setItem(CONFIG.LS_CART, JSON.stringify(state.cart));
      alert("Producto añadido al carrito");
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Error cargando el producto.</div>`;
  }
}
