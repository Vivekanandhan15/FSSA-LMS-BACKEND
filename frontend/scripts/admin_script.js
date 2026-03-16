document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(".search-input");
  const courseCards = document.querySelectorAll(".course-card");

  // Search Logic
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      courseCards.forEach((card) => {
        const title = card.querySelector(".course-title").textContent.toLowerCase();
        const desc = card.querySelector(".course-description").textContent.toLowerCase();
        const match = title.includes(term) || desc.includes(term);
        card.style.display = match ? "block" : "none";
        if (match) {
          card.style.animation = "none";
          card.offsetHeight; 
          card.style.animation = "fadeIn 0.3s ease forwards";
        }
      });
    });
  }

  // Pre-select Course in Student Modal
  const enrollButtons = document.querySelectorAll(".btn-enroll");
  const courseSelect = document.getElementById("student-course-select");
  if (enrollButtons.length && courseSelect) {
    enrollButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const title = this.closest(".course-card").querySelector(".course-title").textContent.trim();
        Array.from(courseSelect.options).some((opt, i) => {
          if (opt.text === title) {
            courseSelect.selectedIndex = i;
            return true;
          }
        });
      });
    });
  }

  // Card Navigation
  courseCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".course-actions, .visibility-btn, label, input, button, a")) return;
      const link = this.getAttribute("data-link");
      if (link) window.location.href = link;
    });
  });

  // Form Demos
  const forms = [
    { id: "add-student-form", msg: (f) => `Student "${f.querySelector('input[type="text"]').value}" enrolled!` },
    { sel: "#add-modal-toggle + .modal-overlay form", msg: () => "Course created (Demo)!" }
  ];

  forms.forEach(({ id, sel, msg }) => {
    const form = id ? document.getElementById(id) : document.querySelector(sel);
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert(msg(form));
        form.closest(".modal-overlay").previousElementSibling.checked = false;
        form.reset();
      });
    }
  });
});