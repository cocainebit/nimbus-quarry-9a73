/* Quire, a Plotform studio edition.
   Two behaviours, both plain DOM and both keyboard operable:
   1. Reading state (day or night, and the size of the type) kept in localStorage
      so it survives navigation between pages. The architecture follows AstroPaper's
      persisted data-theme switch, rewritten here for two axes instead of one.
   2. The index filter on the front page.
   A small contents dialog stands in for the navigation on narrow screens. */

(function () {
  "use strict";

  var MODE_KEY = "quire-reading-mode";
  var SIZE_KEY = "quire-type-size";
  var SIZES = ["small", "regular", "large"];
  var SIZE_NAMES = { small: "small", regular: "regular", large: "large" };
  var root = document.documentElement;

  function store(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* Private windows and blocked storage are fine: the page still works. */
    }
  }

  var mode = root.getAttribute("data-reading-mode") === "night" ? "night" : "day";
  var size = root.getAttribute("data-type-size");
  if (SIZES.indexOf(size) === -1) size = "regular";

  var status = document.getElementById("reading-status");

  function render(announce) {
    root.setAttribute("data-reading-mode", mode);
    root.setAttribute("data-type-size", size);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        window.getComputedStyle(document.body).backgroundColor,
      );
    }

    var toggles = document.querySelectorAll("[data-mode-toggle]");
    for (var i = 0; i < toggles.length; i += 1) {
      var button = toggles[i];
      var pressed = mode === "night";
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
      var label = button.getAttribute(
        pressed ? "data-label-on" : "data-label-off",
      );
      if (label) button.textContent = label;
    }

    var sizeButtons = document.querySelectorAll("[data-size]");
    for (var j = 0; j < sizeButtons.length; j += 1) {
      sizeButtons[j].setAttribute(
        "aria-pressed",
        sizeButtons[j].getAttribute("data-size") === size ? "true" : "false",
      );
    }

    if (status && announce) {
      status.textContent =
        "Reading in " +
        (mode === "night" ? "night" : "day") +
        " mode, type set " +
        SIZE_NAMES[size] +
        ".";
    }
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var toggle = target.closest("[data-mode-toggle]");
    if (toggle) {
      mode = mode === "night" ? "day" : "night";
      store(MODE_KEY, mode);
      render(true);
      return;
    }

    var sizeButton = target.closest("[data-size]");
    if (sizeButton) {
      var next = sizeButton.getAttribute("data-size");
      if (SIZES.indexOf(next) === -1) return;
      size = next;
      store(SIZE_KEY, size);
      render(true);
    }
  });

  render(false);

  /* ---- The index filter ---- */

  var filter = document.querySelector("[data-filter]");
  if (filter) {
    var items = Array.prototype.slice.call(
      document.querySelectorAll("[data-issue]"),
    );
    var count = document.getElementById("index-status");

    var apply = function (value) {
      var shown = 0;
      items.forEach(function (item) {
        var match = value === "all" || item.getAttribute("data-issue") === value;
        item.hidden = !match;
        if (match) shown += 1;
      });
      var buttons = filter.querySelectorAll("[data-filter-value]");
      for (var k = 0; k < buttons.length; k += 1) {
        buttons[k].setAttribute(
          "aria-pressed",
          buttons[k].getAttribute("data-filter-value") === value
            ? "true"
            : "false",
        );
      }
      if (count) {
        count.textContent =
          shown === 1
            ? "Showing one piece"
            : "Showing " + shown + " pieces" + (value === "all" ? ", every issue" : "");
      }
    };

    filter.addEventListener("click", function (event) {
      var button = event.target.closest
        ? event.target.closest("[data-filter-value]")
        : null;
      if (!button) return;
      apply(button.getAttribute("data-filter-value"));
    });

    apply("all");
  }

  /* ---- Contents dialog for narrow screens ---- */

  var dialog = document.getElementById("contents-menu");
  if (dialog && typeof dialog.showModal === "function") {
    var opener = document.querySelector("[data-menu-open]");
    if (opener) {
      opener.addEventListener("click", function () {
        dialog.showModal();
      });
    }
    var closer = dialog.querySelector("[data-menu-close]");
    if (closer) {
      closer.addEventListener("click", function () {
        dialog.close();
      });
    }
  }
})();
