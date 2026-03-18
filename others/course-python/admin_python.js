// Global variables
var quillEditor;
var currentElementBeingEdited = null;
var editCheck = document.getElementById("edit-mode-toggle");
var searchInput = document.querySelector(".course-search-input");
var allTopicSections = document.querySelectorAll(".topic-section");

// Initialize the editor when the page loads
window.onload = function () {
  // Setting up Quill editor
  quillEditor = new Quill("#quill-editor", {
    theme: "snow",
    placeholder: "Type something here...",
    modules: {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ header: [1, 2, 3, false] }],
        ["link"],
        ["clean"],
      ],
    },
  });

  // Add event listener for edit mode toggle
  if (editCheck) {
      editCheck.addEventListener("change", function () {
        // Get all elements we might want to edit
        var elementsToEdit = document.querySelectorAll(
          ".course-content h2, .course-content h3, .course-content h4, .course-content p, .course-content li, .course-content .intro-text, .topics-sidebar h4, .topics-sidebar a, .course-content .code-block, .course-content .content-card"
        );
    
        if (editCheck.checked == true) {
          // Edit mode is ON
          for (var i = 0; i < elementsToEdit.length; i++) {
            elementsToEdit[i].classList.add("editable-element");
            elementsToEdit[i].onclick = openTheEditor; // Simple click handler
          }
          showInsertionPoints(true);
          showMoveButtons(true);
        } else {
          // Edit mode is OFF
          for (var i = 0; i < elementsToEdit.length; i++) {
            elementsToEdit[i].classList.remove("editable-element");
            elementsToEdit[i].onclick = null; // Remove handler
          }
          showInsertionPoints(false);
          showMoveButtons(false);
        }
      });
  }
};

// Function to handle opening the editor
function openTheEditor(event) {
  if (editCheck.checked == false) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  // Save which element we are clicking
  currentElementBeingEdited = event.currentTarget;

  // Reset the modal for editing
  document.getElementById("modal-title").innerText = "Edit Content";
  document.getElementById("topic-input-container").classList.add("hidden");
  document.getElementById("modal-save-btn").innerText = "Save Changes";

  // Put the content of the element into the editor
  quillEditor.root.innerHTML = currentElementBeingEdited.innerHTML;

  // Show the modal
  document.getElementById("editor-modal").classList.add("open");
}

// Variable to know if we are adding new stuff
var addingNewBlock = false;
var referenceNodeForInsert = null;

// Function to open modal for adding new content
function openAddModal(refNode) {
  // If we are passing a node to insert before, use it
  referenceNodeForInsert = refNode;
  addingNewBlock = true;
  currentElementBeingEdited = null;

  document.getElementById("modal-title").innerText =
    "Add New Content Block";
  document.getElementById("topic-input-container").classList.remove(
    "hidden",
  );
  document.getElementById("modal-save-btn").innerText = "Add Block";
  document.getElementById("modal-topic-heading").value = "";

  // clear editor
  quillEditor.root.innerHTML = "";

  document.getElementById("editor-modal").classList.add("open");
}

// Close the editor modal
function closeEditor() {
  document.getElementById("editor-modal").classList.remove("open");
  currentElementBeingEdited = null;
}

// Save changes function
function saveContent() {
  if (addingNewBlock == true) {
    // Logic for adding new block
    var heading = document.getElementById("modal-topic-heading").value;
    if (heading == "") {
      heading = "New Topic";
    }
    var content = quillEditor.root.innerHTML;
    var newId = "extra-topic-" + Date.now();

    // Create the HTML for the new section
    var mainContainer = document.querySelector(".course-content");
    var newArticle = document.createElement("article");
    newArticle.className = "content-section";
    newArticle.id = newId;

    var innerHTML =
      '<h2 class="editable-element" onclick="openTheEditor(event)">' +
      heading +
      "</h2>";
    innerHTML +=
      '<div class="editable-element" onclick="openTheEditor(event)">' +
      content +
      "</div>";
    newArticle.innerHTML = innerHTML;

    // Insert into the page
    if (referenceNodeForInsert) {
      mainContainer.insertBefore(newArticle, referenceNodeForInsert);
      // Add a plus button after it
      addPlusButton(mainContainer, newArticle.nextSibling);
    } else {
      // Just add to end
      var addBtn = document.querySelector(".add-content-block-btn");
      mainContainer.insertBefore(newArticle, addBtn);
      // Add plus button if in edit mode
      if (editCheck.checked) {
        addPlusButton(mainContainer, newArticle);
      }
    }

    // Also add to sidebar
    var sidebarList = document.querySelector(
      ".topics-nav .topic-section:last-of-type ul",
    );
    if (sidebarList) {
      var newLi = document.createElement("li");
      newLi.innerHTML =
        '<a href="#' +
        newId +
        '" class="editable-element" onclick="openTheEditor(event)">' +
        heading +
        "</a>";
      sidebarList.appendChild(newLi);
    }

    showMessage("Block added successfully!");
    addingNewBlock = false; // reset
  } else {
    // Logic for updating existing block
    if (currentElementBeingEdited != null) {
      currentElementBeingEdited.innerHTML = quillEditor.root.innerHTML;
      showMessage("Content updated!");
    }
  }
  closeEditor();
}

// Function to show toast message
function showMessage(msg) {
  var div = document.createElement("div");
  div.className = "success-toast";
  div.innerText = msg;
  document.body.appendChild(div);

  // Simple timeout to show/hide
  setTimeout(function () {
    div.classList.add("show");
  }, 10);

  setTimeout(function () {
    div.classList.remove("show");
    setTimeout(function () {
      document.body.removeChild(div);
    }, 300);
  }, 2000);
}

// Add Topic Button Logic
function addTopic(btnElement) {
  var list = btnElement.previousElementSibling;
  var uniqueId = "topic-" + Date.now();
  var newItem = document.createElement("li");

  newItem.innerHTML =
    '<a href="#' +
    uniqueId +
    '" class="editable-element" onclick="openTheEditor(event)">New Topic</a>';
  list.appendChild(newItem);

  // Add the article in the main content
  var mainContent = document.querySelector(".course-content");
  var newArticle = document.createElement("article");
  newArticle.className = "content-section";
  newArticle.id = uniqueId;

  newArticle.innerHTML =
    '<h2 class="editable-element" onclick="openTheEditor(event)">New Topic Heading</h2>' +
    '<p class="editable-element" onclick="openTheEditor(event)">Click to edit this content.</p>';

  mainContent.appendChild(newArticle);

  showMessage("Topic and section added!");
}

// Search Logic
if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      var term = e.target.value.toLowerCase().trim();
    
      for (var i = 0; i < allTopicSections.length; i++) {
        var section = allTopicSections[i];
        var h4 = section.querySelector("h4");
        var hasMatch = false;
    
        if (h4 && h4.innerText.toLowerCase().includes(term)) {
          hasMatch = true;
        }
    
        var links = section.querySelectorAll("li");
        for (var j = 0; j < links.length; j++) {
          var linkText = links[j].innerText.toLowerCase();
          if (linkText.includes(term)) {
            links[j].classList.remove("hidden");
            hasMatch = true;
          } else {
            links[j].classList.add("hidden");
          }
        }
    
        if (hasMatch) {
          section.classList.remove("hidden");
        } else {
          section.classList.add("hidden");
        }
      }
    });
}

// Show/Hide Insertion Points (The plus buttons)
function showInsertionPoints(show) {
  if (show) {
    var mainContent = document.querySelector(".course-content");
    var children = mainContent.children;

    if (children.length > 0) {
      addPlusButton(mainContent, children[0]);
    }

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (
        child.classList.contains("add-content-block-btn") ||
        child.classList.contains("insertion-point")
      ) {
        continue;
      }
      addPlusButton(mainContent, child.nextSibling);
    }
  } else {
    var points = document.querySelectorAll(".insertion-point");
    for (var i = 0; i < points.length; i++) {
      points[i].remove();
    }
  }
}

// Helper to add the plus button
function addPlusButton(parent, beforeNode) {
  var div = document.createElement("div");
  div.className = "insertion-point";
  div.innerHTML =
    '<div class="insertion-point-btn">+</div><div class="insertion-label">Insert Content Here</div>';

  div.onclick = function (e) {
    e.stopPropagation();
    openAddModal(beforeNode);
  };

  parent.insertBefore(div, beforeNode);
}

// Show/Hide Move Buttons (Up/Down arrows)
function showMoveButtons(show) {
  var candidates = document.querySelectorAll(
    ".editable-element, .content-section, .topic-section",
  );

  if (show) {
    for (var i = 0; i < candidates.length; i++) {
      // check if it already has controls
      if (candidates[i].querySelector(".move-controls")) continue;

      var div = document.createElement("div");
      div.className = "move-controls";
      // Simple SVG buttons
      div.innerHTML =
        '<button class="move-btn" onclick="moveItem(event, \'up\')">UP</button>' +
        '<button class="move-btn" onclick="moveItem(event, \'down\')">DOWN</button>';
      // Let's replace text with SVG to match original look but keep code simple
      div.innerHTML = `
            <button class="move-btn" onclick="moveItem(event, 'up')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </button>
            <button class="move-btn" onclick="moveItem(event, 'down')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
         `;
      candidates[i].appendChild(div);
    }
  } else {
    var controls = document.querySelectorAll(".move-controls");
    for (var i = 0; i < controls.length; i++) {
      controls[i].remove();
    }
  }
}

// Function to move items
function moveItem(e, direction) {
  e.stopPropagation();
  var btn = e.currentTarget;
  var controlsDiv = btn.parentElement;
  var itemToMove = controlsDiv.parentElement;
  var parent = itemToMove.parentElement;

  if (direction == "up") {
    var prev = itemToMove.previousElementSibling;
    // loop to skip our insertion points
    while (
      prev &&
      (prev.classList.contains("insertion-point") ||
        prev.classList.contains("move-controls"))
    ) {
      prev = prev.previousElementSibling;
    }
    if (prev) {
      showInsertionPoints(false); // easy way: hide points
      parent.insertBefore(itemToMove, prev); // move
      showInsertionPoints(true); // show points again (re-calculates positions)
      showMoveButtons(true); // make sure buttons are there
    }
  } else if (direction == "down") {
    var next = itemToMove.nextElementSibling;
    while (
      next &&
      (next.classList.contains("insertion-point") ||
        next.classList.contains("move-controls"))
    ) {
      next = next.nextElementSibling;
    }
    if (next) {
      showInsertionPoints(false);
      parent.insertBefore(next, itemToMove);
      showInsertionPoints(true);
      showMoveButtons(true);
    }
  }
}

// Close modal on click outside
document
  .getElementById("editor-modal")
  .addEventListener("click", function (e) {
    if (e.target == this) {
      closeEditor();
    }
  });