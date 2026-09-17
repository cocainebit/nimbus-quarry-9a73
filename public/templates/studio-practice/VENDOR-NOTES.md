# Lintel: a Plotform studio adaptation

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not a copy of any reference site.

## Foundation

AstroWind, https://github.com/onwidget/astrowind, pinned at commit 14e1a691f80548dcc36370847b1a02c0d0b12821, MIT, copyright 2023 onWidget. The upstream notice is kept in `licenses/astrowind-MIT.md` and the full upstream source is archived beside this adaptation in `vendor/templates/studio-practice/upstream-astrowind-14e1a691.zip`.

## What was reused

AstroWind is an Astro and Tailwind business-site system. Lintel does not ship its framework build; it builds on its information architecture and section components, rewritten as portable HTML, CSS and vanilla JavaScript:

- The multi-page business-site structure (home, about, services, contact) became home, studio, three project pages and a mailto contact.
- The Projects widget (image, tags, title, description, link) became the numbered project index with a type filter.
- The Steps and Timeline widgets (a numbered sequence separated by rules) became the four-step approach accordion on the studio page.
- The Content widget (split text and image with aspect-controlled crops) became the project brief rows and the detail figure on each project page.
- The Header and Footer structure (skip link, labelled navigation landmarks, footer link groups) is kept in spirit.

No Tailwind utility markup, generated CSS or upstream copy was carried over verbatim.

## What was authored

- All page composition, the stone and bone token palette, the Newsreader and Manrope type system with true small caps, the responsive grid and every line of `style.css`.
- All copy. The projects (Two Walls House, Reading Room, Long Room) are illustrative concept studies, not built or commissioned work, and each page says so.
- The three plan drawings in `assets/plan-*.svg` are original vector artwork for this template.
- `script.js`: the project type filter (buttons with `aria-pressed` and a live status line) and the photograph / drawing toggle on each project page. Both work from the keyboard. The approach accordion uses native `details` elements.
- Reduced-motion users get no transitions or hover scaling.

## Imagery

Six photographs come from the Dante theme demo set, which its README credits to Unsplash; three come from AstroWind's demo, vendored by Plotform with their original Unsplash URLs recorded. Per-file provenance is in `SOURCE.json` and `licenses/IMAGE-SOURCES.md`, and on the studio page colophon. No images were downloaded from the web or generated for this template.

## Fonts

Newsreader (Production Type) and Manrope (Mikhail Sharanda), both under the SIL Open Font License 1.1, bundled locally with their license texts in `licenses/`. No remote fonts, scripts, trackers or forms. Contact links use `hello@example.com` until customised.

## Source

`source.zip` contains this complete adapted source. The added HTML, CSS, JavaScript and SVG are MIT, copyright 2026 Plotform contributors (see `LICENSE`).
