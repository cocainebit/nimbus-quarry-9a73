/* Apogee, a Plotform studio edition. Vanilla JavaScript, no dependencies. */
(() => {
  // Mobile navigation: a native dialog, so Escape and focus handling come for free.
  const menu = document.getElementById("menu");
  const menuToggle = document.querySelector(".menu-toggle");
  if (menu && menuToggle) {
    menuToggle.addEventListener("click", () => menu.showModal());
    const close = menu.querySelector(".menu-close");
    if (close) close.addEventListener("click", () => menu.close());
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => menu.close()));
  }

  // Finish toggle on the hero: swaps between the product drawings.
  const view = document.querySelector("[data-finish-view]");
  const finishButtons = Array.from(document.querySelectorAll(".finish button[data-finish]"));
  if (view && finishButtons.length) {
    const status = document.getElementById("finish-status");
    const images = Array.from(view.querySelectorAll("img[data-finish-image]"));
    const setFinish = (name, button) => {
      view.dataset.finishView = name;
      finishButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.finish === name)));
      images.forEach((img) => {
        const active = img.dataset.finishImage === name;
        img.classList.toggle("is-active", active);
        img.setAttribute("aria-hidden", String(!active));
      });
      if (status && button) status.textContent = "Showing Deck in " + button.textContent.trim();
    };
    finishButtons.forEach((button, i) => {
      button.addEventListener("click", () => setFinish(button.dataset.finish, button));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : finishButtons.length - 1;
        const next = finishButtons[(i + step) % finishButtons.length];
        next.focus();
        setFinish(next.dataset.finish, next);
      });
    });
    const initial = finishButtons.find((b) => b.getAttribute("aria-pressed") === "true") || finishButtons[0];
    setFinish(initial.dataset.finish, null);
  }

  // Step index on the how-it-works page: highlights the step at the reading line.
  const indexLinks = Array.from(document.querySelectorAll(".step-index a[href^='#']"));
  const steps = Array.from(document.querySelectorAll(".step[id]"));
  if (indexLinks.length && steps.length) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.4;
      let current = steps[0].id;
      steps.forEach((step) => {
        if (step.getBoundingClientRect().top <= line) current = step.id;
      });
      indexLinks.forEach((link) => {
        if (link.getAttribute("href") === "#" + current) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    };
    const request = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }

  // Changelog: expand or collapse every release at once.
  const expandAll = document.querySelector(".expand-all");
  const releases = Array.from(document.querySelectorAll("details.release"));
  if (expandAll && releases.length) {
    const sync = () => {
      expandAll.setAttribute("aria-pressed", String(releases.every((d) => d.open)));
    };
    expandAll.addEventListener("click", () => {
      const open = expandAll.getAttribute("aria-pressed") !== "true";
      releases.forEach((d) => { d.open = open; });
      sync();
    });
    releases.forEach((d) => d.addEventListener("toggle", sync));
    sync();
  }
})();
