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
    const [hair, post] = await Promise.all([
      state.services.hair.length ? state.services.hair : safeFetchJson(CONFIG.PATH_SERVICES_HAIR),
      state.services.post.length ? state.services.post : safeFetchJson(CONFIG.PATH_SERVICES_POST),
    ]);

    state.services.hair = hair;
    state.services.post = post;

    const createCard = (s, delay) => `
      <div class="col-md-4 service-card" data-aos="fade-up" data-aos-delay="${delay}">
        <div class="card shadow-sm h-100">
          <img src="${s.img}" loading="lazy" class="card-img-top" alt="${s.name}">
          <div class="card-body d-flex flex-column">
            
            <h5 class="card-title fw-bold text-center">${s.name}</h5>
            <p class="flex-grow-1 mb-3">${s.description.split(";").join("<br>")}</p>

            <div class="d-flex justify-content-between fw-bold align-items-center">
              <span>
                ${
                  typeof s.price === "number"
                    ? s.price + "€"
                    : s.price
                }
              </span>

              <span>
                ${
                  s.duration === null
                    ? ""
                    : s.duration + " min"
                }
              </span>
            </div>

            ${
              (typeof s.price !== "number" || s.duration === null)
                ? `<button class="btn btn-warning mt-3 fw-bold" onclick="window.location.href='tel:+34600000000'">📞 Llamar</button>`
                : ""
            }

          </div>
        </div>
      </div>
    `;


    // --- renderizado con "Ver más" ---
    const maxVisible = 6; // muestra 6 inicialmente
    let showingAll = false;

    function renderServiceSection(title, services) {
      const container = document.createElement("div");
      container.className = "service-section mb-5";

      const h2 = document.createElement("h2");
      h2.className = "fw-bold text-center mb-4";
      h2.style.fontSize = "2rem";
      h2.style.color = "#d39e00";
      h2.textContent = title;
      container.appendChild(h2);

      const row = document.createElement("div");
      row.className = "row g-4";
      container.appendChild(row);

      const updateCards = () => {
        row.innerHTML = "";
        const list = showingAll ? services : services.slice(0, maxVisible);
        list.forEach((s, i) => row.insertAdjacentHTML("beforeend", createCard(s, i * 60)));
        if (window.AOS) setTimeout(() => AOS.refresh(), 50);
      };

      updateCards();

      if (services.length > maxVisible) {
        const btn = document.createElement("button");
        btn.className = "btn btn-dark mt-3 d-block mx-auto";
        btn.textContent = "Ver más";
        btn.addEventListener("click", () => {
          showingAll = !showingAll;
          btn.textContent = showingAll ? "Ver menos" : "Ver más";
          updateCards();
        });
        container.appendChild(btn);
      }

      return container;
    }

    serviceListEl.innerHTML = ""; // limpiar
    serviceListEl.appendChild(renderServiceSection("Peluquería", hair));
    serviceListEl.appendChild(renderServiceSection("Posticería", post));

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
