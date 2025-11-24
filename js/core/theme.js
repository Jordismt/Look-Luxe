import { state } from "./state.js";
import { saveLS } from "./utils.js"; // <-- aquí estaba el problema

export function setupTheme() {
  const logo = document.getElementById("logoImg");
  if (state.theme === "light") {
    document.body.classList.add("light-theme");
    if (logo) logo.src = "img/logo_claro.JPG";
  } else {
    document.body.classList.remove("light-theme");
    if (logo) logo.src = "img/logo.PNG";
  }

  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const newTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
    document.body.classList.toggle("light-theme");
    state.theme = newTheme;
    saveLS("lookluxe_theme_v1", newTheme);
    if (logo) logo.src = newTheme === "light" ? "img/logo_claro.JPG" : "img/logo.PNG";
  });
}
