import { state } from "../core/state.js";
import { safeFetchJson } from "../core/utils.js";
import { CONFIG } from "../core/config.js";

export async function loadServices() {
  state.services.hair = await safeFetchJson(CONFIG.PATH_SERVICES_HAIR);
  state.services.post = await safeFetchJson(CONFIG.PATH_SERVICES_POST);
}
