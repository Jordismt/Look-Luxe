/* main.js - Look&Luxe
   Versión completa con doble select de servicios y bookings dinámicos
*/

(() => {
  "use strict";

  /* -------------------------
     Config / Constantes
  ------------------------- */
  const PATH_PRODUCTS = "./products.json";
  const PATH_SERVICES_HAIR = "./services.json";
  const PATH_SERVICES_POST = "./services_post.json";
  const LS_CART = "lookluxe_cart_v2";
  const LS_BOOKINGS = "lookluxe_bookings_v2";
  const LS_THEME = "lookluxe_theme_v1";

  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 19;
  const INTERVAL_MINUTES = 30;

  /* -------------------------
     State
  ------------------------- */
  const state = {
    products: [],
    services: { hair: [], post: [] },
    cart: JSON.parse(localStorage.getItem(LS_CART)) || [],
    bookings: JSON.parse(localStorage.getItem(LS_BOOKINGS)) || [],
    theme: localStorage.getItem(LS_THEME) || "dark"
  };

  /* -------------------------
     Helpers
  ------------------------- */
  const $ = (id) => document.getElementById(id);
  const timeToMinutes = (t) => { const [hh, mm] = t.split(":").map(Number); return hh * 60 + mm; };
  const saveLS = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const safeFetchJson = async (path) => { 
    const res = await fetch(path); 
    if(!res.ok) throw new Error(`Fetch failed ${path}: ${res.status}`); 
    return res.json(); 
  };

  /* -------------------------
     PRODUCTS
  ------------------------- */
  async function loadProductsIfNeeded() {
    const el = $("product-list");
    if(!el) return;
    try{
      state.products = await safeFetchJson(PATH_PRODUCTS);
      el.innerHTML = "";
      state.products.forEach(p=>{
        el.insertAdjacentHTML("beforeend", `
          <div class="col-md-4" data-aos="fade-up">
            <div class="card shadow-sm">
              <img src="${p.img}" class="card-img-top" alt="${p.name}">
              <div class="card-body">
                <h5 class="card-title fw-bold">${p.name}</h5>
                <p class="fw-bold">${p.price}€</p>
                <a href="product.html?id=${p.id}" class="btn btn-dark w-100 mt-2">Ver producto</a>
              </div>
            </div>
          </div>
        `);
      });
    } catch(err){
      console.error(err);
      el.innerHTML = `<div class="alert alert-danger">No se pudieron cargar los productos.</div>`;
    }
  }

  async function loadProductPageIfNeeded(){
    const container = $("product-details");
    if(!container) return;
    const id = new URLSearchParams(window.location.search).get("id");
    if(!id){ container.innerHTML = `<div class="alert alert-warning">ID de producto no especificado.</div>`; return; }

    try{
      if(!state.products.length) state.products = await safeFetchJson(PATH_PRODUCTS);
      const p = state.products.find(p=>String(p.id)===String(id));
      if(!p){ container.innerHTML = `<div class="alert alert-danger">Producto no encontrado.</div>`; return; }

      container.innerHTML = `
        <div class="row align-items-center">
          <div class="col-md-5">
            <img src="${p.img}" class="img-fluid rounded shadow" alt="${p.name}">
          </div>
          <div class="col-md-7">
            <h1>${p.name}</h1>
            <p class="lead">${p.description||""}</p>
            <h3 class="text-warning fw-bold">${p.price}€</h3>
            <button class="btn btn-dark mt-3" id="addProductBtn">Añadir al carrito</button>
            <a href="index.html" class="btn btn-outline-light mt-3 ms-2">Volver atrás</a>
          </div>
        </div>
      `;

      $("addProductBtn")?.addEventListener("click",()=>addToCart(p.id));

    } catch(err){ 
      console.error(err); 
      container.innerHTML = `<div class="alert alert-danger">Error cargando el producto.</div>`; 
    }
  }

  /* -------------------------
     CART
  ------------------------- */
  function getCartItemIndex(id){ return state.cart.findIndex(c=>String(c.id)===String(id)); }
  function addToCart(id){ 
    const idx = getCartItemIndex(id);
    if(idx>=0) state.cart[idx].quantity++;
    else state.cart.push({id:String(id), quantity:1});
    saveLS(LS_CART,state.cart); renderCartIfNeeded(); showToast("Producto añadido al carrito");
  }
  function removeFromCart(id){ state.cart = state.cart.filter(c=>String(c.id)!==String(id)); saveLS(LS_CART,state.cart); renderCartIfNeeded(); }
  function clearCart(){ state.cart=[]; saveLS(LS_CART,state.cart); renderCartIfNeeded(); }

  async function renderCartIfNeeded(){
    const container = $("cart-items"); const totalEl = $("cart-total");
    if(!container || !totalEl) return;

    if(!state.products.length){
      try{ state.products = await safeFetchJson(PATH_PRODUCTS); } 
      catch(err){ console.error(err); container.innerHTML=`<div class="alert alert-danger">Error cargando datos del carrito.</div>`; return; }
    }

    container.innerHTML=""; let total=0;
    if(!state.cart.length){ container.innerHTML=`<div class="alert alert-light">Tu carrito está vacío.</div>`; totalEl.textContent="0€"; return; }

    state.cart.forEach(item=>{
      const p = state.products.find(x=>String(x.id)===String(item.id));
      if(!p) return;
      total += (Number(p.price)||0)*(item.quantity||0);
      const row = document.createElement("div");
      row.className="d-flex justify-content-between align-items-center border-bottom py-2";
      row.innerHTML=`
        <div><strong>${p.name}</strong><br>${item.quantity} x ${p.price}€</div>
        <div>
          <button class="btn btn-sm btn-secondary me-2" data-action="dec" data-id="${p.id}">-</button>
          <button class="btn btn-sm btn-secondary me-2" data-action="inc" data-id="${p.id}">+</button>
          <button class="btn btn-sm btn-danger" data-action="remove" data-id="${p.id}">Eliminar</button>
        </div>
      `;
      container.appendChild(row);
    });
    totalEl.textContent = total.toFixed(2)+"€";

    container.querySelectorAll("button[data-action]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const id = btn.dataset.id, idx = getCartItemIndex(id);
        if(btn.dataset.action==="remove") removeFromCart(id);
        if(btn.dataset.action==="inc"){ if(idx>=0) state.cart[idx].quantity++; saveLS(LS_CART,state.cart); renderCartIfNeeded(); }
        if(btn.dataset.action==="dec"){ if(idx>=0) state.cart[idx].quantity=Math.max(1,state.cart[idx].quantity-1); saveLS(LS_CART,state.cart); renderCartIfNeeded(); }
      });
    });
  }

  /* -------------------------
     SERVICES & BOOKINGS
  ------------------------- */
  async function loadServicesIfNeeded(){
    const typeSelect = $("serviceType");
    const serviceSelect = $("serviceSelect");
    const serviceList = $("service-list");
    if(!typeSelect && !serviceSelect && !serviceList) return;

    try{
      state.services.hair = await safeFetchJson(PATH_SERVICES_HAIR);
      state.services.post = await safeFetchJson(PATH_SERVICES_POST);

      // Mostrar tarjetas en sección servicios
      if(serviceList){
        serviceList.innerHTML="";
        const all = [...state.services.hair.map(s=>({...s, category:"hair"})), ...state.services.post.map(s=>({...s, category:"post"}))];
        all.forEach((s,i)=>{
          serviceList.insertAdjacentHTML("beforeend",`
            <div class="col-md-4" data-aos="fade-up" data-aos-delay="${i*100}">
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

      // Bind doble select
      if(typeSelect && serviceSelect){
        typeSelect.addEventListener("change",()=>{
          const tipo = typeSelect.value;
          serviceSelect.innerHTML = `<option value="" disabled selected>Selecciona un servicio...</option>`;
          let servicios = [];
          if(tipo==="peluqueria") servicios = state.services.hair;
          if(tipo==="posticeria") servicios = state.services.post;
          servicios.forEach(s=>{
            const opt = document.createElement("option");
            opt.value = s.name;
            opt.dataset.category = tipo==="peluqueria"?"hair":"post";
            opt.dataset.duration = s.duration;
            opt.textContent = `${s.name} – ${s.price}€`;
            serviceSelect.appendChild(opt);
          });
          updateAvailableTimesIfNeeded();
        });
      }

    } catch(err){ console.error(err); }
  }

  function isTimeAvailable(date, startTime, duration, category){
    const start = timeToMinutes(startTime); const end = start+duration;
    return !state.bookings.some(b=>{
      if(b.date!==date || b.category!==category) return false;
      const s = [...state.services.hair,...state.services.post].find(s=>s.name===b.service);
      const d = s?.duration||30;
      const sStart = timeToMinutes(b.time);
      const sEnd = sStart + d;
      return start<sEnd && end>sStart;
    });
  }

  function updateAvailableTimesIfNeeded(){
    const date = $("bookingDate")?.value;
    const sel = $("serviceSelect");
    const timeSelect = $("bookingTime");
    if(!date || !sel || !timeSelect) return;

    const serviceName = sel.value;
    const category = sel.options[sel.selectedIndex]?.dataset?.category;
    timeSelect.innerHTML=`<option value="" disabled selected>Selecciona hora</option>`;
    if(!serviceName || !category) return;

    const s = [...state.services.hair,...state.services.post].find(x=>x.name===serviceName);
    const dur = s?.duration||30;

    for(let h=OPEN_HOUR; h<CLOSE_HOUR; h++){
      for(let m=0; m<60; m+=INTERVAL_MINUTES){
        const t = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
        if(isTimeAvailable(date,t,dur,category)){
          const opt = document.createElement("option"); opt.value=t; opt.textContent=t; timeSelect.appendChild(opt);
        }
      }
    }
    if(timeSelect.options.length===1){ const opt = document.createElement("option"); opt.textContent="No hay horas disponibles"; opt.disabled=true; timeSelect.appendChild(opt);}
  }

  function saveBooking(name,email,phone,service,date,time,category){
    state.bookings.push({name,email,phone,service,date,time,category});
    saveLS(LS_BOOKINGS,state.bookings);
  }

  function renderBookingListIfNeeded(){
    const list = $("bookingList"); if(!list) return;
    list.innerHTML="";
    state.bookings.slice().sort((a,b)=>new Date(a.date+" "+a.time)-new Date(b.date+" "+b.time)).forEach(b=>{
      const li = document.createElement("li");
      li.className="list-group-item bg-dark text-light mb-1";
      const cat = b.category === "hair" ? "Peluquería" : "Posticería";
      li.innerHTML=`<strong>${b.date} ${b.time}</strong> - ${b.service} (${cat})<br>${b.name} | ${b.email} | ${b.phone}`;
      list.appendChild(li);
    });
  }


  /* -------------------------
     FORM BINDINGS
  ------------------------- */
  function bindBookingFormIfNeeded(){
    const form = $("bookingForm"); if(!form) return;
    form.addEventListener("submit", e=>{
      e.preventDefault();
      const name=$("bookingName")?.value.trim();
      const email=$("bookingEmail")?.value.trim();
      const phone=$("bookingPhone")?.value.trim();
      const service=$("serviceSelect")?.value.trim();
      const date=$("bookingDate")?.value.trim();
      const time=$("bookingTime")?.value.trim();
      const category=$("serviceSelect")?.options[$("serviceSelect").selectedIndex]?.dataset?.category;

      if(!name||!email||!phone||!service||!date||!time||!category){ alert("Completa todos los campos."); return; }

      const sObj=[...state.services.hair,...state.services.post].find(s=>s.name===service);
      const dur = sObj?.duration||30;
      if(!isTimeAvailable(date,time,dur,category)){ alert(`La franja ${date} ${time} no está disponible.`); return; }

      saveBooking(name,email,phone,service,date,time,category);
      renderBookingListIfNeeded();
      form.reset();
      $("serviceSelect").innerHTML=`<option value="" disabled selected>Selecciona un servicio...</option>`;
      $("bookingTime").innerHTML=`<option value="" disabled selected>Selecciona hora</option>`;
      updateAvailableTimesIfNeeded();

      const successDiv=$("bookingSuccess");
      if(successDiv){
        successDiv.classList.remove("d-none");
        const catText = category === "hair" ? "Peluquería" : "Posticería";
        successDiv.innerHTML=`✅ Cita confirmada:<br>
          <strong>Nombre:</strong> ${name}<br>
          <strong>Email:</strong> ${email}<br>
          <strong>Teléfono:</strong> ${phone}<br>
          <strong>Servicio:</strong> ${service} (${catText})<br>
          <strong>Fecha:</strong> ${date}<br>
          <strong>Hora:</strong> ${time}`;

      }
    });

    $("serviceSelect")?.addEventListener("change", updateAvailableTimesIfNeeded);
    $("bookingDate")?.addEventListener("change", updateAvailableTimesIfNeeded);
  }

  /* -------------------------
     THEME
  ------------------------- */
  function applyTheme(theme){
    const logo=$("logoImg");
    if(theme==="light"){ document.body.classList.add("light-theme"); if(logo) logo.src="img/logo_claro.JPG"; }
    else{ document.body.classList.remove("light-theme"); if(logo) logo.src="img/logo.PNG"; }
    state.theme=theme; saveLS(LS_THEME,theme);
  }
  function setupThemeToggle(){
    const btn=$("themeToggle"); applyTheme(state.theme||"dark");
    if(!btn) return;
    btn.addEventListener("click",()=>applyTheme(document.body.classList.contains("light-theme")?"dark":"light"));
  }

  /* -------------------------
     UI Helpers
  ------------------------- */
  function showToast(msg,ms=1500){
    const existing=document.querySelector("#ll-toast"); if(existing) existing.remove();
    const div=document.createElement("div"); div.id="ll-toast";
    Object.assign(div.style,{
      position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%) scale(0.8)",
      background:"rgba(0,0,0,0.85)", color:"#fff", padding:"1rem 1.6rem", borderRadius:"12px",
      zIndex:"99999", fontWeight:"600", fontSize:"1.2rem", boxShadow:"0 8px 25px rgba(0,0,0,0.3)",
      opacity:"0", transition:"opacity .35s ease, transform .35s ease"
    });
    div.textContent=msg; document.body.appendChild(div);
    setTimeout(()=>{ div.style.opacity="1"; div.style.transform="translate(-50%,-50%) scale(1)"; },20);
    setTimeout(()=>{ div.style.opacity="0"; div.style.transform="translate(-50%,-50%) scale(0.8)"; setTimeout(()=>div.remove(),350); },ms);
  }

  /* -------------------------
     CHECKOUT
  ------------------------- */
  function bindCartButtons(){
    document.querySelector("button[onclick='checkout()']")?.addEventListener("click",()=>{
      if(!state.cart.length){ alert("El carrito está vacío."); return; }
      alert("¡Compra realizada con éxito!"); clearCart();
    });
    document.querySelector("button[onclick='clearCart()']")?.addEventListener("click",()=>{
      if(!confirm("¿Vaciar el carrito?")) return; clearCart();
    });
  }

  /* -------------------------
     INIT
  ------------------------- */
  async function init(){
    await loadProductsIfNeeded();
    await loadProductPageIfNeeded();
    await renderCartIfNeeded();
    await loadServicesIfNeeded();
    renderBookingListIfNeeded();
    bindBookingFormIfNeeded();
    setupThemeToggle();
    bindCartButtons();
    if(window.AOS) AOS.init({once:true,duration:800,offset:80});
  }

  document.addEventListener("DOMContentLoaded",init);

  /* -------------------------
     Expose globals
  ------------------------- */
  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.clearCart = clearCart;
  window.checkout = ()=>{ 
    const btn = document.querySelector("button[onclick='checkout()']"); 
    if(btn) btn.click(); 
    else{ if(!state.cart.length){alert("El carrito está vacío.");return;} alert("¡Compra realizada con éxito!"); clearCart(); }
  };

})();
