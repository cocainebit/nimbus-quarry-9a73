# Fettle: a Plotform studio edition

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not an additional independently sourced repository.

## Foundation

PaperCSS, https://github.com/papercss/papercss, pinned revision b341c1606fca5b3880307d779414f43a5ccbc9b6, ISC, copyright 2017 to 2018 Rhyne Vlaservich. Its notice is kept in `licenses/papercss-ISC.txt` and a trimmed archive of the upstream tree is in `upstream/papercss-b341c160-source.zip`.

PaperCSS was chosen because it is the one permissively licensed component layer whose subject is exactly this edition's subject: making a web page look drawn using nothing but borders, radii and shadows, with no images at all. That is the right foundation for a workshop whose whole identity is hand drawn.

## What was reused

- The irregular border radius technique, which is the trick the entire library rests on: giving a box four wildly mismatched corner radii turns a rectangle into something that looks sketched (`src/core/_mixins.scss`, the `border-style` mixin). Rewritten as the six `--edge` tokens at the top of `style.css`.
- Cycling those variants across sibling elements so that no two neighbouring cards share the same wobble (`src/utilities/_borders.scss`, the `child-borders` rules). Rewritten as the `nth-child(6n + N)` blocks in `style.css`.
- The flat offset shadow rather than a blurred one (`src/utilities/_shadows.scss` and the `shadow` mixin). Rewritten as `--shadow` and `--shadow-deep`.

## What was not reused

The stylesheet itself. Nothing from `dist/paper.css` or `src/` is shipped here; the three cues above were re-implemented from scratch, which is also what made it possible to drop the thing that would otherwise have disqualified it.

**PaperCSS reaches out to Google on every page load.** The first line of `src/core/_config.scss` sets `$font-src` to `https://fonts.googleapis.com/css?family=Neucha|Patrick+Hand+SC` and imports it, so `dist/paper.css` carries that `@import` into every site built with it. A studio edition may not do that: it is a remote request, and it would leak every visitor of every published site to a third party. This edition bundles one OFL typeface locally instead and makes no remote request of any kind.

Also not reused: its palette, its typography, its form kit, navbar, modals, popovers, tabs, alerts, badges and progress bars; Sass and npm; every word of PaperCSS documentation copy; and every image in its repository.

## What is new

Every page's layout, typography, copy and responsive behaviour; the squared paper ground; the drawn rules, frames, callouts, tool sketches, floor plan and chart; the eleven Open Peeps figures; and the JavaScript, which is a programme filter and a navigation dialog and nothing else. The new work is licensed MIT (`LICENSE`).

## The drawings

There is no photography in this edition, and no generated images. Two build scripts write every graphic:

- `tools/make-art.mjs` draws with **Rough.js 4.6.6** (MIT, copyright 2019 Preet Shihn, notice in `licenses/roughjs-MIT.txt`, bundled ES module vendored at `tools/vendor/rough.esm.js`). It writes the rules, the frames, the callout, the drawing pin, the heading swash, six tool sketches, the floor plan and the bar chart.
- `tools/make-people.mjs` writes the people from **Open Peeps** by Pablo Stanley, which openpeeps.com places in the public domain under CC0 with no attribution required (statement quoted verbatim in `licenses/open-peeps-CC0.txt`, verified against the live page on 2026-09-17). The machine readable copy of that artwork is **react-peeps 0.1.10** (MIT, Emre Cakir, notice in `licenses/react-peeps-MIT.txt`, archived at `upstream/react-peeps-0.1.10.tgz`); the script renders its components once with `react-dom/server` and writes static SVG.

**Both run once, at build time, and write files.** Rough.js re-rolls its strokes on every render. A page that draws in the browser therefore jitters on resize, on re-render and on every keystroke in the editor, and the source editor loses whichever leaf it was holding. Every Rough.js call in `make-art.mjs` also passes an explicit `seed`, so running the script again writes byte identical files. Nothing on any page draws anything: the pages load these SVG files the way they would load any image, and no React and no Rough.js reach the browser.

The floor plan and the chart deliberately carry no text of their own, so the room names, the numbers and the days stay editable HTML on `space.html`, and the chart's figures are repeated in a table beside it.

## Typography

Bricolage Grotesque, SIL Open Font License 1.1, copyright 2022 the Bricolage Grotesque Project Authors, bundled locally as `assets/bricolage-grotesque.woff2` (the latin subset with the weight axis, from `@fontsource-variable/bricolage-grotesque` 5.3.0) with its licence in `licenses/bricolage-grotesque-OFL.txt`.

It was chosen because it is a grotesque assembled out of parts that do not quite agree: flared terminals, uneven joins, a slightly heavy waist. It holds a drawn page without pretending to be a handwriting face, which would be unreadable at body size and would compete with the actual drawings. It also has no reserved font name, so it can be modified and redistributed inside an exported site with no renaming duty. One family across the whole edition; the weight axis carries every level of hierarchy, and nothing is set in a monospace face.

## Content

Fettle, its classes, tutors, timetable, bench numbers, address, opening hours and fees are illustrative. Every fee is marked illustrative where it appears, and every page carries a visible note saying the whole thing is an example. No visitor numbers, awards, sponsors, client names or testimonials appear anywhere. Contact is a `mailto:` link to `hello@example.com`; replace it before publishing.

## Interaction

The programme page filters its fourteen sessions by level and by evening at the same time. Both groups are buttons carrying `aria-pressed`, both answer the left and right arrow keys and Home and End as well as the mouse, and a status line reports how many sessions are showing and how many benches are left free across them. Filtering hides sessions with the `hidden` attribute, so the full list still reads with JavaScript turned off.

## No remote requests

No remote scripts, fonts, trackers, analytics, maps or form services, on any page. The only `http` and `https` strings anywhere in this folder are inside licence and provenance files, pointing at the upstream projects credited above. `prefers-reduced-motion: reduce` is honoured.

## Building

The site is static: open `index.html` through any static server.

- `node tools/make-art.mjs` redraws the Rough.js graphics into `assets/`. No install step; the library is vendored.
- `node tools/make-people.mjs` rewrites the Open Peeps figures into `assets/`. It needs `react` and `react-dom` resolvable and `tar` on the path.
- `node tools/build-pages.mjs` rewrites the six HTML pages from the programme data held in that one file.

None of the three is needed to use the template. All of their output is committed, and editing the HTML, the stylesheet and the SVG files directly works.
