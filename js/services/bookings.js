import { state, saveState } from "../core/state.js";
import { timeToMinutes } from "../core/utils.js";

export function isTimeAvailable(date, startTime, duration, category) {

  const start = timeToMinutes(startTime);
  const end = start + duration;

  return !state.bookings.some(b => {
    if (b.date !== date || b.category !== category) return false;

    const serviceDef = [...state.services.hair, ...state.services.post].find(s => s.name === b.service);
    const dur = serviceDef?.duration ?? 30;

    const sStart = timeToMinutes(b.time);
    const sEnd = sStart + dur;

    return start < sEnd && end > sStart;
  });
}

export function saveBooking(data) {
  state.bookings.push(data);
  saveState.bookings();
}
