/* Plinth, a Plotform studio edition. Vanilla JavaScript, no dependencies. */
(() => {
  // Mobile navigation: a native dialog, so Escape and focus handling come free.
  const menu = document.getElementById("menu");
  const menuToggle = document.querySelector(".menu-toggle");
  if (menu && menuToggle) {
    menuToggle.addEventListener("click", () => menu.showModal());
    const close = menu.querySelector(".menu-close");
    if (close) close.addEventListener("click", () => menu.close());
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => menu.close()));
  }

  // Programme: filter by state, and switch between the list and the grid.
  const programme = document.querySelector(".programme");
  if (programme) {
    const entries = Array.from(programme.querySelectorAll(".entry"));
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
    const viewButtons = Array.from(document.querySelectorAll("[data-view-mode]"));
    const count = document.getElementById("programme-count");

    const applyFilter = (value, label) => {
      let shown = 0;
      entries.forEach((entry) => {
        const match = value === "all" || entry.dataset.state === value;
        entry.hidden = !match;
        if (match) shown += 1;
      });
      programme.dataset.filter = value;
      filterButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.filter === value));
      });
      if (count) {
        const of = shown === entries.length ? "" : " of " + entries.length;
        count.textContent = "Showing " + shown + of + " " + (shown === 1 ? "entry" : "entries") + ", " + label.toLowerCase();
      }
    };

    filterButtons.forEach((button, i) => {
      button.addEventListener("click", () => applyFilter(button.dataset.filter, button.textContent.trim()));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : filterButtons.length - 1;
        const next = filterButtons[(i + step) % filterButtons.length];
        next.focus();
        applyFilter(next.dataset.filter, next.textContent.trim());
      });
    });

    const applyView = (value) => {
      programme.dataset.view = value;
      viewButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.viewMode === value));
      });
    };
    viewButtons.forEach((button) => {
      button.addEventListener("click", () => applyView(button.dataset.viewMode));
    });

    const startingFilter = filterButtons.find((b) => b.getAttribute("aria-pressed") === "true");
    if (startingFilter) applyFilter(startingFilter.dataset.filter, startingFilter.textContent.trim());
    const startingView = viewButtons.find((b) => b.getAttribute("aria-pressed") === "true");
    if (startingView) applyView(startingView.dataset.viewMode);
  }
})();
