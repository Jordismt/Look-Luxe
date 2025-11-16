/* ===========================
   CARGAR PRODUCTOS DESDE JSON
=========================== */
const productList = document.getElementById("product-list");

/* ============================
   CARGAR PRODUCTOS EN INDEX.HTML
============================= */
async function loadProducts() {
    const list = document.getElementById("product-list");
    if (!list) return; // No estamos en index

    try {
        const res = await fetch("products.json");
        const products = await res.json();

        list.innerHTML = "";

        products.forEach(p => {
            list.innerHTML += `
            <div class="col-md-4">
                <div class="card shadow-sm">
                    <img src="${p.img}" class="card-img-top" alt="">
                    <div class="card-body">
                        <h5 class="card-title fw-bold">${p.name}</h5>
                        <p>${p.price}€</p>

                        <a href="product.html?id=${p.id}" class="btn btn-dark w-100 mt-2">
                            Ver producto
                        </a>
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


/* ==========
   CARGAR SERVICIOS EN FORMULARIO
=========== */

async function loadServicesToSelect() {
    const select = document.getElementById("serviceSelect");
    if (!select) return;

    try {
        const res = await fetch("services.json");
        const services = await res.json();

        services.forEach(s => {
            const option = document.createElement("option");
            option.value = s.name;
            option.textContent = `${s.name} – ${s.price}€`;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error cargando servicios:", error);
    }
}

loadServicesToSelect();

/* ============================
   MOSTRAR PRODUCTO INDIVIDUAL
============================= */
async function loadProductPage() {
    const container = document.getElementById("product-details");
    if (!container) return; // No estamos en product.html

    // Obtener ID de la URL -> product.html?id=2
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    try {
        const res = await fetch("products.json");
        const products = await res.json();

        const product = products.find(p => p.id == productId);

        if (!product) {
            container.innerHTML = `
                <div class="alert alert-danger">Producto no encontrado.</div>
            `;
            return;
        }

        // Pintar producto
        container.innerHTML = `
            <div class="row align-items-center">

                <div class="col-md-5">
                    <img src="${product.img}" class="img-fluid rounded shadow" alt="">
                </div>

                <div class="col-md-7">
                    <h1 class="mb-3">${product.name}</h1>
                    <p class="lead">${product.description}</p>
                    <h3 class="text-warning fw-bold">${product.price}€</h3>

                    <button class="btn btn-dark mt-3" onclick="addToCart(${product.id})">
                        Añadir al carrito
                    </button>

                    <a href="index.html" class="btn btn-outline-light mt-3 ms-2">
                        Volver atrás
                    </a>
                </div>

            </div>
        `;
    } catch (e) {
        container.innerHTML = `
            <div class="alert alert-danger">Error cargando el producto.</div>
        `;
    }
}


/* ===========================
          CARRITO
=========================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Añadir producto al carrito
function addToCart(id) {
    const item = cart.find(p => p.id === id);

    if (item) {
        item.quantity++;
    } else {
        cart.push({ id, quantity: 1 });
    }

    saveCart();
    alert("Producto añadido al carrito");
    renderCart();
}

// Render del carrito (si tienes página de carrito)
function renderCart() {
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    if (!cartContainer) return; // si no estás en la página de carrito, no hace nada

    cartContainer.innerHTML = "";

    fetch("products.json")
        .then(res => res.json())
        .then(products => {
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
                        <button class="btn btn-sm btn-danger" onclick="removeFromCart(${product.id})">
                            X
                        </button>
                    </div>
                `;
            });

            cartTotal.textContent = total.toFixed(2) + "€";
        });
}

// Eliminar producto
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
}

// Vaciar carrito completamente
function clearCart() {
    cart = [];
    saveCart();
    renderCart();
}

// Simulación de compra
function checkout() {
    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    alert("¡Compra realizada con éxito!");
    clearCart();
}
/* =========================
   SISTEMA DE CITAS PROFESIONAL
========================= */

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
const INTERVAL_MINUTES = 30; // Intervalos de 30 min

// ====================
// CARGAR SERVICIOS DESDE JSON
// ====================
async function loadServices() {
    try {
        const res = await fetch("services.json");
        const services = await res.json();
        services.forEach(s => {
            const option = document.createElement("option");
            option.value = s.name;
            option.textContent = `${s.name} – ${s.price}€`;
            servicesSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Error cargando servicios:", err);
    }
}

// ====================
// ACTUALIZAR HORAS DISPONIBLES
// ====================
function updateAvailableTimes() {
    const date = dateInput.value;
    const service = servicesSelect.value;
    timeSelect.innerHTML = `<option value="" disabled selected>Selecciona hora</option>`;
    if (!date || !service) return;

    // Filtrar horas ocupadas
    const occupied = bookings
        .filter(b => b.date === date && b.service === service)
        .map(b => b.time);

    // Generar todas las horas del día
    let times = [];
    for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
        [0, INTERVAL_MINUTES].forEach(m => {
            let hh = h.toString().padStart(2, "0");
            let mm = m === 0 ? "00" : m.toString().padStart(2, "0");
            const t = `${hh}:${mm}`;
            if (!occupied.includes(t)) times.push(t);
        });
    }

    // Añadir al select
    times.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        timeSelect.appendChild(opt);
    });

    if(times.length === 0){
        const opt = document.createElement("option");
        opt.textContent = "No hay horas disponibles";
        opt.disabled = true;
        timeSelect.appendChild(opt);
    }
}

// ====================
// GUARDAR CITA
// ====================
function saveBooking(name, email, phone, service, date, time) {
    bookings.push({name, email, phone, service, date, time});
    localStorage.setItem("bookings", JSON.stringify(bookings));
}

// ====================
// ACTUALIZAR LISTA DE CITAS
// ====================
function updateBookingList() {
    bookingList.innerHTML = "";
    bookings.sort((a,b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    bookings.forEach(b => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-dark text-light";
        li.innerHTML = `<strong>${b.date} ${b.time}</strong> - ${b.service}<br>${b.name} | ${b.email} | ${b.phone}`;
        bookingList.appendChild(li);
    });
}

// ====================
// VALIDACIÓN DE DUPLICADOS
// ====================
function isAvailable(date, time, service){
    return !bookings.some(b => b.date === date && b.time === time && b.service === service);
}

// ====================
// EVENTOS
// ====================
servicesSelect.addEventListener("change", updateAvailableTimes);
dateInput.addEventListener("change", updateAvailableTimes);

bookingForm.addEventListener("submit", function(e){
    e.preventDefault();

    const name = document.getElementById("bookingName").value.trim();
    const email = document.getElementById("bookingEmail").value.trim();
    const phone = document.getElementById("bookingPhone").value.trim();
    const service = servicesSelect.value;
    const date = dateInput.value;
    const time = timeSelect.value;

    if(!isAvailable(date, time, service)){
        alert(`Lo sentimos, el servicio "${service}" ya está reservado el ${date} a las ${time}.`);
        return;
    }

    saveBooking(name, email, phone, service, date, time);

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

    bookingForm.reset();
    updateAvailableTimes();
    updateBookingList();
});

// ====================
// INICIALIZACIÓN
// ====================
loadServices();
updateBookingList();




/* ===========================
     FORMULARIO DE CITA
=========================== */
document.getElementById("bookingForm")?.addEventListener("submit", function(e){
    e.preventDefault();

    document.getElementById("bookingSuccess").classList.remove("d-none");
    this.reset();
});


const themeToggle = document.getElementById("themeToggle");
const logoImg = document.getElementById("logoImg");

// Función para aplicar tema
function applyTheme(theme) {
    if(theme === "light") {
        document.body.classList.add("light-theme");
        logoImg.src = "img/logo_claro.JPG";
    } else {
        document.body.classList.remove("light-theme");
        logoImg.src = "img/logo.PNG";
    }
    localStorage.setItem("theme", theme);
}

// Cargar tema guardado
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

// Botón toggle
themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("light-theme") ? "light" : "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
});


/* ===========================
   RENDER AUTOMÁTICO SI HAY
   PÁGINA DE CARRITO
=========================== */
document.addEventListener("DOMContentLoaded", renderCart);
