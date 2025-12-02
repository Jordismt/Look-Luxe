/* js/chatbot.js
   Chatbot sin backend — busca en JSONs locales (services, services_post, products, merch).
   - IIFE autoarranca en DOMContentLoaded
   - Matching robusto por tokens + scoring
   - Prioridad: productos -> merch -> servicios -> reglas -> fallback
   - UI: burbuja flotante + ventana, envio por Enter o botón
*/

(() => {
  "use strict";

  // Rutas (ajusta si las mueves)
  const PATH_SERVICES = "services.json";
  const PATH_SERVICES_POST = "services_post.json";
  const PATH_PRODUCTS = "products.json";
  const PATH_MERCH = "merch.json";
  const PATH_CHATBOT = "data/chatbot.json"; // opcional

  // Datos en memoria
  let services = [];
  let postServices = [];
  let products = [];
  let merch = [];
  let rules = {};

  // ---------- Helpers ----------

  // Normaliza texto: minúscula, sin acentos, elimina caracteres no alfanum (salvo espacios)
  const normalize = (s) => {
    if (!s) return "";
    return s
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s+áéíóúüñ-]/g, "")
      .trim();
  };

  // Tokeniza y filtra tokens muy cortos
  const tokensOf = (s) => {
    return normalize(s).split(/\s+/).filter(t => t.length > 2);
  };

  // Scoring simple entre query tokens y target text
  function scoreMatch(query, target) {
    if (!query || !target) return 0;
    const qtoks = tokensOf(query);
    if (!qtoks.length) return 0;
    const t = normalize(target);
    let score = 0;
    for (const q of qtoks) {
      if (t === q) score += 1.0;
      else if (t.includes(q)) score += 0.7;
      else {
        // partial token overlap (prefix/suffix)
        if (q.length >= 4 && (t.includes(q.slice(0, Math.max(3, Math.floor(q.length * 0.6)))))) score += 0.45;
      }
    }
    // normalize by tokens count
    return score / qtoks.length;
  }

  // Carga JSON con protección
  async function safeLoad(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn("fetch failed:", path, e);
      return [];
    }
  }

  // ---------- Formateadores de respuesta ----------
  function formatServiceReply(s) {
    const price = (s?.price === undefined || s?.price === null) ? "Consultar" : s.price;
    const priceText = (typeof price === "number") ? price + "€" : price;
    const desc = (s.description || "").toString().replace(/;/g, "<br>");
    const dur = s.duration ? `${s.duration} min` : "—";
    return `
      <div><strong>⭐ ${escapeHtml(s.name)}</strong></div>
      <div>💶 <strong>Precio:</strong> ${escapeHtml(priceText)}</div>
      <div>⏱ <strong>Duración:</strong> ${escapeHtml(dur)}</div>
      <div style="margin-top:8px">📌 ${desc}</div>
    `;
  }

  function formatProductReply(p) {
    const priceText = (p.price !== undefined && p.price !== null) ? (p.price + "€") : "Consultar";
    const desc = escapeHtml(p.description || "");
    return `
      <div><strong>🛒 ${escapeHtml(p.name)}</strong></div>
      <div>💶 <strong>Precio:</strong> ${escapeHtml(priceText)}</div>
      <div style="margin-top:8px">📦 ${desc}</div>
    `;
  }

  function formatMerchReply(m) {
    const priceText = (m.price !== undefined && m.price !== null) ? (m.price + "€") : "Consultar";
    const colors = Array.isArray(m.colors) ? `<div>🎨 Colores: ${escapeHtml(m.colors.join(", "))}</div>` : "";
    const desc = escapeHtml(m.description || "");
    return `
      <div><strong>🎁 ${escapeHtml(m.name)}</strong></div>
      <div>💶 <strong>Precio:</strong> ${escapeHtml(priceText)}</div>
      ${colors}
      <div style="margin-top:8px">📦 ${desc}</div>
    `;
  }

  // Escapa texto para mostrar en DOM (usuario)
  function escapeHtml(text = "") {
    return text.toString().replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  // ---------- Búsquedas robustas ----------
  function findBestProduct(q) {
    let best = null, bestScore = 0;
    for (const p of products) {
      const s = Math.max(
        scoreMatch(q, p.name),
        scoreMatch(q, p.description),
        ...(p.keywords ? p.keywords.map(k => scoreMatch(q, k)) : [0])
      );
      if (s > bestScore) { bestScore = s; best = p; }
    }
    return { item: best, score: bestScore };
  }

  function findBestMerch(q) {
    let best = null, bestScore = 0;
    for (const m of merch) {
      const s = Math.max(
        scoreMatch(q, m.name),
        scoreMatch(q, m.description),
        ...(m.colors ? m.colors.map(c => scoreMatch(q, c)) : [0]),
        ...(m.keywords ? m.keywords.map(k => scoreMatch(q, k)) : [0])
      );
      if (s > bestScore) { bestScore = s; best = m; }
    }
    return { item: best, score: bestScore };
  }

  function findBestService(q) {
    let best = null, bestScore = 0;
    for (const s of [...services, ...postServices]) {
      const sc = Math.max(
        scoreMatch(q, s.name),
        scoreMatch(q, s.description),
        ...(s.keywords ? s.keywords.map(k => scoreMatch(q, k)) : [0])
      );
      if (sc > bestScore) { bestScore = sc; best = s; }
    }
    return { item: best, score: bestScore };
  }

  // ---------- Regla por intentos simples ----------
  function getRuleResponse(norm) {
    if (!rules || typeof rules !== "object") return null;
    for (const key of Object.keys(rules)) {
      if (key === "fallback" || key === "suggestions" || key === "welcome") continue;
      const block = rules[key];
      if (!block || !Array.isArray(block.keywords)) continue;
      for (const kw of block.keywords) {
        if (norm.includes(normalize(kw))) {
          const responses = block.responses || [];
          return responses[Math.floor(Math.random() * responses.length)] || null;
        }
      }
    }
    return null;
  }

  // ---------- Generador de respuesta ----------
  function getBotResponseRaw(message) {
    const q = message || "";
    const norm = normalize(q);

    // 1 - Productos (prioridad si encontramos buena coincidencia)
    const prodRes = findBestProduct(q);
    if (prodRes.score >= 0.55 && prodRes.item) {
      return formatProductReply(prodRes.item);
    }

    // 2 - Merch
    const merchRes = findBestMerch(q);
    if (merchRes.score >= 0.55 && merchRes.item) {
      return formatMerchReply(merchRes.item);
    }

    // 3 - Servicios
    const servRes = findBestService(q);
    if (servRes.score >= 0.55 && servRes.item) {
      return formatServiceReply(servRes.item);
    }

    // 4 - Reglas definidas en chatbot.json
    const rule = getRuleResponse(norm);
    if (rule) return rule;

    // 5 - Preguntas simples por palabras
    // ejemplo "precio", "cuanto cuesta" -> tratar de pedir que especifiquen
    if (/\b(precio|cuanto cuesta|cuánto cuesta|vale|cost(a|e))\b/.test(norm)) {
      return "¿Qué producto o servicio te interesa exactamente? Dime el nombre y te digo el precio.";
    }
    if (/\b(hora|horario|horarios)\b/.test(norm)) {
      return "Abrimos L-V 10:00–20:00 y Sábados 10:00–14:00.";
    }

    // fallback
    const fb = (Array.isArray(rules?.fallback) && rules.fallback.length)
      ? rules.fallback
      : [
        "Perdona, no he entendido. ¿Quieres ver servicios, productos o merchandising?",
        "Puedo decirte precios, duración y detalles. Escribe por ejemplo: '¿Cuánto cuesta un corte masculino?'"
      ];
    return fb[Math.floor(Math.random() * fb.length)];
  }

  // ---------- UI Helpers ----------
  function createBubble(textHtml, who = "bot") {
    const wrapper = document.createElement("div");
    wrapper.className = `chat-msg ${who}`;
    const inner = document.createElement("div");
    inner.className = `chat-bubble ${who}`;
    // Bot replies may contain controlled HTML (we produced it). User text must be escaped already.
    inner.innerHTML = textHtml;
    wrapper.appendChild(inner);
    return wrapper;
  }

  function scrollChat(win) {
    win.scrollTop = win.scrollHeight;
  }

  // ---------- UI bind y comportamiento ----------
  function setupUI() {
    const bubble = document.getElementById("chat-bubble");
    const container = document.getElementById("chat-container");
    const closeBtn = document.getElementById("closeChat");
    const sendBtn = document.getElementById("sendBtn");
    const input = document.getElementById("message");
    const win = document.getElementById("chat-window");

    if (!bubble || !container || !sendBtn || !input || !win || !closeBtn) {
      console.warn("Chat UI: faltan elementos. Revisa IDs (chat-bubble, chat-container, chat-window, message, sendBtn, closeChat).");
      return;
    }

    // Asegurar estado inicial: oculto
    if (!container.classList.contains("hidden")) container.classList.add("hidden");

    // Toggle
    bubble.addEventListener("click", () => {
      container.classList.toggle("hidden");
      if (!container.classList.contains("hidden")) {
        setTimeout(() => input.focus(), 200);
      }
    });

    closeBtn.addEventListener("click", () => container.classList.add("hidden"));

    // enviar
    function doSend() {
      const raw = input.value.trim();
      if (!raw) return;
      // append user
      win.appendChild(createBubble(escapeHtml(raw), "user"));
      scrollChat(win);
      input.value = "";

      // delay for realism
      setTimeout(() => {
        try {
          const reply = getBotResponseRaw(raw);
          win.appendChild(createBubble(reply, "bot"));
          // if there are suggestions in rules, show them
          if (Array.isArray(rules?.suggestions) && rules.suggestions.length) {
            const sugWrap = document.createElement("div");
            sugWrap.className = "chat-suggestions";
            rules.suggestions.slice(0, 4).forEach(sg => {
              const sp = document.createElement("button");
              sp.type = "button";
              sp.className = "chat-sug-btn";
              sp.textContent = sg;
              sp.addEventListener("click", () => {
                input.value = sg;
                input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
              });
              sugWrap.appendChild(sp);
            });
            win.appendChild(sugWrap);
          }
          scrollChat(win);
        } catch (err) {
          console.error("chat reply error:", err);
          win.appendChild(createBubble("Lo siento, ha ocurrido un error al generar la respuesta.", "bot"));
          scrollChat(win);
        }
      }, 320);
    }

    // Enter key
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        doSend();
      }
    });
    sendBtn.addEventListener("click", doSend);

    // welcome (once per session)
    if (!sessionStorage.getItem("chat_welcome_shown")) {
      const welcome = (rules?.welcome) ? rules.welcome : "Hola 👋 — Soy el asistente de Look&Luxe. Pregunta por precios o servicios.";
      win.appendChild(createBubble(welcome, "bot"));
      scrollChat(win);
      sessionStorage.setItem("chat_welcome_shown", "1");
    }
  }

  // ---------- Load all data ----------
  async function loadAll() {
    // cargar reglas/chatbot.json (si falla, usamos defaults)
    try {
      const res = await fetch(PATH_CHATBOT);
      if (res.ok) rules = await res.json();
      else rules = {};
    } catch (e) {
      rules = {};
    }

    // Cargar datos
    const [s1, s2, p, m] = await Promise.all([
      safeLoad(PATH_SERVICES),
      safeLoad(PATH_SERVICES_POST),
      safeLoad(PATH_PRODUCTS),
      safeLoad(PATH_MERCH)
    ]);
    services = Array.isArray(s1) ? s1 : [];
    postServices = Array.isArray(s2) ? s2 : [];
    products = Array.isArray(p) ? p : [];
    merch = Array.isArray(m) ? m : [];
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", async () => {
    await loadAll();
    setupUI();
    // expose small debug API
    window.__LL_CHATBOT = {
      reload: async () => { await loadAll(); console.log("chat data reloaded"); },
      data: () => ({ services, postServices, products, merch, rules })
    };
  });

})();
