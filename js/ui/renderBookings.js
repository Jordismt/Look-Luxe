// js/ui/renderBookings.js
import { state } from "../core/state.js";
import { CONFIG } from "../core/config.js";
import { $, timeToMinutes, safeFetchJson } from "../core/utils.js";

export async function renderBookings() {
  const bookingListEl = $("bookingList");
  const serviceSelect = $("serviceSelect");
  const serviceType = $("serviceType");
  const bookingDate = $("bookingDate");
  const bookingTime = $("bookingTime");
  const bookingForm = $("bookingForm");
  const bookingSuccess = $("bookingSuccess");

  if (!bookingListEl && !bookingForm) return;

  // Función para comprobar si la franja horaria está libre
  function isTimeAvailable(date, startTime, duration, category) {
    const start = timeToMinutes(startTime);
    const end = start + duration;
    return !state.bookings.some(b => {
      if (b.date !== date || b.category !== category) return false;
      const s = [...state.services.hair, ...state.services.post].find(s => s.name === b.service);
      const d = s?.duration || 30;
      const sStart = timeToMinutes(b.time);
      const sEnd = sStart + d;
      return start < sEnd && end > sStart;
    });
  }

  // Actualiza las horas disponibles según servicio y fecha
  function updateAvailableTimes() {
    const date = bookingDate?.value;
    if (!date || !serviceSelect || !bookingTime) return;

    const serviceName = serviceSelect.value;
    const category = serviceSelect.options[serviceSelect.selectedIndex]?.dataset?.category;
    bookingTime.innerHTML = `<option value="" disabled selected>Selecciona hora</option>`;
    if (!serviceName || !category) return;

    const s = [...state.services.hair, ...state.services.post].find(x => x.name === serviceName);
    const dur = s?.duration || 30;

    for (let h = CONFIG.OPEN_HOUR; h < CONFIG.CLOSE_HOUR; h++) {
      for (let m = 0; m < 60; m += CONFIG.INTERVAL_MINUTES) {
        const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        if (isTimeAvailable(date, t, dur, category)) {
          const opt = document.createElement("option");
          opt.value = t;
          opt.textContent = t;
          bookingTime.appendChild(opt);
        }
      }
    }

    if (bookingTime.options.length === 1) {
      const opt = document.createElement("option");
      opt.textContent = "No hay horas disponibles";
      opt.disabled = true;
      bookingTime.appendChild(opt);
    }
  }

  // Guardar booking
  function saveBooking(name, email, phone, service, date, time, category) {
    state.bookings.push({ name, email, phone, service, date, time, category });
    localStorage.setItem(CONFIG.LS_BOOKINGS, JSON.stringify(state.bookings));
    renderBookingList();
  }

  // Render de la lista de bookings
  function renderBookingList() {
    if (!bookingListEl) return;
    bookingListEl.innerHTML = "";
    state.bookings
      .slice()
      .sort((a, b) => new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time))
      .forEach(b => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-dark text-light mb-1";
        const catText = b.category === "hair" ? "Peluquería" : "Posticería";
        li.innerHTML = `<strong>${b.date} ${b.time}</strong> - ${b.service} (${catText})<br>${b.name} | ${b.email} | ${b.phone}`;
        bookingListEl.appendChild(li);
      });
  }

  // Bind formulario
  if (bookingForm) {
    bookingForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = $("bookingName")?.value.trim();
      const email = $("bookingEmail")?.value.trim();
      const phone = $("bookingPhone")?.value.trim();
      const service = serviceSelect?.value.trim();
      const date = bookingDate?.value.trim();
      const time = bookingTime?.value.trim();
      const category = serviceSelect.options[serviceSelect.selectedIndex]?.dataset?.category;

      if (!name || !email || !phone || !service || !date || !time || !category) {
        alert("Completa todos los campos.");
        return;
      }

      const sObj = [...state.services.hair, ...state.services.post].find(s => s.name === service);
      const dur = sObj?.duration || 30;
      if (!isTimeAvailable(date, time, dur, category)) {
        alert(`La franja ${date} ${time} no está disponible.`);
        return;
      }

      saveBooking(name, email, phone, service, date, time, category);

      // Mostrar mensaje éxito
      if (bookingSuccess) {
        bookingSuccess.classList.remove("d-none");
        bookingSuccess.innerHTML = `✅ Cita confirmada:<br>
          <strong>Nombre:</strong> ${name}<br>
          <strong>Email:</strong> ${email}<br>
          <strong>Teléfono:</strong> ${phone}<br>
          <strong>Servicio:</strong> ${service} (${category === "hair" ? "Peluquería" : "Posticería"})<br>
          <strong>Fecha:</strong> ${date}<br>
          <strong>Hora:</strong> ${time}`;
      }

      bookingForm.reset();
      serviceSelect.innerHTML = `<option value="" disabled selected>Selecciona un servicio...</option>`;
      bookingTime.innerHTML = `<option value="" disabled selected>Selecciona hora</option>`;
    });
  }

  // Bind selects para actualizar horas automáticamente
  serviceSelect?.addEventListener("change", updateAvailableTimes);
  bookingDate?.addEventListener("change", updateAvailableTimes);

  // Render inicial de lista de bookings
  renderBookingList();
}
