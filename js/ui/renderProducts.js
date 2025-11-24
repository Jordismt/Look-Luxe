import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { safeFetchJson } from "../core/utils.js";

export async function renderProducts() {
  const el = document.getElementById("product-list");
  if (!el) return;

  try {
    if (!state.products.length) state.products = await safeFetchJson(CONFIG.PATH_PRODUCTS);
    el.innerHTML = "";
    state.products.forEach((p) => {
      el.insertAdjacentHTML(
        "beforeend",
        `<div class="col-md-4" data-aos="fade-up">
          <div class="card shadow-sm">
            <img src="${p.img}" class="card-img-top" alt="${p.name}">
            <div class="card-body">
              <h5 class="card-title fw-bold">${p.name}</h5>
              <p class="fw-bold">${p.price}€</p>
              <a href="product.html?id=${p.id}" class="btn btn-dark w-100 mt-2">Ver producto</a>
            </div>
          </div>
        </div>`
      );
    });
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los productos.</div>`;
  }
}
