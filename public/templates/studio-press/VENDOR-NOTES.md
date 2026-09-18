# Quire: a Plotform studio edition

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not a copy of any reference site.

## Foundation

AstroPaper, https://github.com/satnaing/astro-paper, pinned at commit 35cfa7fbe0b897306d27670d3819e55d5205f3dd, MIT, copyright 2023 Sat Naing. The upstream is vendored at `vendor/templates/modern-astro-paper` and archived inside `source.zip` under `upstream/`. Its MIT notice is kept in `licenses/astropaper-MIT.txt`.

AstroPaper was chosen because it is the one permissively licensed upstream in this repository whose subject is a publication rather than a marketing site: an index of pieces, a listing, a piece, an about page, and a reading experience that already treats the persisted light and dark switch as part of the product rather than as decoration. That is the exact architecture this edition needed, and it is MIT, so it may be redistributed inside an exported site.

## What was reused

- The publication architecture: an index of pieces, a grouped listing, a single piece with adjacent-piece navigation, an about page and a colophon.
- The token pair held on a data attribute on the root element (`src/styles/theme.css`), rewritten as the `:root` and `[data-reading-mode="night"]` token sets at the top of `style.css`.
- The persisted theme switch (`src/scripts/theme.ts`): a value written to local storage, an inline script that applies it before paint so the page never flashes the wrong palette, reflection of the state onto the control, and the `meta[name=theme-color]` update. Here it carries two axes instead of one, the reading mode and the type size.
- The skip link to the main landmark and the visible focus outline on links and buttons.

## What was not reused

Astro, Tailwind v4, the typography plugin and the npm toolchain; search; the feed; the generated Open Graph images; archive pagination; social links; the upstream fonts and the AstroPaper logo and lighthouse badge; and every line of upstream copy and configuration.

## What is new

Every page's composition, the whole stylesheet, the script, the type system and all of the writing. `tools/build-pages.mjs` assembles the five pages from one shared masthead bar, contents dialog and foot. The new work is licensed MIT (`LICENSE`).

## Typography

Source Serif 4 by Frank Griesshammer for Adobe, SIL Open Font License 1.1, copyright 2014 to 2023 Adobe. Two files are bundled locally, `assets/source-serif-4-normal.woff2` and `assets/source-serif-4-italic.woff2`, taken from the latin subset of the standard variable build in `@fontsource-variable/source-serif-4` 5.3.0, each carrying the weight and optical size axes. The licence is in `licenses/source-serif-4-OFL.txt`.

The edition is set in one family and three registers: display, text, and capitals set small and letterspaced for the furniture. There is no second family and no monospace anywhere. Source Serif 4 was chosen because this template lives or dies on its text face: it is a low contrast, sturdy text serif drawn for continuous reading, it has a real italic rather than a slanted roman, and its optical size axis lets the display sizes run finer and the text sizes run sturdier from a single file.

Nothing is loaded from a font service. There are no remote scripts, trackers or form services. Contact is a `mailto:` link with the example address `letters@example.com`; replace it before publishing.

## Pictures

There are none, by design. This edition carries no photographs and no generated images. The printer's device in the masthead bar and at the foot of every page is inline SVG written for this template; every rule, lozenge, contents leader, drop cap and end mark is drawn by `style.css`. The only bitmap in the published folder is `plotform-preview.jpg`, the catalogue screenshot of this template's own front page.

## Interaction

Two reading settings are kept in this browser under `quire-reading-mode` and `quire-type-size`: day or night, and three type sizes. An inline script applies both before paint, and they carry from one page to the next. The type size changes the measure with it, because the column is specified in characters rather than pixels, so the line holds about the same number of words at every size. The front page index also filters by issue, with a live status line. Everything works from the keyboard, and readers who ask for reduced motion get no transitions.

## Content

Quire does not exist. The essays, contributors, editors, issues, folio numbers and reader letters were invented for this template, and the prose was written for it. No metric, price, award, byline or endorsement here refers to anything real, and each page carries a visible note saying so.

## Building

The site is static: open `index.html` through any static server. `tools/build-pages.mjs` regenerates the five pages; pass an output directory as the first argument to write elsewhere. It is a plain Node script with no dependencies. Editing the HTML directly also works.
