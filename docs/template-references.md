# Open-source dashboard template references

Reviewed September 16, 2026 using primary repository READMEs through Firecrawl. These are candidates and design references, **not imported Plotform templates**. No code or assets from these three repositories were added in this change.

| Source | Upstream license | Useful patterns and integration assessment |
| --- | --- | --- |
| [Tabler](https://github.com/tabler/tabler) | [MIT for Tabler itself](https://github.com/tabler/tabler/blob/dev/LICENSE); bundled libraries retain separate licenses | Framework-neutral HTML/CSS, optional stylesheets and demo plugins provide a useful reference for dense admin navigation and composed information panels. Plotform would need a React adaptation and bindings to its own collections. The README specifically calls out separate ApexCharts licensing; importing the entire bundled distribution is not equivalent to importing only MIT code. |
| [shadcn-admin](https://github.com/satnaing/shadcn-admin) | [MIT](https://github.com/satnaing/shadcn-admin/blob/main/LICENSE) | Vite/TypeScript, shadcn/Radix/Tailwind components, TanStack Router, modified sidebar/table/dialog controls and RTL handling make this a useful reference for application shells and operational screens. Its README describes Clerk auth as partial; this is not a replacement for Plotform's member isolation, database permissions or durable workflow backend. |
| [TailAdmin Free React](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard) | [MIT for the free version](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard#license) | React/Tailwind sidebar, data visualizations, tables, profile pages, authentication forms and dark mode are useful composition references. The README separates free and Pro offerings: do not count the advertised Pro dashboard set as free imported templates. Existing Plotform backend behavior would still need to be wired into any adopted UI. |

## What Plotform actually contains

The website starter module is original curated content with six distinct directions, section sequences, typography and palettes. Its picker renders the real website components, preserves existing content by default, and requires explicit consent before replacing sections with starter content. The app catalogue uses Plotform's existing runtime collections, account permissions and supported dashboard arrangements; it is not an import of the repositories above.

The separately imported tweakcn/daisyUI **theme data** is documented in [the preset library](PRESET_LIBRARY.md) and [vendor notices](../vendor/README.md). Theme presets change design tokens. They must not be described as complete imported application templates.

Next useful adoption work would select individual MIT components, retain their exact notices, adapt their accessibility/interaction behavior, and connect real collection data and actions. Bulk screenshots or palette swaps alone would not add application functionality.

Local research evidence (ignored by git): `.firecrawl/github.com-tabler-tabler.md`, `.firecrawl/github.com-satnaing-shadcn-admin.md`, `.firecrawl/github.com-TailAdmin-free-react-tailwind-admin-dashboard.md`.

## Actual HTML5 UP source integration

Ten complete HTML5 UP source templates are now vendored under `public/templates/hup-*`: Editorial, Ethereal, Massively, Story, Dimension, Forty, Stellar, Multiverse, Phantom and Paradigm Shift. These retain the original HTML, CSS, JavaScript, images, fonts, README credits and license notices. They are structurally different upstream designs, not Plotform color presets.

The [HTML5 UP catalogue](https://html5up.net/) lists these templates and source download links. The publisher's [license page](https://html5up.net/license) specifies Creative Commons Attribution 3.0, allowing modification and commercial use with design credit. The publisher download endpoint returned HTTP 404 during retrieval, so files were obtained from the [zce/html5up source mirror at commit f32c95cd40e42659857e2318b6deb1f6be43da5d](https://github.com/zce/html5up/tree/f32c95cd40e42659857e2318b6deb1f6be43da5d). Each copied template README explicitly declares CCA 3.0. The mirror is not presented as the original author; HTML5 UP/AJ remains credited.

`shared/source-templates-html5up.json` records each source path, pinned commit, entry point, HTML pages and complete file manifest. Ethereal's mirror folder lacked a separate license file despite the README/HTML declarations; its copy includes the same CC BY 3.0 legal text bundled with Editorial and a provenance note describing that addition. Original template source files were otherwise copied unchanged. Third-party asset credits remain in the original READMEs.

Vendoring the files is the source acquisition step. Template preview, selection, editing and exporting must use these assets to constitute a usable integration; backend behavior is supplied separately by Plotform, not by these static upstream templates.

For offline typography, Plotform subsequently replaced Google Fonts imports in each template's `assets/css/main.css` and `assets/sass/main.scss` with local font CSS. Matching Source Sans Pro, Merriweather, Open Sans, Roboto Slab and Raleway faces come from pinned Fontsource 5.3.0 packages; the requested Latin weights/styles and their full OFL licenses are bundled per template. Package versions are recorded in `assets/fonts/licenses/FONTSOURCE-PROVENANCE.json`. Original Font Awesome 4.7 icon fonts remain, with the upstream README and an OFL notice carrying the original copyright. Each template's `PLOTFORM-PROVENANCE.txt` records these packaging changes. No network font request is required for the supplied Latin character set.
