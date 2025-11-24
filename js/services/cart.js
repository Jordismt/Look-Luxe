import { state, saveState } from "../core/state.js";
import { showToast } from "../core/toast.js";

export function addToCart(id) {
  const item = state.cart.find(i => i.id == id);
  if (item) item.quantity++;
  else state.cart.push({ id: String(id), quantity: 1 });

  saveState.cart();
  showToast("Producto añadido");
}

export function removeFromCart(id) {
  state.cart = state.cart.filter(i => i.id != id);
  saveState.cart();
}

export function clearCart() {
  state.cart = [];
  saveState.cart();
}

