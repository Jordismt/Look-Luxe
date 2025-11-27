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

        <!-- CARRUSEL -->
        <div class="col-md-5">
          <div id="carouselMerch" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
              ${item.images
                .map(
                  (img, index) => `
                  <div class="carousel-item ${index === 0 ? "active" : ""}">
                    <img src="${img}" class="d-block w-100 rounded shadow" alt="${item.name}">
                  </div>
                `
                )
                .join("")}
            </div>

            <button class="carousel-control-prev" type="button" data-bs-target="#carouselMerch" data-bs-slide="prev">
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselMerch" data-bs-slide="next">
              <span class="carousel-control-next-icon"></span>
            </button>
          </div>
        </div>

        <!-- INFO -->
        <div class="col-md-7">
          <h1>${item.name}</h1>
          <p class="lead">${item.description || ""}</p>
          <h3 class="text-warning fw-bold">${item.price}€</h3>

          <!-- SELECTOR DE COLOR -->
          <div class="mt-3">
            <label class="fw-bold">Color:</label>
            <select id="colorSelect" class="form-select w-50 mt-2">
              <option value="">Selecciona un color</option>
              ${item.colors
                .map(color => `<option value="${color}">${color}</option>`)
                .join("")}
            </select>
          </div>

          <button class="btn btn-dark mt-3" id="addMerchBtn">Añadir al carrito</button>
          <a href="index.html" class="btn btn-outline-dark mt-3 ms-2">Volver atrás</a>
        </div>

      </div>
    `;

    // Evento: añadir al carrito
    $("addMerchBtn")?.addEventListener("click", () => {
      const color = $("colorSelect").value;

      if (!color) {
        alert("Por favor, selecciona un color.");
        return;
      }

      addMerchToCart(item.id, color);
      renderCart();
      alert(`Añadido al carrito (${color})`);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Error cargando el producto.</div>`;
  }
}
