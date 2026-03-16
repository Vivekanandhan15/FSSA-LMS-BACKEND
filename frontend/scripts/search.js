document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-input");
  const courseGrid = document.querySelector(".course-grid");
  const cards = Array.from(document.querySelectorAll(".course-card"));
  const noResults = document.getElementById("noResults");

  if (!searchInput || cards.length === 0) return;

  searchInput.addEventListener("input", () => {
    const text = searchInput.value.toLowerCase().trim();

    const matched = [];
    const unmatched = [];

    cards.forEach(card => {
      const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
      const desc = card.querySelector("p")?.innerText.toLowerCase() || "";

      if (title.includes(text) || desc.includes(text)) {
        matched.push(card.closest("a") || card); // handle <a> wrapped cards
      } else {
        unmatched.push(card.closest("a") || card);
      }
    });

    // Clear grid
    courseGrid.innerHTML = "";

    // Show matched first
    matched.forEach(card => {
      card.style.display = "block";
      courseGrid.appendChild(card);
    });

    // Hide unmatched when searching
    unmatched.forEach(card => {
      card.style.display = text ? "none" : "block";
      courseGrid.appendChild(card);
    });

    // No results message
    noResults.style.display = matched.length === 0 && text ? "block" : "none";
  });
});
