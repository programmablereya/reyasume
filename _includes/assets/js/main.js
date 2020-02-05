(function(window, document) {
  function showAll(button) {
    parent = document.getElementById('highlight-container');
    parent.classList.add("showing-all");
  }

  function showHighlights(button) {
    parent = document.getElementById('highlight-container');
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
