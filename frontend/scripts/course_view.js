import {
  isLoggedIn,
  getCurrentUser,
  protectPage,
  API_BASE_URL,
  getAuthHeaders
} from "./auth.js";

// Global variables for Quill
var quillEditor;
var currentElementBeingEdited = null;
var addingNewBlock = false;
var referenceNodeForInsert = null;
var currentCourseData = null;

// FIX 4: Track whether unsaved changes exist
var hasUnsavedChanges = false;

document.addEventListener("DOMContentLoaded", async () => {
  await protectPage();
  // 1. Auth & Role Check
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  const isAdmin = user.role === "admin";
  console.log("Current user role:", user.role, "Is Admin:", isAdmin);

  if (isAdmin) {
    document
      .querySelectorAll(".admin-only")
      .forEach((el) => el.classList.remove("admin-only"));
    console.log("Admin UI elements enabled");
  }

  // 2. Load Course Data
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get("id");

  if (!courseId) {
    // FIX 1: replace alert with showConfirm
    await showConfirm(
      "Missing Course",
      "No course ID provided.",
      "OK",
      false,
      false,
    );
    window.history.back();
    return;
  }

  // Update back link
  const backLink = document.getElementById("back-link");
  if (isAdmin) {
    backLink.href = "./admin_course.html";
  } else {
    backLink.href = "./mycourse.html";
  }

  try {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Course not found");
    currentCourseData = await response.json();
    renderCourse(currentCourseData);
  } catch (err) {
    console.error(err);
    document.getElementById("main-content").innerHTML =
      `<h2>Error: ${err.message}</h2>`;
  }

  // 3. Initialize Editor (if admin)
  if (isAdmin) {
    console.log("Initializing admin editor...");
    initEditor();
    setupAdminListeners();
  }
});

function renderCourse(course) {
  document.title = `${course.full} - FSSA`;
  document.getElementById("course-title").innerText = course.full;
  document.getElementById("course-summary").innerText = course.summary;
  document.getElementById("course-students").innerText =
    `${Math.floor(Math.random() * 50) + 10} Students`;
  document.getElementById("course-duration").innerText = `14 Weeks`;

  const nav = document.getElementById("topics-nav");
  const main = document.getElementById("main-content");
  nav.innerHTML = "";
  main.innerHTML = "";

  if (!course.content || course.content.length === 0) {
    main.innerHTML = `<div class="content-card"><h3>No content yet.</h3>${isAdminUser() ? "<p>Switch to Edit Mode to add topics.</p>" : ""}</div>`;
    return;
  }

  course.content.forEach((section, sIdx) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "topic-section";

    // Accordion header — click to expand/collapse
    const header = document.createElement("div");
    header.className = "topic-section-header";
    header.innerHTML = `
            <span class="topic-section-title">${section.title}</span>
            <svg class="topic-section-arrow" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
            </svg>
        `;

    // Articles list — collapsible
    const ul = document.createElement("ul");
    ul.className = "topic-articles-list";

    // First section open by default, rest closed
    if (sIdx === 0) {
      sectionDiv.classList.add("open");
    }

    header.addEventListener("click", () => {
      const isOpen = sectionDiv.classList.contains("open");
      // Close all sections
      document
        .querySelectorAll(".topic-section")
        .forEach((s) => s.classList.remove("open"));
      // Toggle clicked
      if (!isOpen) sectionDiv.classList.add("open");
    });

    section.articles.forEach((article, aIdx) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#${article.id}`;
      a.textContent = article.title;
      a.dataset.articleId = article.id;

      // Smooth scroll + active highlight
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document
          .querySelectorAll(".topics-nav a")
          .forEach((l) => l.classList.remove("active"));
        a.classList.add("active");
        const target = document.getElementById(article.id);
        if (target)
          target.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      li.appendChild(a);
      ul.appendChild(li);

      const contentArticle = document.createElement("article");
      contentArticle.className = "content-section";
      contentArticle.id = article.id;
      contentArticle.innerHTML = `
                <h2 data-section-idx="${sIdx}" data-article-idx="${aIdx}" data-type="title">${article.title}</h2>
                <div class="content-body" data-section-idx="${sIdx}" data-article-idx="${aIdx}" data-type="html">
                    ${article.html}
                </div>
            `;
      main.appendChild(contentArticle);
    });

    sectionDiv.appendChild(header);
    sectionDiv.appendChild(ul);
    nav.appendChild(sectionDiv);
  });

  // IntersectionObserver — auto highlight active article in sidebar while scrolling
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          document.querySelectorAll(".topics-nav a").forEach((a) => {
            a.classList.toggle("active", a.dataset.articleId === id);
          });
          // Auto-open the parent section of the active article
          const activeLink = document.querySelector(
            `.topics-nav a[data-article-id="${id}"]`,
          );
          if (activeLink) {
            const parentSection = activeLink.closest(".topic-section");
            if (parentSection && !parentSection.classList.contains("open")) {
              document
                .querySelectorAll(".topic-section")
                .forEach((s) => s.classList.remove("open"));
              parentSection.classList.add("open");
            }
          }
        }
      });
    },
    { threshold: 0.3, rootMargin: "-80px 0px -60% 0px" },
  );

  document
    .querySelectorAll(".content-section")
    .forEach((el) => observer.observe(el));

  // Re-check for edit mode if it's already on
  const editToggle = document.getElementById("edit-mode-toggle");
  if (editToggle && editToggle.checked) {
    // FIX 4: only re-enable edit mode if not locked
    if (!document.body.classList.contains("edit-locked")) {
      enableEditMode();
    }
  }
}

function isAdminUser() {
  const user = getCurrentUser();
  return user && user.role === "admin";
}

function initSearch() {
  const searchInput = document.querySelector(".course-search-input");

  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();

    const links = document.querySelectorAll(".topics-nav a");
    const sections = document.querySelectorAll(".topic-section");

    links.forEach((link) => {
      const text = link.textContent.toLowerCase();
      const li = link.parentElement;

      if (text.includes(query)) {
        li.style.display = "block";
      } else {
        li.style.display = "none";
      }
    });

    sections.forEach((section) => {
      const visibleLinks = section.querySelectorAll("li:not([style*='none'])");

      if (visibleLinks.length === 0) {
        section.style.display = "none";
      } else {
        section.style.display = "block";
      }
    });
  });
}

function initEditor() {
  quillEditor = new Quill("#quill-editor", {
    theme: "snow",
    placeholder: "Write course content...",
    modules: {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    },
  });
}

function saveContent() {
  const content = quillEditor.root.innerHTML;

  const sectionIdx = currentElementBeingEdited.dataset.sectionIdx;
  const articleIdx = currentElementBeingEdited.dataset.articleIdx;

  currentCourseData.content[sectionIdx].articles[articleIdx].html = content;

  hasUnsavedChanges = true;

  renderCourse(currentCourseData);

  closeEditor();
}

function imageHandler() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.click();

  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const range = quillEditor.getSelection(true);

      // add line before image
      quillEditor.insertText(range.index, "\n");

      // insert image
      quillEditor.insertEmbed(
        range.index + 1,
        "image",
        e.target.result,
        "user",
      );

      // add line after image
      quillEditor.insertText(range.index + 2, "\n");

      quillEditor.setSelection(range.index + 3);
    };

    reader.readAsDataURL(file);
  };
}

function setupAdminListeners() {
  const editToggle = document.getElementById("edit-mode-toggle");

  editToggle.addEventListener("change", () => {
    // FIX 4: if edit-locked, prevent turning edit mode back on
    if (editToggle.checked && document.body.classList.contains("edit-locked")) {
      // Silently uncheck — locked until page reloads or user re-saves
      // Actually: allow re-enabling after save (lock is just a UI cue, not a hard block)
      // Remove lock when user manually toggles edit mode back on
      document.body.classList.remove("edit-locked");
      enableEditMode();
      return;
    }

    if (editToggle.checked) {
      enableEditMode();
    } else {
      disableEditMode();
    }
  });

  document.getElementById("save-course-content").onclick = saveToDatabase;

  // FIX 1: Add Section uses showInput modal instead of prompt()
  document.getElementById("add-section-btn").onclick = async () => {
    const title = await showInput(
      "Add New Section",
      "e.g. Introduction, Core Basics",
      "Add Section",
    );
    if (title) {
      currentCourseData.content.push({
        title: title,
        articles: [],
      });
      hasUnsavedChanges = true;
      renderCourse(currentCourseData);
    }
  };
}

function enableEditMode() {
  // Main content editable
  document
    .querySelectorAll("#main-content h2, #main-content .content-body")
    .forEach((el) => {
      el.classList.add("editable-element");
      el.onclick = openTheEditor;
    });

  // Sidebar section titles editable
  document.querySelectorAll(".topic-section-title").forEach((el) => {
    el.classList.add("editable-element");
    el.onclick = (e) => {
      e.stopPropagation();
      openTheEditor(e);
    };
  });

  // Sidebar article links editable
  document.querySelectorAll(".topic-articles-list a").forEach((el) => {
    el.classList.add("editable-element");
    el.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openTheEditor(e);
    };
  });

  // Add topic buttons inside each section's ul
  document.querySelectorAll(".topic-section").forEach((section, idx) => {
    if (!section.querySelector(".add-topic-btn")) {
      const btn = document.createElement("button");
      btn.className = "add-topic-btn";
      btn.innerText = "+ Add Topic";
      btn.onclick = (e) => {
        e.stopPropagation();
        openAddModal(idx);
      };
      const ul = section.querySelector(".topic-articles-list");
      if (ul) ul.appendChild(btn);
    }
  });
}

function disableEditMode() {
  const elementsToEdit = document.querySelectorAll(".editable-element");
  elementsToEdit.forEach((el) => {
    el.classList.remove("editable-element");
    el.onclick = null;
  });
  document
    .querySelectorAll(".topic-section .add-topic-btn")
    .forEach((btn) => btn.remove());
}

function openTheEditor(event) {
  event.preventDefault();
  event.stopPropagation();

  currentElementBeingEdited = event.currentTarget;
  addingNewBlock = false;

  document.getElementById("modal-title").innerText = "Edit Content";
  document.getElementById("topic-input-container").classList.add("hidden");
  document.getElementById("modal-save-btn").innerText = "Save Changes";

  quillEditor.root.innerHTML = currentElementBeingEdited.innerHTML;
  document.getElementById("editor-modal").classList.add("open");
}

let targetSectionIdx = null;
function openAddModal(sectionIdx) {
  targetSectionIdx = sectionIdx;
  addingNewBlock = true;
  currentElementBeingEdited = null;

  document.getElementById("modal-title").innerText = "Add New Topic";
  document.getElementById("topic-input-container").classList.remove("hidden");
  document.getElementById("modal-save-btn").innerText = "Add Topic";
  document.getElementById("modal-topic-heading").value = "";

  quillEditor.root.innerHTML = "";
  document.getElementById("editor-modal").classList.add("open");
}

window.closeEditor = function () {
  document.getElementById("editor-modal").classList.remove("open");
};

window.saveContent = function () {
  const content = quillEditor.root.innerHTML;

  if (addingNewBlock) {
    const title =
      document.getElementById("modal-topic-heading").value || "New Topic";
    const id = "topic-" + Date.now();

    currentCourseData.content[targetSectionIdx].articles.push({
      id: id,
      title: title,
      html: content,
    });
  } else {
    const sIdx = currentElementBeingEdited.getAttribute("data-section-idx");
    const aIdx = currentElementBeingEdited.getAttribute("data-article-idx");
    const type = currentElementBeingEdited.getAttribute("data-type");

    if (type === "title") {
      currentCourseData.content[sIdx].articles[aIdx].title = quillEditor
        .getText()
        .trim();
    } else {
      currentCourseData.content[sIdx].articles[aIdx].html = content;
    }
  }

  hasUnsavedChanges = true;
  renderCourse(currentCourseData);
  closeEditor();
};

async function saveToDatabase() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/courses/${currentCourseData.id}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(currentCourseData),
      },
    );

    if (response.ok) {
      hasUnsavedChanges = false;

      // FIX 1: replace alert with showConfirm (info style)
      await showConfirm(
        "Saved!",
        "Course saved successfully.",
        "OK",
        false,
        false,
      );

      // FIX 4: After save — lock editing until user manually re-enables Edit Mode
      const editToggle = document.getElementById("edit-mode-toggle");
      if (editToggle.checked) {
        disableEditMode();
        editToggle.checked = false;
        document.body.classList.add("edit-locked");
      }
    } else {
      throw new Error("Failed to save course");
    }
  } catch (err) {
    // FIX 1: replace alert with showConfirm (danger style)
    await showConfirm(
      "Save Failed",
      "Error saving: " + err.message,
      "OK",
      true,
      false,
    );
  }
}

// Close editor modal on backdrop click
document.getElementById("editor-modal").addEventListener("click", function (e) {
  if (e.target == this) {
    closeEditor();
  }
});
