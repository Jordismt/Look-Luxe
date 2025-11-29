import { state } from "../core/state.js";
import { safeFetchJson } from "../core/utils.js";
import { CONFIG } from "../core/config.js";

export async function loadServices() {
  if (!state.services.hair.length) {
    state.services.hair = await safeFetchJson(CONFIG.PATH_SERVICES_HAIR);
  }
  if (!state.services.post.length) {
    state.services.post = await safeFetchJson(CONFIG.PATH_SERVICES_POST);
  }
}
