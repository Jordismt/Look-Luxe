// js/services/merch.js
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { safeFetchJson } from "../core/utils.js";

/**
 * Carga todos los items de merchandising y los guarda en state
 */
export async function loadMerch() {
  if (!state.merch.length) {
    state.merch = await safeFetchJson(CONFIG.PATH_MERCH);
  }
  return state.merch;
}

/**
 * Obtiene un item de merch por su ID
 */
export function getMerchById(id) {
  return state.merch.find(m => String(m.id) === String(id));
}

/**
 * Añade un item de merchandising al carrito
 */
export function addMerchToCart(id) {
  const itemId = `merch-${id}`; // Diferencia de productos normales
  const existing = state.cart.find(i => i.id === itemId);
  if (existing) existing.quantity++;
  else state.cart.push({ id: itemId, quantity: 1 });
  localStorage.setItem(CONFIG.LS_CART, JSON.stringify(state.cart));
}
