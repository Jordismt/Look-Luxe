import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { safeFetchJson } from "../core/utils.js";

export async function loadProducts() {
  state.products = await safeFetchJson(CONFIG.PATH_PRODUCTS);
  return state.products;
}

export function getProductById(id) {
  return state.products.find(p => String(p.id) === String(id));
}
