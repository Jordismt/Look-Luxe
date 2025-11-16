/* ===========================
   CARGAR PRODUCTOS DESDE JSON
=========================== */
const productList = document.getElementById("product-list");

async function loadProducts() {
    if (!productList) return;
    try {
        const res = await fetch("products.json");
        const products = await res.json();
        productList.innerHTML = "";

        products.forEach(p => {
            productList.innerHTML += `
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
            `;
        });

    } catch (error) {
        console.error("Error cargando productos:", error);
    }
}
loadProducts();

/* ===========================
   CARGAR PRODUCTO INDIVIDUAL
=========================== */
async function loadProductPage() {
    const container = document.getElementById("product-details");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    try {
        const res = await fetch("products.json");
        const products = await res.json();
        const product = products.find(p => p.id == productId);

        if (!product) {
            container.innerHTML = `<div class="alert alert-danger">Producto no encontrado.</div>`;
            return;
        }

        container.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-5">
                    <img src="${product.img}" class="img-fluid rounded shadow" alt="${product.name}">
                </div>
                <div class="col-md-7">
                    <h1 class="mb-3">${product.name}</h1>
                    <p class="lead">${product.description}</p>
                    <h3 class="text-warning fw-bold">${product.price}€</h3>
                    <button class="btn btn-dark mt-3" onclick="addToCart(${product.id})">Añadir al carrito</button>
                    <a href="index.html" class="btn btn-outline-light mt-3 ms-2">Volver atrás</a>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="alert alert-danger">Error cargando el producto.</div>`;
    }
}

/* ===========================
          CARRITO
=========================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); }
function addToCart(id) {
    const item = cart.find(p => p.id === id);
    if (item) item.quantity++; else cart.push({ id, quantity: 1 });
    saveCart();
    alert("Producto añadido al carrito");
    renderCart();
}
function renderCart() {
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    if (!cartContainer) return;

    cartContainer.innerHTML = "";
    fetch("products.json").then(res => res.json()).then(products => {
        let total = 0;
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if (!product) return;
            const subtotal = product.price * item.quantity;
            total += subtotal;
            cartContainer.innerHTML += `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <strong>${product.name}</strong><br>
                        ${item.quantity} x ${product.price}€
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeFromCart(${product.id})">X</button>
                </div>
            `;
        });
        cartTotal.textContent = total.toFixed(2) + "€";
    });
}
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); renderCart(); }
function clearCart() { cart = []; saveCart(); renderCart(); }
function checkout() { if(cart.length===0){alert("El carrito está vacío."); return;} alert("¡Compra realizada con éxito!"); clearCart(); }

/* ===========================
   SISTEMA DE CITAS PROFESIONAL
=========================== */
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
const servicesSelect = document.getElementById("serviceSelect");
const dateInput = document.getElementById("bookingDate");
const timeSelect = document.getElementById("bookingTime");
const bookingList = document.getElementById("bookingList");
const bookingForm = document.getElementById("bookingForm");
const successDiv = document.getElementById("bookingSuccess");

// HORARIO DE LA PELUQUERÍA
const OPEN_HOUR = 10;
const CLOSE_HOUR = 19;
const INTERVAL_MINUTES = 30;

// ====================
// CARGAR SERVICIOS DESDE JSON CON DURACIÓN
// ====================
let services = [];
async function loadServices() {
    try {
        const res = await fetch("services.json");
        services = await res.json();
        services.forEach(s => {
            const option = document.createElement("option");
            option.value = s.name;
            option.textContent = `${s.name} – ${s.price}€`;
            option.dataset.duration = s.duration;
            servicesSelect.appendChild(option);
        });
    } catch (err) { console.error("Error cargando servicios:", err); }
}
loadServices();

// ====================
// GENERAR HORARIOS DISPONIBLES SEGÚN DURACIÓN
// ====================
function timeToMinutes(timeStr){ const [h,m]=timeStr.split(":").map(Number); return h*60+m; }
function minutesToTime(min){ const h=Math.floor(min/60); const m=min%60; return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`; }

function isTimeAvailable(date, startTime, duration){
    const start = timeToMinutes(startTime);
    const end = start + duration;
    return !bookings.some(b => {
        if(b.date !== date) return false;
        const bStart = timeToMinutes(b.time);
        const serviceObj = services.find(s=>s.name===b.service);
        const bDuration = serviceObj?.duration || 30;
        const bEnd = bStart + bDuration;
        return start < bEnd && end > bStart;
    });
}

function updateAvailableTimes(){
    const date = dateInput.value;
    const serviceName = servicesSelect.value;
    timeSelect.innerHTML = `<option value="" disabled selected>Selecciona hora</option>`;
    if(!date || !serviceName) return;
    const service = services.find(s=>s.name===serviceName);
    const duration = service?.duration || 30;

    for(let h=OPEN_HOUR; h<CLOSE_HOUR; h++){
        for(let m=0; m<60; m+=INTERVAL_MINUTES){
            const t = `${h.toString().padStart(2,'0')}:${m===0?'00':m.toString().padStart(2,'0')}`;
            if(isTimeAvailable(date,t,duration)) {
                const opt = document.createElement("option");
                opt.value = t;
                opt.textContent = t;
                timeSelect.appendChild(opt);
            }
        }
    }

    if(timeSelect.options.length === 1){
        const opt = document.createElement("option");
        opt.textContent = "No hay horas disponibles";
        opt.disabled = true;
        timeSelect.appendChild(opt);
    }
}

// ====================
// GUARDAR CITA
// ====================
function saveBooking(name,email,phone,service,date,time){
    bookings.push({name,email,phone,service,date,time});
    localStorage.setItem("bookings",JSON.stringify(bookings));
}

// ====================
// ACTUALIZAR LISTA DE CITAS
// ====================
function updateBookingList(){
    bookingList.innerHTML = "";
    bookings.sort((a,b)=> new Date(a.date+' '+a.time) - new Date(b.date+' '+b.time));
    bookings.forEach(b=>{
        const li=document.createElement("li");
        li.className="list-group-item bg-dark text-light mb-1";
        li.innerHTML = `<strong>${b.date} ${b.time}</strong> - ${b.service}<br>${b.name} | ${b.email} | ${b.phone}`;
        bookingList.appendChild(li);
    });
}

// ====================
// EVENTOS
// ====================
servicesSelect.addEventListener("change",updateAvailableTimes);
dateInput.addEventListener("change",updateAvailableTimes);

bookingForm.addEventListener("submit", function(e){
    e.preventDefault();
    const name = document.getElementById("bookingName").value.trim();
    const email = document.getElementById("bookingEmail").value.trim();
    const phone = document.getElementById("bookingPhone").value.trim();
    const service = servicesSelect.value;
    const date = dateInput.value;
    const time = timeSelect.value;
    const serviceObj = services.find(s=>s.name===service);
    const duration = serviceObj?.duration || 30;

    if(!time || !isTimeAvailable(date,time,duration)){
        alert(`Lo sentimos, el servicio "${service}" no está disponible a esa hora.`);
        return;
    }

    saveBooking(name,email,phone,service,date,time);
    updateBookingList();
    bookingForm.reset();
    updateAvailableTimes();

    successDiv.classList.remove("d-none");
    successDiv.innerHTML = `
        ✅ Cita confirmada:<br>
        <strong>Nombre:</strong> ${name}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Teléfono:</strong> ${phone}<br>
        <strong>Servicio:</strong> ${service}<br>
        <strong>Fecha:</strong> ${date}<br>
        <strong>Hora:</strong> ${time}
    `;
});

/* ===========================
   TEMA DARK & GOLD / LIGHT
=========================== */
const themeToggle = document.getElementById("themeToggle");
const logoImg = document.getElementById("logoImg");
function applyTheme(theme){
    if(theme==="light"){ document.body.classList.add("light-theme"); logoImg.src="img/logo_claro.JPG"; }
    else{ document.body.classList.remove("light-theme"); logoImg.src="img/logo.PNG"; }
    localStorage.setItem("theme",theme);
}
applyTheme(localStorage.getItem("theme")||"dark");
themeToggle.addEventListener("click", ()=>{
    applyTheme(document.body.classList.contains("light-theme")?"dark":"light");
});

/* ===========================
   CARRITO AUTOMÁTICO
=========================== */
document.addEventListener("DOMContentLoaded", renderCart);
