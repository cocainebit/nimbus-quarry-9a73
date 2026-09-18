/* Overtone, a Plotform studio edition. Vanilla JavaScript, no dependencies,
   no audio and no network calls. */
(() => {
  /* ---------- Mobile navigation ----------
     A native dialog, so Escape and focus handling come for free. */
  const menu = document.getElementById("menu");
  const menuToggle = document.querySelector(".menu-toggle");
  if (menu && menuToggle) {
    menuToggle.addEventListener("click", () => menu.showModal());
    const close = menu.querySelector(".menu-close");
    if (close) close.addEventListener("click", () => menu.close());
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => menu.close()));
  }

  /* Arrow keys move between the buttons of one group, the way a toolbar does. */
  const wireArrowKeys = (buttons, onMove) => {
    buttons.forEach((button, index) => {
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : buttons.length - 1;
        const next = buttons[(index + step) % buttons.length];
        next.focus();
        onMove(next);
      });
    });
  };

  /* ---------- Catalogue filters ----------
     Format and year narrow the same list. Nothing is fetched: every release is
     already in the page, and filtering only hides rows. */
  const catalogue = document.getElementById("catalogue");
  if (catalogue) {
    const releases = Array.from(catalogue.querySelectorAll(".release"));
    const count = document.getElementById("release-count");
    const empty = document.getElementById("release-empty");
    const clear = document.querySelector(".filter-clear");
    const groups = Array.from(document.querySelectorAll(".filter-group[data-filter]"));
    const chosen = {};
    groups.forEach((group) => { chosen[group.dataset.filter] = "all"; });

    const apply = () => {
      let shown = 0;
      releases.forEach((release) => {
        const match = groups.every((group) => {
          const key = group.dataset.filter;
          return chosen[key] === "all" || release.dataset[key] === chosen[key];
        });
        release.hidden = !match;
        if (match) shown += 1;
      });
      if (count) {
        count.textContent = shown === releases.length
          ? `Showing all ${releases.length} releases`
          : `Showing ${shown} of ${releases.length} releases`;
      }
      if (empty) empty.hidden = shown !== 0;
    };

    const select = (group, value) => {
      chosen[group.dataset.filter] = value;
      group.querySelectorAll("button[data-value]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.value === value));
      });
      apply();
    };

    groups.forEach((group) => {
      const buttons = Array.from(group.querySelectorAll("button[data-value]"));
      buttons.forEach((button) => {
        button.addEventListener("click", () => select(group, button.dataset.value));
      });
      wireArrowKeys(buttons, (button) => select(group, button.dataset.value));
    });

    if (clear) {
      clear.addEventListener("click", () => {
        groups.forEach((group) => select(group, "all"));
      });
    }

    apply();
  }

  /* ---------- Waveform play state ----------
     The waveform is a drawing. There is no audio file, nothing is preloaded and
     nothing starts on its own: the button only changes the drawing's state. */
  const player = document.querySelector(".player");
  const play = player && player.querySelector(".play");
  if (player && play) {
    const label = play.querySelector(".play-label");
    const status = document.getElementById("player-status");
    const setPlaying = (playing) => {
      player.dataset.playing = String(playing);
      play.setAttribute("aria-pressed", String(playing));
      if (label) label.textContent = playing ? "Pause the waveform" : "Play the waveform";
      if (status) status.textContent = playing ? "Waveform preview running" : "Waveform preview stopped";
    };
    play.addEventListener("click", () => setPlaying(player.dataset.playing !== "true"));
    setPlaying(player.dataset.playing === "true");
  }
})();
