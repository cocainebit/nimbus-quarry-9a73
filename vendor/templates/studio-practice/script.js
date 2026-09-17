// Lintel: project type filter and photograph / drawing toggle.
// Plain buttons carry aria-pressed, so keyboard users get the same controls.
(() => {
  const filters = document.querySelectorAll("[data-filter]");
  const projects = document.querySelectorAll("[data-type]");
  const status = document.querySelector("#filter-status");
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      const type = button.dataset.filter;
      filters.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      let shown = 0;
      projects.forEach((project) => {
        const hide = type !== "all" && project.dataset.type !== type;
        project.hidden = hide;
        if (!hide) shown += 1;
      });
      if (status) {
        status.textContent =
          type === "all"
            ? "Showing all projects"
            : `Showing ${shown} ${type} ${shown === 1 ? "project" : "projects"}`;
      }
    }),
  );

  document.querySelectorAll("[data-view-group]").forEach((group) => {
    const target = document.querySelector(group.dataset.viewGroup);
    const buttons = group.querySelectorAll("[data-view]");
    if (!target) return;
    buttons.forEach((button) =>
      button.addEventListener("click", () => {
        buttons.forEach((item) =>
          item.setAttribute("aria-pressed", String(item === button)),
        );
        target.querySelectorAll("[data-layer]").forEach((layer) => {
          layer.hidden = layer.dataset.layer !== button.dataset.view;
        });
      }),
    );
  });
})();
