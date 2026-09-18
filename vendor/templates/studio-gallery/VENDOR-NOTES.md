# Plinth: a Plotform studio edition

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not an additional independently sourced repository.

## Foundation

AstroPaper, https://github.com/satnaing/astro-paper, pinned revision 35cfa7fbe0b897306d27670d3819e55d5205f3dd, MIT, copyright 2023 Sat Naing. The upstream is vendored at `vendor/templates/modern-astro-paper` and archived beside this adaptation in `upstream/astro-paper-35cfa7fb-source.zip`, which also ships inside `source.zip`. Its MIT notice is kept in `licenses/astro-paper-MIT.txt`.

AstroPaper was chosen because it is the one permissively licensed design in the collection that carries no photography at all: it is a type first theme whose structure is a wordmark, a heading block, a dated list of entries with tag pills and a footer. That is the same structure an exhibition programme needs, so the adaptation could keep the architecture and rebuild the surface.

## What was reused

- The type first page architecture: a wordmark header with a short navigation, a heading and standfirst block, a dated list of entries, and a rule bounded footer.
- The dated entry list with tag pills (`src/components/Card.astro`, `Datetime.astro`, `Tag.astro`), rebuilt as the programme entry blocks with a state tag, dates and a room.
- The CSS custom property token approach (`src/styles/theme.css`, `src/styles/global.css`), rewritten as the `:root` token set at the top of `style.css`.
- The skip link and the reading measure discipline from `src/components/Header.astro` and `src/components/Main.astro`.

## What was not reused

Astro, Tailwind, pagefind and the npm toolchain; the light and dark theme switcher; the search page; pagination; RSS; the generated OG images; all AstroPaper copy and blog content; and every image file in the upstream repository.

## What is new

Every page's layout, typography, copy and responsive behaviour; the twelve column grid whose entries step across it; the flat colour bands; the diagonal rules, which are CSS gradients rather than images; the five drawn marks and the floor plan, written by `tools/make-marks.mjs`; and the JavaScript (programme filter, list and grid view, mobile navigation dialog). The new work is licensed MIT (`LICENSE`).

## Imagery

There is no photography in this edition, and no generated images. Every graphic is an SVG file written by hand from rules, circles, arcs and flat fields, produced by the dependency free `tools/make-marks.mjs`. The floor plan carries no text of its own, so the room numbers on the visit page stay editable HTML.

## Typography

Inter, SIL Open Font License, bundled locally as `assets/inter.woff2` with its license in `licenses/inter-OFL.txt`. One family across the whole edition: scale, weight and letter spacing carry the identity instead of a second typeface. No remote fonts, scripts, trackers or form services. Contact links open the visitor's email application with the example address `hello@example.com`; replace it before publishing.

## Content

Plinth, its rooms, its programme, its works, its address and its opening hours are illustrative. Each page carries a visible note saying so. No prices, visitor numbers, awards, sponsors, client names or testimonials appear anywhere.

## Interaction

The programme page filters its entries by state (all, on now, upcoming, past) and switches between a list and a grid. Both controls are buttons with `aria-pressed`, the filter also answers the left and right arrow keys, and a status line reports how many entries are showing. Filtering hides entries with the `hidden` attribute, so the list stays readable with JavaScript turned off.

## Building

The site is static: open `index.html` through any static server. `node tools/make-marks.mjs` redraws the SVG files into `assets/`; nothing else needs a build step, and editing the HTML directly works.
