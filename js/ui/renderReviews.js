import { ReviewsService } from "../services/reviewsService.js";

export class ReviewsUI {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    this.service = new ReviewsService();
  }

  async init() {
    await this.service.init();
    this.render();
  }

  render() {
    const reviews = this.service.getAll();
    this.container.innerHTML = "";

    reviews.forEach((review, index) => {
      const col = document.createElement("div");
      col.className = "col-md-4";
      col.setAttribute("data-aos", "fade-up");
      col.setAttribute("data-aos-delay", `${50 * (index + 1)}`);

      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

      col.innerHTML = `
        <div class="card liquid p-4 text-center shadow">
          <p class="fst-italic">"${review.text}"</p>
          <h6 class="fw-bold mt-3">${review.author}</h6>
          <div class="text-warning fs-5">${stars}</div>
        </div>
      `;
      this.container.appendChild(col);
    });
  }

  addReview(text, author, rating) {
    this.service.add({ text, author, rating });
    this.render();
  }
}
