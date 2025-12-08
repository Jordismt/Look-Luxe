export class ReviewsService {
  constructor(storageKey = "reviews") {
    this.storageKey = storageKey;
  }

  async init() {
    if (!localStorage.getItem(this.storageKey)) {
      // Cargar reseñas iniciales desde JSON
      const response = await fetch("data/reviews.json");
      const defaultReviews = await response.json();
      localStorage.setItem(this.storageKey, JSON.stringify(defaultReviews));
    }
  }

  getAll() {
    return JSON.parse(localStorage.getItem(this.storageKey)) || [];
  }

  add(review) {
    const reviews = this.getAll();
    reviews.push(review);
    localStorage.setItem(this.storageKey, JSON.stringify(reviews));
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}
