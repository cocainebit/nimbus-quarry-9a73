# Overtone: a Plotform studio edition

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not an additional independently sourced repository.

## Foundation

Kinetic Type Page Transition, https://github.com/codrops/KineticTypePageTransition, pinned revision ebe926e2f1de42950c36ff8a678321155280c1af, MIT, copyright 2009 to 2021 Codrops. Its MIT notice is kept in `licenses/kinetic-type-MIT.txt`, and the complete upstream working tree is archived inside `source.zip` under `upstream/KineticTypePageTransition-ebe926e2/`.

It was chosen because the brief for this edition is kinetic typography on flat colour fields, and that demo is the permissively licensed reference for exactly that: oversized repeated words held behind the content, a theme carried on custom properties, and a page with no photographic furniture.

## What was reused

- The kinetic type layer: a field of oversized repeated words set behind the content at low contrast (`.type` and `.type__line` in `src/css/base.css`), rewritten here as `.kinetic` and `.kinetic-line` with an outline treatment.
- The custom-property colour theme declared on the page root, rewritten as the `:root` token set at the top of `style.css`.
- The frame style header: a wordmark on one side, links on the other, sitting above the content rather than in a bar.
- The flat single-colour field treatment, with heavy type and no photographic chrome.
- The focus-visible handling, and the reset that makes a button carry no button styling.

## What was not reused

GSAP and imagesloaded, and with them the entire page transition timeline. GSAP carries its own licence rather than an MIT one, so nothing here depends on it: the drift, the ticker and the waveform are plain CSS animations and the JavaScript has no dependencies at all. Parcel and the npm build were dropped. The four demo photographs in `src/img`, the prebuilt `dist` directory, the article overlay, the staggered item carousel, the back control and all upstream copy were left behind.

## What is new

Every page's layout, typography, copy and responsive behaviour. The twelve sleeves, the level meter and the routing diagram, all written as SVG by `tools/make-art.mjs`. The forty eight bar waveform, written by `tools/build-pages.mjs`. The JavaScript: the catalogue filters, the play state toggle and the mobile navigation dialog. The new work is licensed MIT (`LICENSE`).

## Imagery

There is no photography anywhere in this edition, no generated imagery and no asset taken from a reference site. Every visual is CSS or SVG written for it, and the per file provenance is in `SOURCE.json`.

## Typography

Manrope for display and Inter for text, both under the SIL Open Font License, bundled locally as `assets/manrope.woff2` and `assets/inter.woff2` with their licences in `licenses/`. Track numbers, lengths and years use Inter with tabular figures, so nothing is set in a monospace face. No remote fonts, scripts, trackers or form services. Contact links open the visitor's email application with the example address `hello@example.com`; replace it before publishing.

## Interaction

Two, and neither is a carousel.

- The catalogue filters twelve entries by format and by year at the same time. Every entry is already in the page, so filtering only hides rows: nothing is fetched. The count is a live region, there is an empty state for a pair of filters that matches nothing, and arrow keys move between the buttons of a group.
- The release page has a play state toggle. It switches a drawn waveform between a stopped and a running state. There is no audio file on the site, nothing is preloaded, nothing autoplays, and the page says so next to the button.

Both animated states, along with the kinetic drift and the ticker, stop under `prefers-reduced-motion: reduce`. The play state stays readable there: the bars change colour and the playhead holds at a fixed position.

## Content

Overtone is an illustrative label. Catalogue numbers, titles, formats, dates and track lengths are examples rather than real records, and a visible note says so on every page. No performer is named, and no chart position, sales figure, price, award, review or testimonial appears anywhere.

## Building

The site is static: open `index.html` through any static server. The five pages are assembled by `tools/build-pages.mjs` and the drawings by `tools/make-art.mjs`; both are plain Node scripts with no dependencies, and neither runs in the browser. Editing the produced HTML directly works too, because the HTML, CSS and JavaScript are the deliverable.
