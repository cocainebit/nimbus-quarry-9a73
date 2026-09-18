# Threshold, a Plotform studio edition

An explorable explanation: a scroll driven essay whose argument is carried by
two interactive figures written in plain JavaScript against hand written SVG.

Adapted from two upstreams, both pinned:

- The Evolution of Trust by Nicky Case, CC0 1.0 Universal, commit
  `6ec45d73befdb922bd40654dd1c1c903a953562f`, for how an explorable explanation
  chapters a scroll and swaps one widget in per step, and for the two drawn
  people in the first figure, which are its CC0 artwork.
- roadtolarissa by Adam Pearce, MIT, commit
  `3e28b8aace38d09984a4714ea0c21669081f5dee`, for how a data essay is built: a
  newsprint ground, a 750 pixel measure, charts drawn as SVG from the numbers,
  and hand drawn annotation arrows.

This directory is the complete adapted source, identical to the static files
served from `public/templates/studio-explain` apart from the generated
`source.zip` and `plotform-preview.jpg`.

- `model.js` is the one place the numbers live. Change a value and both figures
  follow it on the next reload.
- `tools/build-pages.mjs` regenerates the five HTML pages from one shared bar
  and foot. It reads `model.js` and the shared drawing block at the top of
  `script.js`, so the curve saved into the HTML, the numbers written into the
  sentences and the figures the browser draws cannot drift apart. Pass an
  output directory as the first argument to write elsewhere.

The published `source.zip` is this directory under `threshold/` next to trimmed
copies of both upstreams under `upstream/`. Each upstream copy carries a
`PLOTFORM-ARCHIVE-NOTE.md` saying exactly what was left out of it and why. In
the case of ncase/trust that includes all of its audio, which is a mixture of
licences and cannot be redistributed here.

It is a plain Node script with no dependencies. What was reused from each
upstream and what is new is recorded in `VENDOR-NOTES.md` and `SOURCE.json`.
Dated 2026-09-17.
