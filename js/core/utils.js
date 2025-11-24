// js/core/utils.js
export const $ = (id) => document.getElementById(id);

export const safeFetchJson = async (path) => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Fetch failed ${path}: ${res.status}`);
  return res.json();
};

export const timeToMinutes = (t) => {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
};

// Añade estas funciones para manejar LocalStorage
export const saveLS = (key, value) => localStorage.setItem(key, JSON.stringify(value));
export const loadLS = (key, fallback = null) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};
