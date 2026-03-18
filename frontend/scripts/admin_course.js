import { API_BASE_URL, getAuthHeaders, protectPage } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("coursesGrid");
  const search = document.getElementById("searchInput");

  const openAddBtn = document.getElementById("openAddCourse");
  const courseModal = document.getElementById("courseModal");
  const studentModal = document.getElementById("studentModal");

  const closeCourse = document.getElementById("closeCourse");
  const closeStudent = document.getElementById("closeStudent");

  const addForm = document.getElementById("addForm");
  const studentForm = document.getElementById("studentForm");

  const addFull = document.getElementById("addFull");
  const addVisibility = document.getElementById("addVisibility");
  const addStart = document.getElementById("addStart");
  const addEnd = document.getElementById("addEnd");
  const addId = document.getElementById("addId");
  const addSummary = document.getElementById("addSummary");

  const studentBatch = document.getElementById("studentBatch");

  let courses = [];
  let editingIndex = null;
  let activeStudentIndex = null;

  // Use shared API base URL
  const API_URL = `${API_BASE_URL}/courses`;

  init();

  async function init() {
    await protectPage('admin');
    await fetchCourses();
    render();
  }

  async function fetchCourses() {
    try {
      const res = await fetch(API_URL, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        courses = await res.json();
      } else {
        console.error("Failed to fetch courses");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  }

  openAddBtn.onclick = () => openCourse();
  closeCourse.onclick = () => (courseModal.style.display = "none");
  closeStudent.onclick = () => (studentModal.style.display = "none");

  function openCourse(i = null) {
    editingIndex = i;
    addForm.reset();

    courseModal.querySelector("h2").innerText =
      i === null ? "Add Course" : "Edit Course";

    if (i !== null) {
      const c = courses[i];
      addFull.value = c.full;
      addVisibility.value = c.hidden ? "Hide" : "Show";
      addStart.value = c.start;
      addEnd.value = c.end;
      addId.value = c.id;
      // Make ID read-only on edit to avoid complications
      addId.readOnly = true;
      addSummary.value = c.summary;
    } else {
      addId.readOnly = false;
    }

    courseModal.style.display = "grid";
  }

  addForm.onsubmit = async (e) => {
    e.preventDefault();

    const course = {
      full: addFull.value,
      start: addStart.value,
      end: addEnd.value,
      id: addId.value,
      summary: addSummary.value,
      hidden: addVisibility.value === "Hide",
      batches: editingIndex !== null ? courses[editingIndex].batches : [],
    };

    try {
      if (editingIndex !== null) {
        // Update
        const oldId = courses[editingIndex].id;
        const res = await fetch(`${API_URL}/${oldId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(course),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        // Create
        const res = await fetch(API_URL, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(course),
        });
        if (!res.ok) throw new Error("Create failed");
      }

      await fetchCourses();
      render();
      courseModal.style.display = "none";
    } catch (err) {
      alert("Error saving course: " + err.message);
    }
  };

  function render() {
    grid.innerHTML = "";

    courses.forEach((c, i) => {
      const card = document.createElement("div");
      card.className = "course-card";
      if (c.hidden) card.classList.add("hidden");

      const batchBadges =
        c.batches && c.batches.length
          ? c.batches
            .map(
              (b) =>
                `<span class="badge" style="background:#10b981;">Batch ${b}</span>`,
            )
            .join(" ")
          : "None";

      card.innerHTML = `
        <div class="course-header">
          <h3>${c.full}</h3>
          <span class="badge">${c.category}</span>
        </div>

        <p>${c.summary || ""}</p>

        <div class="meta">
          <span>ID: ${c.id}</span>
          <span>${batchBadges}</span>
        </div>

        <div class="course-actions">
          <label class="switch">
            <input type="checkbox" ${!c.hidden ? "checked" : ""}>
            <span class="slider"></span>
          </label>

          <button class="btn-enroll">Add Batch</button>
          <button class="edit">Edit</button>
          <button class="delete">Delete</button>
        </div>
      `;

      // CARD CLICK → course-name.html
      card.onclick = () => {
        window.location.href = `course_view.html?id=${c.id}`;
      };

      // TOGGLE VISIBILITY
      card.querySelector("input").onchange = async (e) => {
        e.stopPropagation();
        const updatedCourse = { ...c, hidden: !e.target.checked };
        try {
          const res = await fetch(`${API_URL}/${c.id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updatedCourse),
          });
          if (res.ok) {
            await fetchCourses();
            render();
          }
        } catch (err) {
          console.error("Error toggling visibility", err);
        }
      };

      // DELETE
      card.querySelector(".delete").onclick = async (e) => {
        e.stopPropagation();
        if (confirm("Delete this course?")) {
          try {
            const res = await fetch(`${API_URL}/${c.id}`, {
              method: "DELETE",
              headers: getAuthHeaders()
            });
            if (res.ok) {
              await fetchCourses();
              render();
            }
          } catch (err) {
            alert("Error deleting course");
          }
        }
      };

      // EDIT
      card.querySelector(".edit").onclick = (e) => {
        e.stopPropagation();
        openCourse(i);
      };

      // ADD BATCH
      card.querySelector(".btn-enroll").onclick = (e) => {
        e.stopPropagation();
        activeStudentIndex = i;
        studentForm.reset();
        studentModal.style.display = "grid";
      };

      grid.appendChild(card);
    });
  }

  search.oninput = () => {
    const q = search.value.toLowerCase();
    document.querySelectorAll(".course-card").forEach((card) => {
      card.style.display = card.innerText.toLowerCase().includes(q)
        ? "flex"
        : "none";
    });
  };

  studentForm.onsubmit = async (e) => {
    e.preventDefault();

    const idx = activeStudentIndex;
    if (idx === null) return;

    // Find course by index or ID (better by ID if we had it easily)
    // courses array is synced with server, so index works IF we don't reorder or filter in render (we do filter in search logic but that hides, not removes from array)
    // Wait, render iterates over `courses` array. Search logic modifies `style.display`.
    // So index `i` is valid for `courses` array.

    const courseId = courses[idx].id;
    const batchName = studentBatch.value;

    // Add batch logic needs API support.
    // I added `POST /{course_id}/batches` in python so I should use it.

    try {
      const url = `${API_URL}/${courseId}/batches?batch_name=${encodeURIComponent(batchName)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (res.ok) {
        await fetchCourses();
        render();
        studentModal.style.display = "none";
      } else {
        alert("Failed to add batch");
      }
    } catch (err) {
      console.error("Error adding batch", err);
    }
  };
});
