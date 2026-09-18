# Bevel, vendor copy

Unminified adapted source for the `studio-terminal` edition (served copy: `public/templates/studio-terminal/`). Same files, plus the two build scripts and the pinned upstream archive, and without the generated `source.zip` and `plotform-preview.jpg`.

- `tools/make-art.mjs`: writes the drawn screens, the pipeline diagram and the six icons into `assets/`. Every image this edition ships comes from here.
- `tools/build-pages.mjs`: writes the five HTML pages, including the window chrome that all of them share. It refuses to write a page containing an em dash.
- `upstream/`: the complete 7.css working tree at the pinned commit, with the licence audit that chose it over 98.css and XP.css.
- `VENDOR-NOTES.md`: what was reused from 7.css and what was authored, dated 2026-09-17.
- `SOURCE.json`: per asset provenance, the pinned upstream commit and the licence of every bundled file.

Rebuild everything with `node tools/make-art.mjs && node tools/build-pages.mjs`, then copy this folder (minus this README, `tools/` and `upstream/`) over `public/templates/studio-terminal/`. `source.zip` there holds this folder together with the pinned upstream tree under `upstream/`.
