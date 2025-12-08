let selectedRating = 0;

// Inicializar reseñas en LocalStorage si no existen
function initReviews() {
  if (!localStorage.getItem("reviews")) {
    const defaultReviews = [
      {
        text: "Excelente atención y resultados increíbles. ¡Mi cabello nunca había estado tan bien!",
        author: "Laura M.",
        rating: 5
      },
      {
        text: "Profesionales de verdad, ambiente elegante y súper recomendable.",
        author: "Carlos R.",
        rating: 4
      },
      {
        text: "Me encantó el trato personalizado y los productos de alta calidad.",
        author: "Ana P.",
        rating: 5
      }
    ];
    localStorage.setItem("reviews", JSON.stringify(defaultReviews));
  }
}

// Renderizar reseñas en el HTML
function renderReviews() {
  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
  const container = document.querySelector("#testimonials .row");
  container.innerHTML = ""; // limpiar antes de renderizar

  reviews.forEach((review, index) => {
    const col = document.createElement("div");
    col.className = "col-md-4";
    col.setAttribute("data-aos", "fade-up");
    col.setAttribute("data-aos-delay", `${50 * (index + 1)}`);

    // Generar estrellas visuales
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

    col.innerHTML = `
      <div class="card liquid p-4 text-center shadow">
        <p class="fst-italic">"${review.text}"</p>
        <h6 class="fw-bold mt-3">${review.author}</h6>
        <div class="text-warning fs-5">${stars}</div>
      </div>
    `;
    container.appendChild(col);
  });
}

// Añadir nueva reseña
function addReview(text, author, rating) {
  const reviews = JSON.parse(localStorage.getItem("reviews")) || [];
  reviews.push({ text, author, rating });
  localStorage.setItem("reviews", JSON.stringify(reviews));
  renderReviews();
}

// Inicializar y renderizar al cargar
document.addEventListener("DOMContentLoaded", () => {
  initReviews();
  renderReviews();

  // Manejar selección de estrellas
  const stars = document.querySelectorAll("#starRating .star");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.getAttribute("data-value"));
      stars.forEach(s => s.classList.remove("selected"));
      for (let i = 0; i < selectedRating; i++) {
        stars[i].classList.add("selected");
      }
    });
  });

  // Manejar el formulario
  document.getElementById("reviewForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const text = document.getElementById("reviewText").value;
    const author = document.getElementById("reviewAuthor").value;

    if (selectedRating === 0) {
      alert("Por favor selecciona una valoración con estrellas.");
      return;
    }

    addReview(text, author, selectedRating);
    this.reset();
    selectedRating = 0;
    stars.forEach(s => s.classList.remove("selected"));
  });
});
