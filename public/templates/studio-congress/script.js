/* Plenum, a Plotform studio edition. Vanilla JavaScript, no dependencies.
   Two things happen here: the mobile navigation dialog, and the programme, which
   switches days and filters the grid by track. Both leave their state in the
   markup (aria-selected, aria-pressed, hidden, data-track) so the page is
   readable without watching the script run. */
(() => {
  // Mobile navigation. A native dialog, so Escape and focus handling come free.
  const menu = document.getElementById("menu");
  const menuToggle = document.querySelector(".menu-toggle");
  if (menu && menuToggle) {
    menuToggle.addEventListener("click", () => menu.showModal());
    const close = menu.querySelector(".menu-close");
    if (close) close.addEventListener("click", () => menu.close());
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => menu.close()));
  }

  const programme = document.querySelector(".programme");
  if (!programme) return;

  const tabs = Array.from(programme.querySelectorAll('[role="tab"]'));
  const panels = Array.from(programme.querySelectorAll('[role="tabpanel"]'));
  const filters = Array.from(programme.querySelectorAll("[data-filter]"));
  const status = document.getElementById("programme-status");

  const trackLabel = (value) => {
    if (value === "all") return "all tracks";
    const button = filters.find((f) => f.dataset.filter === value);
    return button ? button.textContent.trim() : value;
  };

  const currentPanel = () => panels.find((panel) => !panel.hidden) || panels[0];

  function render() {
    const track = programme.dataset.track || "all";
    const panel = currentPanel();
    if (!panel) return;

    let shown = 0;
    let total = 0;
    panel.querySelectorAll(".session").forEach((session) => {
      const isBreak = session.dataset.track === "break";
      if (!isBreak) total += 1;
      // Breaks belong to the shape of the day, so they stay put while a track
      // is filtered; only real sessions are hidden and counted.
      const match = isBreak || track === "all" || session.dataset.track === track;
      session.hidden = !match;
      if (match && !isBreak) shown += 1;
    });

    filters.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === track));
    });

    if (status) {
      const day = panel.querySelector(".panel-weekday");
      const name = day ? day.textContent.trim() : "This day";
      status.textContent =
        name + ": showing " + shown + " of " + total + " sessions, " + trackLabel(track);
    }
  }

  function selectDay(id, moveFocus) {
    tabs.forEach((tab) => {
      const on = tab.dataset.day === id;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && moveFocus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.day !== id;
    });
    programme.dataset.day = id;
    render();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectDay(tab.dataset.day, false));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      selectDay(tabs[next].dataset.day, true);
    });
  });

  filters.forEach((button, index) => {
    button.addEventListener("click", () => {
      programme.dataset.track = button.dataset.filter;
      render();
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : filters.length - 1;
      const next = filters[(index + step) % filters.length];
      next.focus();
      programme.dataset.track = next.dataset.filter;
      render();
    });
  });

  const startingDay = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
  if (startingDay) selectDay(startingDay.dataset.day, false);
  else render();
})();
