# Plinth

A five page website for an illustrative art space, written in plain HTML, one stylesheet and one small script. No build step, no dependencies, no remote requests.

- `index.html` what is open this week
- `programme.html` the full calendar, with the filter and the list or grid view
- `field-notation.html` a single exhibition
- `visit.html` hours, the drawn floor plan and access
- `credits.html` where every part of this edition comes from

Open `index.html` through any static server. `node tools/make-marks.mjs` redraws the SVG marks and the floor plan into `assets/`.

Plinth is a Plotform studio edition adapted from AstroPaper (MIT). See `VENDOR-NOTES.md` for what was reused, `SOURCE.json` for per asset provenance, and `upstream/` for the pinned upstream source. The content is illustrative: replace the wordmark, the programme entries, the address and the example email address before publishing.
