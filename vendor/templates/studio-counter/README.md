# Carafe, a Plotform studio edition

Adapted from AstroWind by onWidget, MIT, pinned at commit
14e1a691f80548dcc36370847b1a02c0d0b12821. The upstream source is vendored
unchanged at `vendor/templates/modern-astrowind` (see its PLOTFORM-BUILD.md for
the pin) and archived here at `upstream/astrowind-14e1a691-source.zip`.

This directory is the complete adapted source, identical to the static files
served from `public/templates/studio-counter` apart from the generated
`source.zip` and `plotform-preview.jpg`, and this README, the `tools/` directory
and the `upstream/` archive, which stay here.

- `tools/build-pages.mjs` regenerates the six HTML pages from one shared
  shopfront, footer and head block. Pass an output directory as the first
  argument to write elsewhere. Plain Node, no dependencies.

The published `source.zip` is this directory as it stands: the adapted source at
the root, the licences in `licenses/`, the generator in `tools/` and the pinned
upstream inside `upstream/` as its own archive.

There is no asset pipeline: the edition has no photographs, its five drawings
are SVG written by hand and its paper is made of CSS gradients. What was reused
from the upstream and what is new is recorded in VENDOR-NOTES.md and SOURCE.json.
Dated 2026-09-17.
