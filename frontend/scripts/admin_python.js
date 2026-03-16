// GLOBAL VARIABLES
var quillEditor;
var currentElementBeingEdited = null;
var addingNewBlock = false;
var referenceNodeForInsert = null;

var editCheck;
var searchInput;
var allTopicSections;

// INIT
window.onload = function () {
  editCheck = document.getElementById("edit-mode-toggle");
  searchInput = document.querySelector(".course-search-input");
  allTopicSections = document.querySelectorAll(".topic-section");

  // QUILL EDITOR
  quillEditor = new Quill("#quill-editor", {
    theme: "snow",
    placeholder: "Type something here...",
    modules: {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ header: [1, 2, 3, false] }],
        ["link", "image"],
        ["clean"],
      ],
    },
  });

  // IMAGE UPLOAD
  var toolbar = quillEditor.getModule("toolbar");

  toolbar.addHandler("image", function () {
    selectLocalImage();
  });

  function selectLocalImage() {
    var input = document.createElement("input");

    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");

    input.click();

    input.onchange = function () {
      var file = input.files[0];
      if (!file) return;

      var reader = new FileReader();

      reader.onload = function (e) {
        var range = quillEditor.getSelection(true);

        quillEditor.insertEmbed(range.index, "image", e.target.result);

        quillEditor.setSelection(range.index + 1);
      };

      reader.readAsDataURL(file);
    };
  }

  // EDIT MODE TOGGLE
  if (editCheck) {
    editCheck.addEventListener("change", function () {
      var elementsToEdit = document.querySelectorAll(
        ".course-content h2, .course-content h3, .course-content h4, .course-content p, .course-content li, .course-content .intro-text, .topics-sidebar h4, .topics-sidebar a, .course-content .code-block, .course-content .content-card",
      );

      if (editCheck.checked) {
        elementsToEdit.forEach(function (el) {
          el.classList.add("editable-element");

          el.onclick = openTheEditor;
        });

        showInsertionPoints(true);
        showMoveButtons(true);
      } else {
        elementsToEdit.forEach(function (el) {
          el.classList.remove("editable-element");

          el.onclick = null;
        });

        showInsertionPoints(false);
        showMoveButtons(false);
      }
    });
  }

  // SIDEBAR EXPAND / COLLAPSE
  document.querySelectorAll(".topic-section h4").forEach(function (heading) {
    heading.addEventListener("click", function () {
      var parent = this.parentElement;

      parent.classList.toggle("closed");
    });
  });

  // SEARCH TOPICS
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      var term = e.target.value.toLowerCase().trim();

      var topicSections = document.querySelectorAll(".topic-section");

      topicSections.forEach(function (section) {
        var links = section.querySelectorAll("li");

        var sectionMatch = false;

        links.forEach(function (li) {
          var text = li.innerText.toLowerCase();

          if (text.includes(term)) {
            li.style.display = "block";
            sectionMatch = true;
          } else {
            li.style.display = "none";
          }
        });

        if (sectionMatch || term === "") {
          section.style.display = "block";
        } else {
          section.style.display = "none";
        }
      });
    });
  }
};

// OPEN EDITOR
function openTheEditor(event) {
  if (!editCheck.checked) return;

  event.preventDefault();
  event.stopPropagation();

  currentElementBeingEdited = event.currentTarget;

  document.getElementById("modal-title").innerText = "Edit Content";

  document.getElementById("topic-input-container").classList.add("hidden");

  document.getElementById("modal-save-btn").innerText = "Save Changes";

  quillEditor.root.innerHTML = currentElementBeingEdited.innerHTML;

  document.getElementById("editor-modal").classList.add("open");
}

// ADD BLOCK MODAL
function openAddModal(refNode) {
  referenceNodeForInsert = refNode;

  addingNewBlock = true;

  currentElementBeingEdited = null;

  document.getElementById("modal-title").innerText = "Add New Content Block";

  document.getElementById("topic-input-container").classList.remove("hidden");

  document.getElementById("modal-save-btn").innerText = "Add Block";

  document.getElementById("modal-topic-heading").value = "";

  quillEditor.root.innerHTML = "";

  document.getElementById("editor-modal").classList.add("open");
}

// CLOSE EDITOR
function closeEditor() {
  document.getElementById("editor-modal").classList.remove("open");

  currentElementBeingEdited = null;

  addingNewBlock = false;
}

// SAVE CONTENT
function saveContent() {
  if (addingNewBlock) {
    var heading = document.getElementById("modal-topic-heading").value;

    if (heading == "") heading = "New Topic";

    var content = quillEditor.root.innerHTML;

    var newId = "extra-topic-" + Date.now();

    var mainContainer = document.querySelector(".course-content");

    var newArticle = document.createElement("article");

    newArticle.className = "content-section";

    newArticle.id = newId;

    newArticle.innerHTML =
      '<h2 class="editable-element" onclick="openTheEditor(event)">' +
      heading +
      "</h2>" +
      '<div class="editable-element" onclick="openTheEditor(event)">' +
      content +
      "</div>";

    if (referenceNodeForInsert) {
      mainContainer.insertBefore(newArticle, referenceNodeForInsert);
    } else {
      mainContainer.appendChild(newArticle);
    }

    showMessage("Block added successfully!");
  } else if (currentElementBeingEdited != null) {
    currentElementBeingEdited.innerHTML = quillEditor.root.innerHTML;

    showMessage("Content updated!");
  }

  closeEditor();
}

// TOAST MESSAGE
function showMessage(msg) {
  var div = document.createElement("div");

  div.className = "success-toast";

  div.innerText = msg;

  document.body.appendChild(div);

  setTimeout(function () {
    div.classList.add("show");
  }, 10);

  setTimeout(function () {
    div.classList.remove("show");

    setTimeout(function () {
      if (div.parentNode) {
        document.body.removeChild(div);
      }
    }, 300);
  }, 2000);
}

// INSERTION POINTS
function showInsertionPoints(show) {
  document.querySelectorAll(".insertion-point").forEach(function (p) {
    p.remove();
  });

  if (!show) return;

  var mainContent = document.querySelector(".course-content");

  var children = mainContent.querySelectorAll(".content-section");

  children.forEach(function (child) {
    addPlusButton(mainContent, child.nextSibling);
  });
}

function addPlusButton(parent, beforeNode) {
  var div = document.createElement("div");

  div.className = "insertion-point";

  div.innerHTML =
    '<div class="insertion-point-btn">+</div>' +
    '<div class="insertion-label">Insert Content Here</div>';

  div.onclick = function (e) {
    e.stopPropagation();

    openAddModal(beforeNode);
  };

  parent.insertBefore(div, beforeNode);
}

// MOVE BUTTONS
function showMoveButtons(show) {
  document.querySelectorAll(".move-controls").forEach(function (c) {
    c.remove();
  });

  if (!show) return;

  var candidates = document.querySelectorAll(".content-section");

  candidates.forEach(function (item) {
    var div = document.createElement("div");

    div.className = "move-controls";

    div.innerHTML = `
        <button class="move-btn" onclick="moveItem(event,'up')">▲</button>
        <button class="move-btn" onclick="moveItem(event,'down')">▼</button>
      `;

    item.appendChild(div);
  });
}

function moveItem(e, direction) {
  e.stopPropagation();

  var item = e.currentTarget.closest(".content-section");

  var parent = item.parentElement;

  if (direction === "up") {
    var prev = item.previousElementSibling;

    if (prev && prev.classList.contains("content-section")) {
      parent.insertBefore(item, prev);
    }
  } else {
    var next = item.nextElementSibling;

    if (next) {
      parent.insertBefore(next, item);
    }
  }
}

// CLOSE MODAL WHEN CLICK OUTSIDE
document.addEventListener("DOMContentLoaded", function () {
  var modal = document.getElementById("editor-modal");

  if (!modal) return;

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeEditor();
    }
  });
});
