# Overtone, vendor copy

Unminified adapted source for the `studio-signal` edition (served copy: `public/templates/studio-signal/`). Same files, plus the two build scripts, and without the generated `source.zip` and `plotform-preview.jpg`.

- `tools/make-art.mjs`: writes the twelve sleeves, the level meter and the routing diagram into `assets/`.
- `tools/build-pages.mjs`: writes the five HTML pages, including the waveform's forty eight bars. It refuses to write a page containing an em dash.
- `VENDOR-NOTES.md`: what was reused from the Codrops Kinetic Type Page Transition and what was authored, dated 2026-09-17.
- `SOURCE.json`: per asset provenance, the pinned upstream commit and the licence of every bundled file.

Rebuild everything with `node tools/make-art.mjs && node tools/build-pages.mjs`, then copy this folder (minus this README and `tools/`) over `public/templates/studio-signal/`. `source.zip` holds this folder together with the pinned upstream tree under `upstream/`.
