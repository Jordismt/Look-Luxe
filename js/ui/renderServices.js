// js/ui/renderServices.js
import { state } from "../core/state.js";
import { safeFetchJson, $ } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { renderBookings } from "./renderBookings.js";

export async function renderServices() {
  const serviceListEl = $("service-list");
  const typeSelect = $("serviceType");
  const serviceSelect = $("serviceSelect");
  if (!serviceListEl && !typeSelect && !serviceSelect) return;

  try {
    // Cargar servicios si no existen en state
    const [hair, post] = await Promise.all([
      state.services.hair.length ? state.services.hair : safeFetchJson(CONFIG.PATH_SERVICES_HAIR),
      state.services.post.length ? state.services.post : safeFetchJson(CONFIG.PATH_SERVICES_POST),
    ]);

    state.services.hair = hair;
    state.services.post = post;

    // Función para crear tarjetas
    const createCard = (s, delay) => `
      <div class="col-md-4" data-aos="fade-up" data-aos-delay="${delay}">
        <div class="card shadow-sm h-100">
          <img src="${s.img}" loading="lazy" class="card-img-top" alt="${s.name}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold text-center">${s.name}</h5>
            <p class="flex-grow-1 mb-3">${s.description.split(";").join("<br>")}</p>
            <div class="d-flex justify-content-between fw-bold">
              <span>${s.price}€</span>
              <span>${s.duration} min</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Función para generar sección completa
    const createSection = (title, services) => `
      <h2 class="fw-bold mt-5 mb-4 text-center" style="font-size: 2.2rem; color:#d39e00;">
        ${title}
      </h2>
      <div class="row g-4">
        ${services.map((s, i) => createCard(s, i * 60)).join("")}
      </div>
    `;

    // Renderizar todo de golpe
    serviceListEl.innerHTML = createSection("Peluquería", hair) + createSection("Posticería", post);

    // Refrescar AOS
    if (window.AOS) setTimeout(() => AOS.refresh(), 50);

    // --- SELECTS BOOKING ---
    if (typeSelect && serviceSelect) {
      typeSelect.addEventListener("change", () => {
        const tipo = typeSelect.value;
        const servicios = tipo === "peluqueria" ? hair : tipo === "posticeria" ? post : [];

        serviceSelect.innerHTML = `<option value="" disabled selected>Selecciona un servicio...</option>`;

        const fragment = document.createDocumentFragment();
        servicios.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.name;
          opt.dataset.category = tipo === "peluqueria" ? "hair" : "post";
          opt.dataset.duration = s.duration;
          opt.textContent = `${s.name} – ${s.price}€`;
          fragment.appendChild(opt);
        });
        serviceSelect.appendChild(fragment);

        renderBookings?.();
      });
    }

  } catch (err) {
    console.error("Error cargando servicios:", err);
    if (serviceListEl) {
      serviceListEl.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los servicios.</div>`;
    }
  }
}
