# Plenum: a Plotform studio edition

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not an additional independently sourced repository.

## Foundation

jekyll-theme-conference by Digitale Gesellschaft, https://github.com/DigitaleGesellschaft/jekyll-theme-conference, pinned revision 7d7479e486d87c59a15280e20e76c015d26aabb1, MIT, copyright 2017-2026 Lorenz Schmid. The upstream is archived beside this adaptation in `upstream/jekyll-theme-conference-7d7479e4-source.zip`, which also ships inside `source.zip`. Its MIT notice is kept in `licenses/jekyll-theme-conference-MIT.txt`.

It was chosen because it is the only permissively licensed design available that solves the problem a conference site actually has: a multi day programme laid out as a time grid, with talk, speaker, room and venue pages hanging off it. That structure is the part nobody else has open sourced. Its Bootstrap 5 surface is not worth taking, so none of it was.

## What was reused

- The multi day programme as a time grid: time down the left, rooms across the top, each session placed by its start time and spanning its duration (`_layouts/program.html`).
- Switching between days over one grid, with the first day shown on load (the day tab strip in `_layouts/program.html`).
- The track carried as a colour on the left edge of every session, with a key printed under the grid (`_includes/get_track_properties.html`, and the legend block at the foot of `_layouts/program.html`).
- The set of page types a congress needs: programme, talk, speaker index, room, location (`_layouts/talk.html`, `speaker-overview.html`, `room.html`, `location.html`).
- The talk page shape: track and time tags above the title, the description below it, a facts list beside it (`_layouts/talk.html`, `_includes/show_talk_info.html`).
- One schedule data file that the whole grid is generated from (`_data/program.yml`), rebuilt here as `tools/programme-data.json` with `tools/build-programme.mjs`.

## What was not reused

Jekyll, Liquid, the gem packaging, npm and Vite. Bootstrap 5, its colour and spacing utilities and the Bootstrap icon set. The upstream HTML table, replaced here by a CSS grid. The Leaflet map on the location page, replaced by two drawings. The dark mode switch, the live indication, the stream modal, the progressive web app layer, the service worker, the JSON-LD schema layer, the link preview tags and the info box. Every line of upstream copy, its demo schedule and its screenshot.

## What is new

Every page, all the copy, the type system, the colour set, the layout and the responsive behaviour. The upstream grid is a table inside a horizontally scrolling container with a sticky time column; this one is a CSS grid of fifteen minute rows that collapses into a single chronological column below 860 pixels, which is why the sessions are written to the document in clock order rather than room by room. The day tabs, the track filter, the status line, the mobile navigation dialog and the six drawings are new. The new work is licensed MIT (`LICENSE`).

## Imagery

There is no photography in this edition and no generated images. Six SVG files are written by hand: the house mark, three track marks, the venue plan and the approach drawing. The venue plan carries no text of its own, so the room names stay editable HTML; each space carries a shape that repeats as a CSS drawn key in the room list. The approach drawing exists because the upstream location page loads Leaflet and map tiles, and this edition loads nothing from anywhere.

## Typography

Space Grotesk (SIL Open Font License) for display, headings, labels and every time on the site, and Inter (SIL Open Font License) for running text. Both are bundled locally as `assets/space-grotesk.woff2` and `assets/inter.woff2` with their licences in `licenses/`. Times use tabular figures so the grid lines up and the rows stay comparable. No monospace is used as a user interface font anywhere. No remote fonts, scripts, trackers, maps or form services. Contact links open the visitor's email application with the example address `hello@example.com`; replace it before publishing.

## Content

Plenum, its dates, its venue, its rooms, its thirty sessions and its twelve speakers are illustrative, and every page carries a visible note saying so. No ticket prices, attendance figures, sponsors, awards or testimonials appear anywhere. Nothing is bookable: where a real congress would put a registration flow, this edition puts an email address.

## Interaction

The programme page switches between the three days and filters the grid by track. The days are a tab list: `aria-selected` on the tab, `hidden` on the panel, roving `tabindex`, and the left, right, Home and End keys move and activate. The track filter is four buttons with `aria-pressed`, also answering the left and right arrow keys, and it hides sessions with the `hidden` attribute so the list still reads with JavaScript turned off. Breaks are never filtered out, because they hold the shape of the day. A status line under the controls reports the day, how many sessions are showing and which track. Reduced motion is respected.

## Building

The site is static: open `index.html` through any static server. To change the schedule, edit `tools/programme-data.json` and run `node tools/build-programme.mjs`; it rewrites only the marked regions of `programme.html` and `style.css`. Nothing else needs a build step, and editing the HTML directly works.
