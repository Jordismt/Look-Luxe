import { CONFIG } from "./config.js";

export const state = {
  products: [],
  services: { hair: [], post: [] },
  merch: [],
  cart: JSON.parse(localStorage.getItem(CONFIG.LS_CART)) ?? [],
  bookings: JSON.parse(localStorage.getItem(CONFIG.LS_BOOKINGS)) ?? [],
  theme: localStorage.getItem(CONFIG.LS_THEME) || "dark",
};

export const saveState = {
  cart: () => localStorage.setItem(CONFIG.LS_CART, JSON.stringify(state.cart)),
  bookings: () => localStorage.setItem(CONFIG.LS_BOOKINGS, JSON.stringify(state.bookings)),
  theme: () => localStorage.setItem(CONFIG.LS_THEME, state.theme),
};
