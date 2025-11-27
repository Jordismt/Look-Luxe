import { $ } from "../core/utils.js";
import { loadMerch, addMerchToCart } from "../services/merch.js";
import { renderCart } from "./renderCart.js";

export async function renderMerch() {
  const container = $("merch-list");
  if (!container) return;

  try {
    const merch = await loadMerch();

    container.innerHTML = merch.map(item => `
      <div class="col-md-4">
        <div class="card shadow-sm">
          <img src="${item.images[0]}" class="card-img-top" alt="${item.name}">
          <div class="card-body">
            <h5 class="card-title">${item.name}</h5>
            <p class="card-text">${item.description}</p>
            <p class="fw-bold">${item.price}€</p>
            <div class="d-flex gap-2">
              <button class="btn btn-dark w-50" data-id="${item.id}" data-action="add">Añadir al carrito</button>
              <a href="merch.html?id=${item.id}" class="btn btn-outline-dark w-50">Ver detalle</a>
            </div>
          </div>
        </div>
      </div>
    `).join("");

    // Botón añadir al carrito
    container.querySelectorAll('button[data-action="add"]').forEach(btn => {
      btn.addEventListener("click", () => {
        addMerchToCart(btn.dataset.id);
        renderCart(); // Actualiza el carrito visualmente
        alert("Merchandising añadido al carrito");
      });
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Error cargando merchandising.</div>`;
  }
}
