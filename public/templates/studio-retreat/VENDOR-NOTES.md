# Strand: a Plotform studio adaptation

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not an independently sourced repository.

## Foundation

AstroWind, https://github.com/arthelokyo/astrowind (formerly onwidget/astrowind), pinned at commit 14e1a691f80548dcc36370847b1a02c0d0b12821, MIT, copyright 2023 onWidget. The original notice is in licenses/astrowind-MIT.md and the pinned upstream source is archived at vendor/templates/studio-retreat/upstream/astrowind-14e1a691-source.zip and inside source.zip.

## What was reused

- The multi-page business-site information architecture: a home page that previews each section, dedicated content pages, and contact handled by a single action rather than a form.
- The Header widget's shape: a centred bar with navigation links and one call to action, collapsing to a menu button on small screens.
- The Content widget's alternating text-and-image rows (image beside copy, reversed on every other row).
- The FAQs widget's native accordion: a group of `details` elements sharing a `name` so that only one is open at a time, no script required.
- The Footer structure: a primary line, a row of links, and a secondary note.
- Three photographs that the AstroWind demo already vendored from Unsplash (winter road, eggs, notebook); five further Unsplash photographs come from the Dante theme's demo content, whose README credits Unsplash. Every image is listed with its origin in SOURCE.json and on credits.html.

## What was authored for this edition

- The composition: a full-bleed photograph that stays fixed while an inset bone panel with rounded corners slides over it, a floating centred navigation pill, and a quiet navy ending.
- The typography: Playfair Display (italic for the headline voice) paired with DM Sans, both self-hosted under the SIL Open Font License with their license texts in licenses/.
- The season switcher on the front page: a WAI-ARIA tab list that swaps the hero photograph and its caption, with arrow-key, Home and End navigation and a reduced-motion fallback.
- The small-screen menu (a native dialog), the three sketch floor plans on stay.html (inline SVG, drawn for this edition), and all copy.
- The rebuild as portable HTML, CSS and one small script. There is no build step, no remote font, no remote script, no tracker and no form.

## What this template does not do

Enquiries are `mailto:hello@example.com` links with a subject line; replace the address before publishing. No booking, payment, calendar or content-management backend is included or implied. Rooms, the menu, the walks and the seasons are illustrative and carry no prices, ratings, reviews or claims about a real place.

## Licensing

The adapted HTML, CSS, script and floor-plan drawings are MIT (LICENSE, copyright 2026 Plotform contributors). Upstream MIT and font OFL notices are retained in licenses/. Photographs are used under the Unsplash License.
