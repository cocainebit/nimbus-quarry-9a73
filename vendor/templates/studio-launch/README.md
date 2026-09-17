# Apogee, a Plotform studio edition

Adapted from Moon Landing (astro-landing-page) by Markus Hsi-Yang Fritz, MIT,
pinned at commit 987617a50863d31bb865ee531391a191d74a878a. The upstream source
is vendored unchanged at `vendor/templates/modern-moon` (see its
PLOTFORM-BUILD.md for the pin) and archived inside
`public/templates/studio-launch/source.zip` under `upstream/`.

This directory is the complete adapted source, identical to the static files
served from `public/templates/studio-launch` apart from the generated
`source.zip` and `plotform-preview.jpg`.

- `tools/make-svgs.mjs` regenerates the product drawings into `assets/`.
- `tools/build-pages.mjs` regenerates the five HTML pages from one shared
  header and footer. Pass an output directory as the first argument to write
  elsewhere.

Both are plain Node scripts with no dependencies. What was reused from the
upstream and what is new is recorded in VENDOR-NOTES.md and SOURCE.json.
Dated 2026-09-17.
