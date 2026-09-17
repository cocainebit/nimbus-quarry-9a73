# Original source template collection

Plotform imports original HTML, CSS, JavaScript and assets rather than reconstructing these designs with generated block layouts. The source catalogue is distinct from Plotform's functional app starters and its palette library.

The default contemporary collection now imports original Astro and React designs; simpler developer designs and motion experiments have separate tabs. See [the benchmark](DESIGN_REFERENCES.md) and [source review](MODERN_TEMPLATE_RESEARCH.md). These are stronger foundations, not a claim that20 free templates match the user’s bespoke references.

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

Editions as of 2026-09-17: Commonplace (product site, adapted from Launch UI), Atelier (design practice, adapted from Dante, GPL-3.0) and Independent (portfolio, adapted from Dillion Portfolio and Launch UI). Manifests live in `shared/source-templates-studio-*.json`; the loader in `shared/source-templates.mjs` lists studio editions first.
