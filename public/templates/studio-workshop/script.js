/* Fettle, a Plotform studio edition.

   Two small things, and nothing else. No framework, no drawing, no network.

   1. The programme filter. Two groups of buttons, level and evening, that
      narrow the fourteen sessions and keep a live count of what is showing and
      how many benches are left free. Both groups answer the arrow keys as well
      as the mouse, and each button carries aria-pressed so a screen reader
      hears the state rather than seeing the colour.

   2. The mobile navigation dialog.

   Nothing here draws anything. Every hand drawn graphic on this site was
   written to a static SVG file at build time by tools/make-art.mjs and
   tools/make-people.mjs, so the strokes are identical on every render. */

(function () {
  "use strict";

  /* ---------------------------------------------------------------- */
  /* The programme filter                                             */
  /* ---------------------------------------------------------------- */
  var programme = document.querySelector(".programme");
  var count = document.getElementById("programme-count");

  if (programme && count) {
    var sessions = Array.prototype.slice.call(programme.querySelectorAll(".session"));
    var empty = document.getElementById("programme-empty");
    var groups = Array.prototype.slice.call(document.querySelectorAll(".chips[data-filter]"));
    var state = { level: "all", day: "all" };

    var LEVEL_WORDS = {
      all: "any level",
      first: "first time",
      improver: "improver",
      open: "open bench",
    };

    function dayWords(id) {
      if (id === "all") return "any day";
      return "on " + id.charAt(0).toUpperCase() + id.slice(1);
    }

    function apply() {
      var shown = 0;
      var free = 0;
      sessions.forEach(function (session) {
        var matches =
          (state.level === "all" || session.getAttribute("data-level") === state.level) &&
          (state.day === "all" || session.getAttribute("data-day") === state.day);
        if (matches) {
          session.removeAttribute("hidden");
          shown += 1;
          free += Number(session.getAttribute("data-free")) || 0;
        } else {
          session.setAttribute("hidden", "");
        }
      });

      var where = LEVEL_WORDS[state.level] + ", " + dayWords(state.day);
      if (shown === 0) {
        count.textContent = "No sessions match, " + where + ".";
        if (empty) empty.removeAttribute("hidden");
      } else {
        var head =
          shown === sessions.length
            ? "Showing all " + sessions.length + " sessions"
            : "Showing " + shown + " of " + sessions.length + " sessions";
        count.textContent =
          head + ", " + where + ". " + free + (free === 1 ? " bench free." : " benches free.");
        if (empty) empty.setAttribute("hidden", "");
      }
    }

    groups.forEach(function (group) {
      var name = group.getAttribute("data-filter");
      var buttons = Array.prototype.slice.call(group.querySelectorAll(".chip"));

      function select(button) {
        buttons.forEach(function (other) {
          other.setAttribute("aria-pressed", other === button ? "true" : "false");
        });
        state[name] = button.getAttribute("data-" + name);
        apply();
      }

      group.addEventListener("click", function (event) {
        var button = event.target.closest(".chip");
        if (button && buttons.indexOf(button) !== -1) select(button);
      });

      /* Left and right walk the group, Home and End jump to its ends. The
         moved-to button is selected as well as focused, which is what the
         pattern for a single choice group asks for. */
      group.addEventListener("keydown", function (event) {
        var current = buttons.indexOf(document.activeElement);
        if (current === -1) return;
        var next = -1;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        if (next === -1) return;
        event.preventDefault();
        buttons[next].focus();
        select(buttons[next]);
      });
    });

    apply();
  }

  /* ---------------------------------------------------------------- */
  /* The mobile navigation dialog                                     */
  /* ---------------------------------------------------------------- */
  var menu = document.getElementById("menu");
  var open = document.querySelector(".menu-toggle");
  var close = document.querySelector(".menu-close");

  if (menu && open && typeof menu.showModal === "function") {
    open.addEventListener("click", function () {
      menu.showModal();
    });
    if (close) {
      close.addEventListener("click", function () {
        menu.close();
      });
    }
    menu.addEventListener("click", function (event) {
      if (event.target === menu) menu.close();
    });
  } else if (open) {
    open.hidden = true;
  }
})();
