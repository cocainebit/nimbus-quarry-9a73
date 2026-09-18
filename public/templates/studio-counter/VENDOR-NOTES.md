# Carafe: a Plotform studio edition

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not a copy of any reference site.

## Why this edition exists

Open source restaurant templates are either unlicensed, or they are built entirely around full bleed stock food photography with no credit for it, and almost none of them has a real menu page. The menu is the one page a restaurant site cannot do without, and it is the page templates skip. So this edition was designed here rather than vendored, on a foundation already pinned in this repository, and it is built around the three things a restaurant actually needs: a menu with prices set properly, hours split by service, and a booking route that does not pretend to be a reservation system.

## Foundation

AstroWind, https://github.com/onwidget/astrowind, pinned at commit 14e1a691f80548dcc36370847b1a02c0d0b12821, MIT, copyright 2023 onWidget. The upstream is vendored at `vendor/templates/modern-astrowind`, archived here at `upstream/astrowind-14e1a691-source.zip`, and carried inside `source.zip` under `upstream/`. Its MIT notice is kept in `licenses/astrowind-MIT.md`.

AstroWind was chosen because it is the permissively licensed upstream in this repository whose subject is an ordinary multi page place, not a blog or a portfolio: a front page, several content pages, a contact page, one shared header and one shared footer. That is the shape a restaurant site takes, and its contact form already posts to nothing, which is the honest starting point for a booking page.

## What was reused

- The multi page static architecture with one shared head, header and footer, and a contact page whose form reaches no service.
- The single custom property token block that `src/components/CustomStyles.astro` sets on the root element, rewritten as the `:root` block at the top of `style.css`.
- The header pattern from `src/components/widgets/Header.astro`: brand, link list and one action, with a button that flips `aria-expanded` and an open class on the header for narrow screens.
- The native `details` accordion from `src/components/widgets/FAQs.astro`, used for the questions on the visit page.
- The footer from `src/components/widgets/Footer.astro`: link columns above a secondary line.
- The shape of `src/components/ui/Form.astro`: labelled inputs, a textarea, a disclaimer and a description line on a `form` element with no action.

## What was not reused

Astro, Tailwind v4, the typography plugin, the shadcn token layer and the npm toolchain; the blog, search, feed, generated Open Graph images and icon set; the dark mode switch and the intersection animations; the hosting configuration; every upstream photograph; and every line of upstream copy.

## What is new

Every page's composition, the whole stylesheet, the script, the type system, the five drawings and all of the writing. `tools/build-pages.mjs` assembles the six pages from one shared shopfront, footer and head block. The new work is licensed MIT (`LICENSE`).

## The menu

The menu is the point of this edition. A row is a three column grid: the name, a leader that takes whatever is left, and the price. The price column is sized to its own content and ends the row, so every price in a list shares one right edge at any width, including 320 pixels, where a long dish name wraps and the leader shortens to a stub rather than pushing the price off the line. Figures are set with tabular numerals in Source Serif 4, whose digits are one width, so the columns of digits line up as well as the column edges. The name, the dietary mark, the description and the price are each their own leaf element, so the source editor can select every one of them. The whole card prints: `@media print` drops the navigation, the filters and the paper colour and keeps the leaders.

**The prices are illustrative sample values, invented for this template.** They exist so the menu can be designed properly. The menu page says so at the top, the wine page says so at the top, the credits page says so, and the foot of every page says so. They are not a price list and they should be replaced before anyone publishes this.

## The hours

Kitchen and bar keep different time, so they are two lists, not one. The kitchen closes before the bar, Friday and Saturday have a lunch service as well as a dinner service, Monday is closed in both lists and is written out again under each one, and a note says what happens on public holidays and over Christmas. Each row carries the day numbers it covers, so the script marks today's row and writes one sentence from the table itself. It does no clock arithmetic and never claims the place is open now: it says what is printed for today.

## Booking

There is no reservation service here and this template does not pretend otherwise. Booking is a `mailto:` link to `bookings@example.com`, beside a form that carries no action, a visible notice saying that nothing is stored and nothing is sent, and a submit handler that says the same thing again rather than clearing the fields as though it had worked. Replace the address before publishing.

## Typography

Playfair Display, SIL Open Font License 1.1, copyright 2017 The Playfair Display Project Authors, for the wordmark, the headings and the pull quote. Source Serif 4 by Frank Griesshammer for Adobe, SIL Open Font License 1.1, copyright 2014 to 2023 Adobe, for everything that has to be read, including every price and every time.

Both are bundled locally as woff2 files from the variable builds already vendored in this repository, and both licences travel with them in `licenses/`. Nothing is loaded from a font service. There are no remote scripts, trackers, maps or form services. There is no monospace anywhere: the tabular figures come from the text serif.

## Pictures

There are none. No photographs, no generated images, nothing from a reference site. The identity is the type, the warm paper made from three CSS gradients, the claret accent, the hairline and dotted rules, and five drawings written as SVG for this edition: the counter seen from the door, a plate from above, a carafe with two glasses, the plan of the room and the map of the corner. The map is of an invented corner and is not traced from any mapping service. The numbered keys on the plan and the map are set as HTML text beside the drawing, so they can be edited.

## Content

Carafe does not exist. The dishes, the wines, the people, the street, the telephone number and the email address were invented for this template. The telephone number is in the range reserved for fiction. No price, time, distance or name here refers to anything real, and every page carries a note saying so.

## Building

The site is static: open `index.html` through any static server. `tools/build-pages.mjs` regenerates the six pages; pass an output directory as the first argument to write elsewhere. It is a plain Node script with no dependencies. Editing the HTML directly also works.
