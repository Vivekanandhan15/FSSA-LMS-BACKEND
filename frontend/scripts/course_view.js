import {
  getCurrentUser,
  protectPage,
  API_BASE_URL,
  getAuthHeaders
} from "./auth.js";

var quillEditor;
var currentElementBeingEdited = null;
var currentCourseData = null;
var hasUnsavedChanges = false;

document.addEventListener("DOMContentLoaded", async () => {
  await protectPage();

  const user = getCurrentUser();
  if (!user) {
    window.location.href = "./login.html";
    return;
  }

  const isAdmin = user.role?.toLowerCase() === "admin";
  window.IS_ADMIN = isAdmin;

  // Show admin UI elements
  document.querySelectorAll(".admin-only").forEach(el => {
    if (isAdmin) el.style.display = "block";
    else el.remove();
  });

  const courseId = new URLSearchParams(window.location.search).get("id");
  if (!courseId) return alert("No course ID provided");

  try {
    const res = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Course not found");
    currentCourseData = await res.json();
    renderCourse(currentCourseData);
  } catch (err) {
    console.error(err);
    document.getElementById("main-content").innerHTML = `<h2>Error: ${err.message}</h2>`;
  }

  // Initialize editor for admin
  if (isAdmin) {
    initEditor();
    setupAdminListeners();
  }
});

// ✅ ADMIN CHECK
function isAdminUser() {
  return window.IS_ADMIN;
}

// ✅ EDIT MODE CHECK
function isEditMode() {
  return document.getElementById("edit-mode-toggle")?.checked;
}

// ✅ RENDER COURSE
function renderCourse(course) {
  const nav = document.getElementById("topics-nav");
  const main = document.getElementById("main-content");

  nav.innerHTML = "";
  main.innerHTML = "";

  course.content.forEach((section, sIdx) => {
    // STUDENT: skip hidden sections
    if (!isAdminUser() && section.hidden) return;

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "topic-section";
    if (section.hidden) sectionDiv.classList.add("hidden-section");

    const header = document.createElement("div");
    header.className = "topic-section-header";

    const title = document.createElement("span");
    title.className = "topic-section-title";
    title.innerText = section.title;
    header.appendChild(title);

    // ADMIN: Hide/Show button (edit mode only)
    if (isAdminUser()) {
      const btn = document.createElement("button");
      btn.className = "admin-toggle-btn";
      btn.innerText = section.hidden ? "Show" : "Hide";
      btn.style.display = isEditMode() ? "inline-block" : "none";

      btn.onclick = (e) => {
        e.stopPropagation();
        section.hidden = !section.hidden; // Save state
        hasUnsavedChanges = true;
        renderCourse(currentCourseData);
      };

      header.appendChild(btn);
    }

    // Toggle open
    header.onclick = (e) => {
      if (e.target.tagName === "BUTTON") return;
      sectionDiv.classList.toggle("open");
    };

    const ul = document.createElement("ul");
    ul.className = "topic-articles-list";

    section.articles.forEach((article, aIdx) => {
      // STUDENT: skip hidden topics
      if (!isAdminUser() && article.hidden) return;

      const li = document.createElement("li");

      const link = document.createElement("a");
      link.href = `#${article.id}`;
      link.innerText = article.title;

      link.onclick = (e) => {
        e.preventDefault();
        document.querySelectorAll(".topics-nav a").forEach(l => l.classList.remove("active"));
        link.classList.add("active");
        const target = document.getElementById(article.id);
        if (target) target.scrollIntoView({ behavior: "smooth" });
      };

      li.appendChild(link);
      ul.appendChild(li);

      const contentArticle = document.createElement("article");
      contentArticle.id = article.id;
      contentArticle.innerHTML = `
        <h2 data-section-idx="${sIdx}" data-article-idx="${aIdx}" data-type="title">
          ${article.title}
        </h2>
        <div class="content-body"
          data-section-idx="${sIdx}"
          data-article-idx="${aIdx}"
          data-type="html">
          ${article.html}
        </div>
      `;

      main.appendChild(contentArticle);
    });

    sectionDiv.appendChild(header);
    sectionDiv.appendChild(ul);
    nav.appendChild(sectionDiv);
  });

  // Enable edit mode if active
  if (isEditMode() && isAdminUser()) enableEditMode();
}

// ✅ INIT QUILL
function initEditor() {
  quillEditor = new Quill("#quill-editor", { theme: "snow" });
}

// ✅ ADMIN LISTENERS
function setupAdminListeners() {
  const toggle = document.getElementById("edit-mode-toggle");

  toggle?.addEventListener("change", () => {
    renderCourse(currentCourseData); // Refresh UI
    if (toggle.checked) enableEditMode();
    else disableEditMode();
  });

  document.getElementById("save-course-content").onclick = saveToDatabase;

  // Add Section
  const addSectionBtn = document.getElementById("add-section-btn");
  addSectionBtn?.addEventListener("click", async () => {
    const title = prompt("Enter Section Title (e.g., Introduction, Basics)");
    if (!title) return;

    currentCourseData.content.push({
      title: title,
      hidden: false,
      articles: []
    });

    hasUnsavedChanges = true;
    renderCourse(currentCourseData);
  });
}

// ✅ ENABLE EDIT
function enableEditMode() {
  document.querySelectorAll("#main-content h2, .content-body").forEach(el => {
    el.classList.add("editable-element");
    el.onclick = openEditor;
  });

  // Show all admin hide/show buttons
  document.querySelectorAll(".admin-toggle-btn").forEach(btn => btn.style.display = "inline-block");

  // Add Topic buttons for each section
  document.querySelectorAll('.topic-section').forEach((section, sIdx) => {
    if (!section.querySelector('.add-topic-btn-section')) {
      const btn = document.createElement('button');
      btn.className = 'add-topic-btn-section';
      btn.innerText = '+ Add Topic';
      btn.style.marginTop = '8px';
      btn.onclick = async (e) => {
        e.stopPropagation();
        const topicTitle = prompt("Enter Topic Title");
        if (!topicTitle) return;

        const id = "topic-" + Date.now();

        currentCourseData.content[sIdx].articles.push({
          id: id,
          title: topicTitle,
          html: "",
          hidden: false
        });

        hasUnsavedChanges = true;
        renderCourse(currentCourseData);
      };

      section.appendChild(btn);
    }
  });
}

// ✅ DISABLE EDIT
function disableEditMode() {
  document.querySelectorAll(".editable-element").forEach(el => {
    el.classList.remove("editable-element");
    el.onclick = null;
  });

  // Hide admin buttons
  document.querySelectorAll(".admin-toggle-btn, .add-topic-btn-section").forEach(btn => btn.style.display = "none");
}

// ✅ OPEN EDITOR
function openEditor(e) {
  if (!isAdminUser()) return;

  e.stopPropagation();
  currentElementBeingEdited = e.currentTarget;
  quillEditor.root.innerHTML = currentElementBeingEdited.innerHTML;
  document.getElementById("editor-modal").classList.add("open");
}

// ✅ SAVE EDIT
window.saveContent = function () {
  if (!currentElementBeingEdited) return;

  const content = quillEditor.root.innerHTML;
  const sIdx = currentElementBeingEdited.dataset.sectionIdx;
  const aIdx = currentElementBeingEdited.dataset.articleIdx;
  const type = currentElementBeingEdited.dataset.type;

  if (type === "title") {
    currentCourseData.content[sIdx].articles[aIdx].title = quillEditor.getText().trim();
  } else {
    currentCourseData.content[sIdx].articles[aIdx].html = content;
  }

  hasUnsavedChanges = true;
  renderCourse(currentCourseData);
  closeEditor();
};

// ✅ CLOSE EDITOR
window.closeEditor = function () {
  document.getElementById("editor-modal").classList.remove("open");
};

// ✅ SAVE TO DATABASE
async function saveToDatabase() {
  try {
    const res = await fetch(`${API_BASE_URL}/courses/${currentCourseData.id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(currentCourseData)
    });

    if (res.ok) {
      hasUnsavedChanges = false;
      alert("Saved ✅");
    } else {
      throw new Error("Save failed");
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
};