// js/ui/renderServices.js
import { state } from "../core/state.js";
import { safeFetchJson, $ } from "../core/utils.js";
import { CONFIG } from "../core/config.js";
import { renderBookings } from "./renderBookings.js"; // si quieres actualizar citas al cambiar selects

export async function renderServices() {
  const serviceListEl = $("service-list");
  const typeSelect = $("serviceType");
  const serviceSelect = $("serviceSelect");
  if (!serviceListEl && !typeSelect && !serviceSelect) return;

  try {
    // Carga servicios si aún no están en el state
    if (!state.services.hair.length) {
      state.services.hair = await safeFetchJson(CONFIG.PATH_SERVICES_HAIR);
    }
    if (!state.services.post.length) {
      state.services.post = await safeFetchJson(CONFIG.PATH_SERVICES_POST);
    }

    // Renderizar tarjetas en sección servicios
    if (serviceListEl) {
      serviceListEl.innerHTML = "";
      const allServices = [
        ...state.services.hair.map(s => ({ ...s, category: "hair" })),
        ...state.services.post.map(s => ({ ...s, category: "post" })),
      ];
      allServices.forEach((s, i) => {
        serviceListEl.insertAdjacentHTML("beforeend", `
          <div class="col-md-4" data-aos="fade-up" data-aos-delay="${i * 100}">
            <div class="card shadow-sm">
              <img src="${s.img}" class="card-img-top" alt="${s.name}">
              <div class="card-body">
                <h5 class="card-title fw-bold">${s.name}</h5>
                <p>${s.description}</p>
                <span class="fw-bold">${s.price}€</span>
              </div>
            </div>
          </div>
        `);
      });
    }

    // Doble select de booking
    if (typeSelect && serviceSelect) {
      typeSelect.addEventListener("change", () => {
        const tipo = typeSelect.value;
        serviceSelect.innerHTML = `<option value="" disabled selected>Selecciona un servicio...</option>`;
        let servicios = [];
        if (tipo === "peluqueria") servicios = state.services.hair;
        if (tipo === "posticeria") servicios = state.services.post;

        servicios.forEach(s => {
          const opt = document.createElement("option");
          opt.value = s.name;
          opt.dataset.category = tipo === "peluqueria" ? "hair" : "post";
          opt.dataset.duration = s.duration;
          opt.textContent = `${s.name} – ${s.price}€`;
          serviceSelect.appendChild(opt);
        });
      });
    }

  } catch (err) {
    console.error("Error cargando servicios:", err);
    if (serviceListEl) {
      serviceListEl.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los servicios.</div>`;
    }
  }
}
