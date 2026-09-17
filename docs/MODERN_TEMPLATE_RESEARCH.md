# Template source review, 17 September 2026

The user's actual benchmark is https://www.jackandjill.ai/, https://www.littleplains.com/, and https://romemichal.pl/: art direction, typography, distinctive composition, and deliberate motion. A modern framework or a recently updated dependency does not establish that design quality. Do not label the following research candidates as installed, production ready, or equal to those benchmarks without actual integration and visual acceptance.

## Primary-source candidates

| Source | License verified in upstream | Design / actual scope | Build and integration |
| --- | --- | --- | --- |
| [Tailark](https://github.com/tailark/blocks), [demo](https://tailark.com/) | MIT | Contemporary marketing **blocks**, not 20 complete templates. Current OSS namespace is `oss-tailark.com`. | React / shadcn registry, `pnpm install`, `pnpm dev`; compose into an actual complete site. |
| [Launch UI](https://github.com/launch-ui/launch-ui), [preview](https://launchuicomponents.com/preview) | MIT for public repository | Polished technical/product presentation. Free repo is component collection; Pro bento/features/testimonials are separate. | Next.js 16, React 19, Tailwind 4; public source supports `npm install`, `npm run dev`. Static export needs verification. |
| [ScrewFast](https://github.com/mearashadowfax/ScrewFast), [demo](https://screwfast.uk/) | MIT | Complete hardware / industrial site with product catalogue, blog, services, docs. More useful and differentiated than another generic SaaS landing page. | Astro; Node 22 and pnpm 9+. `pnpm build` produces `dist/`. Source README documents content schemas and page sections. |
| [AstroWind](https://github.com/arthelokyo/astrowind), [demo](https://astrowind.vercel.app/) | MIT | Composable business site, broad component coverage. `onwidget/astrowind` currently redirects here. | Astro 7 / Tailwind 4; Node >=22.22.3; static build. Distinct page variants must not be counted as unrelated original designs. |
| [Fuwari](https://github.com/saicaca/fuwari), [demo](https://fuwari.vercel.app/) | MIT | Illustrated journal with sidebar, banner, search, themes and transitions. | Astro, pnpm, Pagefind. Retain source and check demo illustration rights separately. |
| [DevPortfolio](https://github.com/RyanFitzgerald/devportfolio), [demo](https://ryanfitzgerald.github.io/devportfolio/) | MIT | Rebuilt developer resume / portfolio; configurable projects and experience. | Astro / Tailwind 4. `src/config.ts` contains editable content. |
| [Dante](https://github.com/JustGoodUI/dante-astro-theme), [demo](https://dante-astro-theme.netlify.app/) | GPL-3.0 | Editorial portfolio and single-author blog. README explicitly says demo copy was generated with ChatGPT. | Astro, Node >=22.12; `npm run build` produces `dist/`. Keep full corresponding source and GPL for separately distributed template. |
| [Astroship](https://github.com/surjithctly/astroship), [demo](https://astroship.web3templates.com/) | Repository GPL-3.0; README comparison table inconsistently says GPL-2.0 | Standard startup site; **not** the separately sold Pro edition. | Astro static build. Resolve exact pinned LICENSE before distributing. |
| [Astrofy](https://github.com/manuelernestog/astrofy), [demo](https://astrofy-template.netlify.app/) | MIT | Sidebar CV, blog, portfolio and externally linked storefront. | Astro / Tailwind / DaisyUI, pnpm. Store cards are not a checkout backend. |
| [Astro Nano](https://github.com/markhorn-dev/astro-nano), [demo](https://astro-nano-demo.vercel.app/) | MIT | Deliberately understated personal editorial site. Actual live screenshot inspected; too plain to lead a catalogue matching the user's supplied references. | Astro; `npm run build` produces `dist/`. |
| [Neobrutalism components](https://github.com/ekmas/neobrutalism-components), [demo](https://www.neobrutalism.dev/) | MIT | A genuinely different graphic language, but a component system rather than a complete app. | React / shadcn / Tailwind. Useful for purpose-built composition, not template-count padding. |
| [Ladvace bento portfolio](https://github.com/Ladvace/astro-bento-portfolio), [demo](https://gianmarcocavallo.com/) | MIT | Bento, 3D globe, motion experiments, guestbook. Stronger interaction character. | Current version is Astro SSR with Solid/Svelte, UnoCSS and Turso. Static conversion must explicitly remove guestbook/API routes or connect a real backend. Upstream documents their removal. |

## Rejected after live visual inspection

Four fully licensed source candidates were cloned, pinned and dependencies downloaded, then moved out of the app to `/private/tmp/plotform-rejected-template-candidates`. They are **not** registered or promoted in the catalogue. Keeping them would repeat the mistake of filling a numerical target with weak fits.

| Source | Pinned commit | Decision |
| --- | --- | --- |
| [Apple-style portfolio](https://github.com/larry-xue/apple-style-portfolio) | `2e85e0481152403b0a2fcfddf0c732f10c462a59` | Live hero is a centered profile and floating spheres. Current stack and GSAP do not make it a match for the supplied references. |
| [Quiet Bar](https://github.com/larry-xue/quiet-bar) | `50e9154107357f6b5f7143101ed2e5134111d405` | Distinct textured gold/black hospitality direction, but conventional rather than the editorial reference standard. |
| [Sassify](https://github.com/larry-xue/astro-sassify-template) | `c09f9d39eaeea7462e4a4e4d03d0e7f1f042f051` | Bright split hero with cartoon illustration; conventional SaaS composition. |
| [Zen Blog](https://github.com/larry-xue/astro-zen-blog) | `b5efcbf36693acfa8c31623f67bb166bb453d522` | Plain article-card list; no distinctive art direction. |

## Licensing and provenance exclusions

- [Cruip Open](https://github.com/cruip/open-react-template) says GPL but also explicitly asks users not to republish, redistribute, or resell the template. Excluded from a redistributed template catalogue until terms are resolved; “free” is insufficient.
- [ITom WebGL portfolio](https://github.com/ITomPoland/portfolio-itom) licenses code MIT but explicitly withholds permission to reuse personal assets, textures, images and copy. The compelling complete visual cannot simply be vendored as our own template.
- [Elastic Grid Scroll](https://github.com/codrops/ElasticGridScroll) is MIT and genuinely motion-led, but its demo images are Midjourney-generated according to its credits. It is also an interaction demo, not a complete website.
- [Kinetic Type Page Transition](https://github.com/codrops/KineticTypePageTransition) is MIT with Unsplash imagery and has useful editorial interaction ideas. The visual concept originated in 2021 despite a 2025 repository update. Do not misstate its design age or count it as a complete contemporary business site.
- Lexington's current complete catalogue is commercial; a public demo is not permission to redistribute its template. A guessed `lexingtonthemes/eracle` repository was not confirmed as a usable source.

## Evidence

Primary repository pages are saved under `.firecrawl/modern-*.md`, plus `.firecrawl/tailark-repo.md` and `.firecrawl/launch-ui-repo.md`. Live screenshots and markdown were saved for ScrewFast, Launch UI, Nano, Apple-style Portfolio, Quiet Bar, Sassify and Zen under `.firecrawl/modern-*-live.{json,png}`. Repo claims such as Lighthouse scores, accessibility conformance or production reliability were not independently verified and must not be repeated as Plotform test results.

The concrete acceptance gate should be: recognizably distinct art direction, desktop/mobile screenshots of actual rendered source, preserved motion and navigation, direct content editing, locally available assets with clear provenance, complete source export, and no implication that a visual contact form or account screen supplies a backend by itself.

## Reference analysis and the retained motion foundation

The supplied reference screenshots were inspected locally. Jack & Jill pairs restrained serif headlines with a tightly controlled product grid, large whitespace, human photography and evidence integrated into the composition. Rome Michal uses oversized sans typography, dramatic negative space, editorial two-column case studies and a large typographic footer. Neither standard framework defaults nor an animated generic hero reproduce that art direction. Little Plains remains part of the reference set; this researcher did not independently inspect its full interaction behavior.

One existing-source foundation was retained as a separate **motion** collection, not counted as a new complete business template:

- **Kinetic Editorial**: [Codrops Kinetic Type Page Transition](https://github.com/codrops/KineticTypePageTransition), pinned `ebe926e2f1de42950c36ff8a678321155280c1af`. Original design year: **2021**, explicitly recorded. Its staggered image-led editorial stories and full-screen rotating type transition provide a genuinely different composition. This is a typography/motion foundation; it does not match the references wholesale or supply application functionality.
- Source: `vendor/templates/motion-kinetic-type`; static build: `public/templates/motion-kinetic-type`; manifest: `shared/source-templates-modern-other.json`. The public bundle includes full corresponding `template-source.zip`, MIT license, source pin, dependency notices and adaptation notes.
- Changes: replaced Adobe Typekit with locally bundled OFL Inter and Playfair Display; keyboard activation, meaningful back-control label and focus restoration; transitions honor reduced-motion preference; actual original imagery and layout are retained.
- **GSAP is not MIT.** Its [current Standard License](https://gsap.com/standard-license/) permits implementation in websites/apps but restricts competing visual animation builders. This foundation has fixed authored motion and content editing, not a visual animation editor. Future animation-authoring controls require a fresh dependency/license decision. Full fetched license text is included in the bundle.
- Production Parcel build completed. Local desktop and 390px rendering was inspected; document width equaled viewport width and no browser runtime errors occurred. Keyboard and reduced-motion checks are recorded by the implementation agent separately.
