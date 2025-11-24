// js/ui/renderCart.js
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { $, safeFetchJson } from "../core/utils.js";

export async function renderCart() {
  const container = $("cart-items");
  const totalEl = $("cart-total");
  if (!container || !totalEl) return;

  // Cargar productos y merchandising si no están en el state
  if (!state.products.length) state.products = await safeFetchJson(CONFIG.PATH_PRODUCTS);
  if (!state.merch?.length) state.merch = await safeFetchJson(CONFIG.PATH_MERCH);

  container.innerHTML = "";
  let total = 0;

  if (!state.cart.length) {
    container.innerHTML = `<div class="alert alert-light">Tu carrito está vacío.</div>`;
    totalEl.textContent = "0€";
    return;
  }

  state.cart.forEach(item => {
    let p;
    if (item.id.startsWith("merch-")) {
      const merchId = item.id.replace("merch-", "");
      p = state.merch.find(x => String(x.id) === merchId);
    } else {
      p = state.products.find(x => String(x.id) === String(item.id));
    }
    if (!p) return;

    total += (Number(p.price) || 0) * (item.quantity || 0);

    const row = document.createElement("div");
    row.className = "d-flex justify-content-between align-items-center border-bottom py-2";
    row.innerHTML = `
      <div><strong>${p.name}</strong><br>${item.quantity} x ${p.price}€</div>
      <div>
        <button class="btn btn-sm btn-secondary me-2" data-action="dec" data-id="${item.id}">-</button>
        <button class="btn btn-sm btn-secondary me-2" data-action="inc" data-id="${item.id}">+</button>
        <button class="btn btn-sm btn-danger" data-action="remove" data-id="${item.id}">Eliminar</button>
      </div>
    `;
    container.appendChild(row);
  });

  totalEl.textContent = total.toFixed(2) + "€";

  // Botones incrementar/decrementar/eliminar
  container.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const idx = state.cart.findIndex(c => String(c.id) === String(id));

      if (btn.dataset.action === "remove") {
        state.cart = state.cart.filter(c => String(c.id) !== String(id));
      } else if (btn.dataset.action === "inc") {
        if (idx >= 0) state.cart[idx].quantity++;
      } else if (btn.dataset.action === "dec") {
        if (idx >= 0) state.cart[idx].quantity = Math.max(1, state.cart[idx].quantity - 1);
      }

      localStorage.setItem(CONFIG.LS_CART, JSON.stringify(state.cart));
      renderCart();
    });
  });

  // Botón de checkout (finalizar compra)
  const checkoutBtn = $("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      if (!state.cart.length) {
        alert("Tu carrito está vacío.");
        return;
      }
      state.cart = [];
      localStorage.setItem(CONFIG.LS_CART, JSON.stringify(state.cart));
      renderCart();
      alert("Compra realizada con éxito 🎉");
    };
  }

  // Botón vaciar carrito
  const clearBtn = $("clear-cart-btn");
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (!state.cart.length) {
        alert("Tu carrito ya está vacío.");
        return;
      }
      state.cart = [];
      localStorage.setItem(CONFIG.LS_CART, JSON.stringify(state.cart));
      renderCart();
      alert("Carrito vaciado 🗑️");
    };
  }
}
