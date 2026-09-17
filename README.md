# Plotform

A local website and app builder built with React, TypeScript, React Flow, Puck and PostgreSQL. Build marketing sites or install functional client portal, CRM and project-tracker starters with designed screens connected to real accounts, records, files and workflows.

## Start

```sh
npm install
npm run setup:local
npm run services:up
npm run dev
```

Open http://127.0.0.1:5173. The development app and API bind to loopback. Node 22.12+ recommended. The API reloads when its source changes. `npm run build` type-checks and builds the frontend; `npm run preview` serves only that frontend, not the generation API.

## Build a functional app

1. Open **Account & server projects**, sign in, then open **Starter templates**.
2. Choose from **11 functional app starters**, including Client space, Studio room, Proof desk, Resolve, and First steps. Installation creates the project and linked database collections.
3. The Design view shows the app interface. **App layout** offers 123 searchable design presets from 81 theme families, theme tokens, navigation, visible columns and database-backed dashboard widgets. **Develop app design** previews a model-generated design before applying it. See [design studio](docs/DESIGN_STUDIO.md) , [preset library](docs/PRESET_LIBRARY.md), and [32 responsive layouts](docs/LAYOUT_LIBRARY.md).
4. **App backend** provides schema editing, member roles, AI backend drafts, conditional multi-step workflows, scheduled jobs, project version inspection/restoration and local publishing. See [workflows](docs/AUTOMATION.md) and [queries/history](docs/DATA_SERVICES.md).
5. Publish locally and open the app. Members can create related records, use tables/status boards/search, upload documents and receive workflow notifications.

These are working starters, not full Base44 parity. See [feature review and remaining gaps](docs/BASE44_GAP_REVIEW.md).

## Start from an original source design

**Create a website** opens the contemporary collection, with original Astro and React designs. The earlier20 HTML5 UP/Start Bootstrap templates remain in **Classic archive**. **Motion studies** are labeled separately from complete websites. Browse real screenshots, preview desktop/phone layouts, and choose **Use this design**. The source editor preserves original HTML/CSS/JavaScript and supports text, links, image URLs, custom CSS, responsive previews, interactions, undo, and complete ZIP export. Framework sources and license files are included in the new template exports; original licenses and required design credits remain intact. See [source collection details](docs/SOURCE-TEMPLATES.md), the [design benchmark](docs/DESIGN_REFERENCES.md), and [candidate review](docs/MODERN_TEMPLATE_RESEARCH.md).

These are static website designs. Their demo forms do not automatically acquire a backend; functional app starters remain a separate option.

## Develop a block-based website

1. Choose **Build with editable blocks**, then create a project with a brief. Template mode works without AI and honors comma-separated `Pages: Home, Pricing, Contact`. Page names such as Pricing, Gallery and Team select useful starter sections; templates do not understand arbitrary instructions.
2. Select a page on the sitemap. Edit its content through the inspector, or open Design and click **Edit section** on the section you want to develop.
3. **Add section** opens a library of 12 section types: hero, features, image/text, testimonials, CTA, contact form, pricing, FAQ, gallery, team, statistics and logos.
4. Edit individual items: feature descriptions, pricing plans, FAQ answers, gallery images/captions, team members, quotes and metrics. Choose layout, background tone, spacing, and button labels/destinations. No fabricated metrics or testimonials are supplied as business facts.
5. Upload PNG/JPEG/WebP/GIF images (2 MB per file) or use remote image URLs. Supply descriptive alt text. Uploaded files travel with project backups and exports.
6. Point buttons to a page, section anchor, HTTPS URL, email or phone. Internal page links use stable IDs and resolve to current export filenames. Page URL/search settings control slugs, search titles/descriptions and navigation visibility. The first page is the homepage (`index.html`).
7. Duplicate, reorder, copy, paste, or move sections between pages. Undo and redo work in the current workspace session. The Puck visual editor has its own history and applies edits on **Save changes**.
8. In **Site settings**, configure shared footer/contact details and the live site URL. Review the content checklist for broken links, missing image descriptions and search metadata.
9. Preview the site. FAQ toggles and navigation work; forms in editor preview do not send messages.

## Optional AI generation and targeted development

Generation and targeted refinement support local Ollama, Venice AI, and Chutes (Bittensor Subnet 64). Choose the provider on the server; API keys stay out of the browser. See [provider setup and limitations](docs/model-providers.md). No model is installed or downloaded automatically.

For local inference, run Ollama with an installed model and set `MODEL_PROVIDER=ollama` and `OLLAMA_MODEL` in `.env`. For hosted inference, configure Venice or Chutes as described in the provider guide. Restart `npm run dev` after changing environment variables. The dashboard checks connectivity and model availability.

- **AI generation** creates a structured multi-page document from the brief, including section items and page metadata.
- **Develop page with AI** changes a selected page using the brief and existing content as context.
- **Refine section with AI** limits changes to one section. The API rejects responses that return more than that section.
- Review a proposed draft, then **Apply draft**. Other pages stay unchanged. Changes participate in undo/redo. Uploaded image bytes are not sent to the model; existing uploads are restored when omitted from the returned draft.

The integration is tested with controlled model responses, but real model quality and latency remain unverified: no model is available on this machine. Invalid output and provider errors leave the project unchanged. Manual development and export do not depend on AI.

## Publish an app with accounts and a database

Open **App backend**, sign in as the owner, save the project, create typed collections and publish. The published app has a **Data & account** screen where members can register and manage their own persistent records. Contact messages are stored in PostgreSQL and visible to the owner. See [setup, permissions, API and limitations](docs/APP_BACKENDS.md). The service runs locally; cloud hosting is not deployed yet.

## Export and run the actual website

**Export → Download website (.zip)** produces:

- Standalone HTML for every page with working navigation, page titles and descriptions.
- Shared CSS and a small form-handling script.
- Uploaded images under `assets/` (deduplicated). Remote URLs remain remote.
- `project.json`, which can be imported back into Plotform.
- A dependency-free Node server, package.json, and setup instructions.
- sitemap.xml and robots.txt when the live site URL is configured.

Extract the ZIP and run:

```sh
npm start
```

Open http://127.0.0.1:4174. Contact forms submit to this server and save messages in `data/submissions.jsonl`, which the server does not expose. It also keeps source code and the project backup out of public routes. The server validates input and includes a honeypot, request-size limits, same-origin checks and basic throttling.

Messages are stored on disk, not emailed. Public hosting needs HTTPS and persistent storage; configure HOST/PORT as required. This is a small single-instance contact backend, not a managed hosting, email or anti-spam service. Static-only hosting requires a separate contact backend. Opening HTML files directly works for browsing but cannot receive forms.

The export is an editable HTML/CSS website, not React application source, a database application, or Figma/Webflow assets. Exported code can be developed directly; changes to exported HTML do not synchronize back into the structured project document.

## Saving and portability

Projects and uploads save to IndexedDB in this browser. The header shows Saving/Saved; validation or storage errors are displayed. Existing v1 localStorage projects migrate on load without deleting the original data. Invalid saved data is not silently overwritten. Export backups for important work; browser storage is not server sync, and simultaneous tabs are not a collaboration system.

Use **Import project** on the dashboard to reopen a project JSON. Imports are validated and create a new copy. Published apps now have owner/member accounts and PostgreSQL collections through **App backend**. Local mode saves browser drafts; signed-in server mode loads and autosaves projects to PostgreSQL with optimistic concurrency. See [generated app backends](docs/APP_BACKENDS.md). Project limits: 40 pages, 80 sections per page, 30 items per section; import limit 30 MB.

## Verification

```sh
npm test
npm run test:backend
npm run build
npx playwright install chromium
npm run test:e2e
```

See [validation evidence](docs/VALIDATION.md), [open-source comparison](docs/OPEN_SOURCE_RESEARCH.md) and [design reference](DESIGN.md).
