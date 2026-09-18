# Original source template collection

Plotform imports original HTML, CSS, JavaScript and assets rather than reconstructing these designs with generated block layouts. The source catalogue is distinct from Plotform's functional app starters and its palette library.

The default contemporary collection now imports original Astro and React designs; simpler developer designs and motion experiments have separate tabs. See [the benchmark](DESIGN_REFERENCES.md) and [source review](MODERN_TEMPLATE_RESEARCH.md). These are stronger foundations, not a claim that 20 free templates match the user’s bespoke references.

The classic archive includes ten Start Bootstrap templates from their official repositories (MIT) and ten HTML5 UP designs (Creative Commons Attribution 3.0). The HTML5 UP source mirror is pinned to a commit, with the original author and upstream URL recorded. Source links, pinned revisions, license files and full file inventories are stored in `shared/source-templates-*.json` and `public/templates/*`.

- [Start Bootstrap's repositories](https://github.com/StartBootstrap)
- [HTML5 UP's original designs](https://html5up.net/)
- [HTML5 UP's licensing terms](https://html5up.net/license)

Required credits remain in previews and exported source. These works can be used within Plotform; Plotform does not claim authorship of the original designs. Fonts and other bundled dependencies retain their own licenses.

## Editing and export

Selecting a source template creates a separate project using the original design. Its source editor changes content and supports custom CSS without flattening the design into Plotform blocks. Project edits persist with the normal project document. Export contains the original source assets and edited HTML, with licenses retained.

Source-template previews run in sandboxed frames without access to the builder's cookies, storage, or application DOM. Preview content is illustrative; initial template text and images belong to the upstream demo.

## Functionality boundary

These are website design templates. Importing one does not create a payment processor, reservation service, member login, or operational contact form. Original paid form-service dependencies are removed or marked unconnected. Plotform's separate app starters provision the currently supported accounts, collections and runtime screens. Selecting a design alone does not bind its forms to those services.

Rebuild catalogue images from the actual vendored websites with `node scripts/capture-source-templates.mjs` while the local Vite server is running. Images are screenshots of the source templates, not generated mockups.

## Framework templates

New framework designs include pinned corresponding source archives. Static HTML edits apply to the built export; the included original framework source remains the upstream starting point, not an AST rewrite of every visual edit. React content edits are reapplied after hydration so client initialization does not silently restore the demo text. External services and demonstration claims remain upstream examples, not activated functionality or user business facts.

## Studio editions

Studio editions are the first tab of **Create a website** and the collection the user's design references are measured against (see [the benchmark](DESIGN_REFERENCES.md)). Each edition is a complete, multi-page website authored for Plotform on top of a licensed open-source foundation. Unlike the contemporary and classic collections, an edition is not an unchanged upstream template: its manifest carries `adaptationLabel` and `adaptedFrom` with a pinned commit, its folder keeps the upstream notice under `licenses/` and a `SOURCE.json` with per-image provenance, and the complete adapted source ships as a ZIP next to the built pages.

Rules every edition follows:

- Foundation licensed for redistribution. New editions use MIT or equally permissive upstreams; Atelier is the one GPL-3.0 edition (from Dante) and the catalogue says so in the dialog, because a website published from it must be distributed with its source and license.
- Imagery only from documented sources (upstream repositories whose READMEs credit Unsplash, or CSS and SVG compositions). No generated images, no reference-site assets.
- Fonts bundled locally with their OFL files. No remote scripts, fonts, trackers or forms; contact is a `mailto:` link with an example address.
- Illustrative content only: no metrics, prices, awards, client names or testimonials presented as facts, and a visible demo note that says the studies are illustrative.
- No em dashes in copy, and no monospace as a UI font.
- Every visible text, link and image is a leaf element the source editor can select, and each edition has a browser spec covering overflow at 1440/768/390/320, its interaction, its navigation and its source archive.

Editions as of 2026-09-17, in catalogue order:

| Edition | Direction | Adapted from | License of the adapted code |
| --- | --- | --- | --- |
| Commonplace | Editorial product site: serif headlines, two audience journeys, interactive workspace preview | Launch UI (MIT) | MIT |
| Atelier | Design-practice portfolio: oversized serif, three photographed case studies, service directory | Dante (GPL-3.0) | GPL-3.0 |
| Independent | Portfolio: oversized grotesk, numbered studies, working filters | Dillion Portfolio and Launch UI (MIT) | MIT |
| Apogee | Dark product launch for an illustrative desktop sequencer: headline broken around an SVG product drawing, finish toggle, stepped how-it-works page, expandable changelog | Moon Landing (MIT) | MIT |
| Lintel | Architecture and interiors practice: image-led project index, project type filter, photograph/drawing toggle, studio page with approach accordion | AstroWind (MIT) | MIT |
| Strand | Hospitality place: full-bleed photograph under an inset rounded panel, floating navigation, season switcher, rooms with SVG floor plans, a menu without prices | AstroWind (MIT) | MIT |

Manifests live in `shared/source-templates-studio-*.json`; the loader in `shared/source-templates.mjs` lists studio editions first. Photography comes from a small pool of Unsplash images vendored with Dante and AstroWind, so a few photographs appear in more than one edition; each edition documents its own image sources.

## Publisher library (CloudCannon)

The **Publisher library** tab holds CloudCannon's MIT template line, imported whole rather than adapted one at a time. It follows the Start Bootstrap and HTML5 UP pattern: upstream source vendored under `vendor/templates/cloudcannon-*/` with its LICENSE, the built static site under `public/templates/cloudcannon-*/`, one manifest at `shared/source-templates-cloudcannon.json`, and a single spec, `tests/browser/cloudcannon-collection.spec.ts`, covering the collection as a whole.

Ten templates, each pinned to a commit recorded in its manifest entry and its `SOURCE.json`:

| Template | Stack | Pages | What it is |
| --- | --- | --- | --- |
| Jetstream | Astro 6, MDX, Pagefind | 30 | Infrastructure product site: floating navigation, dark dashboard hero, tabbed case studies, pricing, team grid, blog with tag archives, local search |
| Sendit | Astro 5, React islands, Tailwind 4 | 25 | Email tool site whose accent colours come from `data/theme.json`; login and signup pages, counter strip, blog with tag archives |
| Hydra | Jekyll 4 | 15 | Blue product marketing site: three tier pricing with a FAQ, staff page, blog with category archives |
| Urban | Jekyll 4 | 18 | Dark agency site cut by diagonal section edges, with a portfolio collection |
| Frisco | Jekyll 3 | 16 | Full-bleed dark header band on every page, with a device panel row |
| Justice | Jekyll 4 | 12 | Serif professional practice site with a services page and a terms page |
| Treat | Jekyll 4 | 9 | Recipe journal with a persistent author sidebar |
| Edition | Jekyll 3 | 13 | Documentation site with a sidebar tree, bundled Lunr search and a changelog |
| Cause | Jekyll 3 | 5 | Single page campaign site with a newsletter box and a donation slot |
| Author | Jekyll 4 | 14 | Long-form book site with a CSS 3D cover, chapter pages and a print stylesheet |

What the import changes, and why:

- **No photography at all.** Every bundled photograph was deleted before vendoring and replaced with placeholder artwork drawn in code (`field`, `portrait`, `logomark`, `streetmap` and `productscreen` marks), sized to the original pixel dimensions so the framework builds are unaffected. The Unsplash Licence allows commercial use but bars redistributing photographs as a standalone collection, and a website builder re-serves template images to third parties at scale. Remote demo images (`source.unsplash.com`, `unsplash.it`, `placehold.it`, `placekitten.com`, `placebear.com`, `fillmurray.com`) went the same way. Each template's `SOURCE.json` lists every remaining image with its origin and licence.
- **Nothing is fetched from a third party.** Google Fonts became self-hosted Fontsource woff2 with their OFL files; CDN jQuery became a vendored copy; Google Analytics, Disqus, Google Maps, Donorbox, Mailchimp, Pinterest, Vimeo, YouTube and a CodePen embed were removed or replaced with a local panel. The import script fails the build if any `src`, `srcset`, `action`, `<link href>` or CSS `url()` still points off-site.
- **Demo content is marked.** Every page carries a footer note saying the names, quotes, prices and figures are illustrative; a named testimonial, an award claim, a population statistic and an "our clients" portfolio row were relabelled as examples. Third-party company logos shown as clients became drawn placeholders.
- **Forms are not connected.** `plotform-static.js` blocks submission and shows a status line instead.
- **Em dashes removed** from visible copy, per the repository rule.

Aperture (the photography portfolio in the same line) was rejected: its entire design is a grid of twenty-four photographs, so it does not survive having them removed.
