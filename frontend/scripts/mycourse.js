import { isLoggedIn, protectPage, API_BASE_URL, getAuthHeaders } from './auth.js';

document.addEventListener("DOMContentLoaded", async () => {
    // Check auth
    await protectPage();

    const searchInput = document.querySelector(".search-input");
    const courseGrid = document.querySelector(".course-grid");
    const noResults = document.getElementById("noResults");
    const userNameDisplay = document.querySelector(".header h2");
    const userAvatarDisplay = document.querySelector(".user span");

    // Set user name from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        if (userNameDisplay) userNameDisplay.innerText = `Hi! ${user.name}`;
        if (userAvatarDisplay) userAvatarDisplay.innerText = user.name;
    }

    let courses = [];

    // Fetch courses
    try {
        const res = await fetch(`${API_BASE_URL}/courses`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            courses = await res.json();
            renderCourses(courses);
        } else {
            console.error("Failed to fetch courses");
        }
    } catch (err) {
        console.error("Error fetching courses:", err);
    }

    function renderCourses(list) {
        courseGrid.innerHTML = "";

        if (list.length === 0) {
            noResults.style.display = "block";
            return;
        }

        noResults.style.display = "none";

        list.forEach(c => {
            if (c.hidden) return; // Don't show hidden courses

            const cardLink = document.createElement("a");
            // Generate slug for link
            const slug = c.full
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-");

            cardLink.href = `./course_view.html?id=${c.id}`;
            // Actually, checking if file exists from JS is hard. 
            // Let's stick to the convention.

            // Determine color based on category or random
            const colors = ["purple", "pink", "blue", "orange"];
            const color = colors[Math.floor(Math.random() * colors.length)];

            cardLink.innerHTML = `
        <div class="course-card ${color}">
            <div class="card-top">
              <div class="icon">📘</div>
              <span class="section">Batch ${c.batches.length > 0 ? c.batches[0] : 'A'}</span>
            </div>
            <h3>${c.full}</h3>
            <p>${c.summary || "No description available."}</p>
            <div class="meta">
              <span>👥 ${Math.floor(Math.random() * 50) + 10} Students</span>
              <span>⏱ ${c.start}</span>
            </div>
          </div>
      `;

            courseGrid.appendChild(cardLink);
        });
    }

    // Search
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = courses.filter(c =>
                c.full.toLowerCase().includes(term) ||
                (c.summary && c.summary.toLowerCase().includes(term))
            );
            renderCourses(filtered);
        });
    }
});
