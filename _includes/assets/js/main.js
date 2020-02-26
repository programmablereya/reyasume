(function(window, document) {
  function showAll(button) {
    document.getElementById('highlight-container').classList.add("showing-all");
  }

  function showHighlights(button) {
    document.getElementById('highlight-container').classList.remove("showing-all");
  }

  function showImageCredits() {
    document.getElementById('image-credits').classList.add("showing-all");
  }

  function print() {
    window.print();
  }

  document.addEventListener("click", function(event) {
    if (event.target.matches(".show-all, .show-all *, .highlight-icon, .highlight-icon *")) {
      showAll(event.target);
    } else if (event.target.matches(".show-highlights, .show-highlights *")) {
      showHighlights(event.target);
    } else if (event.target.matches("#image-credits-toggle, #image-credits-toggle *")) {
      showImageCredits();
    } else if (event.target.matches("#print, #print *")) {
      print();
    }
  });
})(window, document);
