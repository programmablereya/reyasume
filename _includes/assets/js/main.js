(function(window, document) {
  function findClosestParentMatching(child, selector) {
    if (!child) {
      return null;
    } else if (child.matches(selector)) {
      return child;
    } else {
      return findClosestParentMatching(child.parentElement, selector);
    }
  }

  function showAll(button) {
    parent = findClosestParentMatching(button, ".highlight-container");
    if (!parent) {
      return;
    }

    parent.classList.add("showing-all");
  }

  function showHighlights(button) {
    parent = findClosestParentMatching(button, ".highlight-container");
    if (!parent) {
      return;
    }

    parent.classList.remove("showing-all");
  }

  function print() {
    window.print();
  }

  document.addEventListener("click", function(event) {
    if (event.target.matches(".show-all, .show-all *")) {
      showAll(event.target);
    } else if (event.target.matches(".show-highlights, .show-highlights *")) {
      showHighlights(event.target);
    } else if (event.target.matches("#print, #print *")) {
      print();
    }
  });
})(window, document);
