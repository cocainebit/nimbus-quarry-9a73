# Quire, a Plotform studio edition

Adapted from AstroPaper by Sat Naing, MIT, pinned at commit
35cfa7fbe0b897306d27670d3819e55d5205f3dd. The upstream source is vendored
unchanged at `vendor/templates/modern-astro-paper` (see its PLOTFORM-BUILD.md
for the pin) and archived inside `public/templates/studio-press/source.zip`
under `upstream/`.

This directory is the complete adapted source, identical to the static files
served from `public/templates/studio-press` apart from the generated
`source.zip` and `plotform-preview.jpg`.

- `tools/build-pages.mjs` regenerates the five HTML pages from one shared
  masthead bar, contents dialog and foot. Pass an output directory as the first
  argument to write elsewhere.

The published `source.zip` is this directory under `quire/` next to the pinned
upstream under `upstream/astro-paper-35cfa7fb/`. The upstream copy in the archive
leaves out its demonstration bitmaps, which this edition does not use; the archive
says so in its own note.

It is a plain Node script with no dependencies. There is nothing else to build:
the edition has no images, so there is no asset pipeline. What was reused from
the upstream and what is new is recorded in VENDOR-NOTES.md and SOURCE.json.
Dated 2026-09-17.
