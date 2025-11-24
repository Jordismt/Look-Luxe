import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { $, safeFetchJson } from "../core/utils.js";
import { addMerchToCart } from "../services/merch.js";
import { renderCart } from "./renderCart.js";

export async function renderMerchPage() {
  const container = $("merch-details");
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    container.innerHTML = `<div class="alert alert-warning">ID de producto no especificado.</div>`;
    return;
  }

  try {
    if (!state.merch.length) {
      state.merch = await safeFetchJson(CONFIG.PATH_MERCH);
    }

    const item = state.merch.find(m => String(m.id) === String(id));
    if (!item) {
      container.innerHTML = `<div class="alert alert-danger">Producto no encontrado.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="row align-items-center">
        <div class="col-md-5">
          <img src="${item.image}" class="img-fluid rounded shadow" alt="${item.name}">
        </div>
        <div class="col-md-7">
          <h1>${item.name}</h1>
          <p class="lead">${item.description || ""}</p>
          <h3 class="text-warning fw-bold">${item.price}€</h3>
          <button class="btn btn-dark mt-3" id="addMerchBtn">Añadir al carrito</button>
          <a href="index.html" class="btn btn-outline-dark mt-3 ms-2">Volver atrás</a>
        </div>
      </div>
    `;

    $("addMerchBtn")?.addEventListener("click", () => {
      addMerchToCart(item.id);
      renderCart(); // Actualiza el carrito visualmente
      alert("Merchandising añadido al carrito");
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Error cargando el producto.</div>`;
  }
}
