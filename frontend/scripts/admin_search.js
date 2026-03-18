// ============================
// SEARCH (ADMIN + USER SAME LOGIC)
// ============================
const searchInput = document.querySelector(".search-input");

if (searchInput) {
  searchInput.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    const cards = document.querySelectorAll(".course-card");

    cards.forEach((card) => {
      const title = card.querySelector(".course-title").textContent.toLowerCase();
      const desc = card.querySelector(".course-desc").textContent.toLowerCase();

      card.style.display =
        title.includes(value) || desc.includes(value) ? "block" : "none";
    });
  });
}
