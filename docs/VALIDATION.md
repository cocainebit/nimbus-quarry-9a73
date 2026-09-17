# Validation

Updated 2026-09-16 (America/Montevideo).

## 2026-09-17 re-baseline

After the Codex session stopped on 2026-09-17 02:55, the tree was committed as-is and re-verified against the running dev server: 40 Node tests pass, `tsc -b` passes, and the full Chromium suite passed 27 of 29. The two failures were stale locators from the last-minute catalogue change (studio editions became the default tab) and were fixed: the typography spec now waits for the phone preview to resize before measuring, and the React template spec opens the contemporary tab before searching. `backend.spec.ts` failed once inside the full run and passed alone, so it is a suite-order flake rather than a product regression; it is still open. Running the browser suite rewrites the `docs/*.png` captures, which is expected.

## Automated checks

- TypeScript and production Vite build pass. The main editor bundle remains large (~1 MB minified); production performance work remains.
- 11 Node tests cover brief/document constraints, legacy-document migration, safe URLs/images, export filename collisions, API generation, section refinement scope, malformed model output and unavailable providers. API tests exercise local HTTP endpoints with controlled model responses; they do not establish real LLM quality.
- 7 Chromium browser tests cover the original create/edit/save/preview/export flow; absent-AI messaging; 390px dashboard overflow; detailed site development and a runnable export; targeted AI draft review; and section reuse with undo/redo and persistence.

## Exported website test

The test creates a Home/Pricing/Contact project, uploads an image, links a button to Pricing, renames its URL to `plans.html`, edits price/benefits and metadata, and adds a Team section. It then downloads the ZIP, checks bundled images and HTML, starts the exported Node server in a temporary directory and opens the actual website.

It follows the page link, expands an FAQ, submits a real inquiry, and verifies the message in the private on-disk submissions file. Requests for that file and the project backup return 404; invalid form data is rejected. Finally it imports the exported project back into Plotform and checks the developed sections are present.

## Visual captures

- [Dashboard](dashboard.png)
- [Sitemap](sitemap.png)
- [Wireframes](wireframes.png)
- [Visual editor](visual-editor.png)
- [Mobile dashboard](mobile-dashboard.png)
- [Exported contact page after a successful submission](exported-contact.png)

## Remaining limits

No actual model is installed/configured, so real generation quality and latency have not been tested. No public deployment, external email delivery, automatic cloud draft sync, collaboration, cross-browser coverage, comprehensive accessibility audit, load testing or full anti-spam protection. The workspace remains desktop-first; the exported websites use responsive layouts. Full Relume/Base44 parity is not claimed.

## Generated app backend validation

The real PostgreSQL integration test passes, covering owner/member registration, independent sessions, private/public collections, two-user and cross-app isolation, invalid field/ownership rejection, concurrent update versions, contact submissions, republishing without data loss, password reset and session revocation, and unpublishing. It uses an isolated temporary database; inference is not involved.

The additional Chromium test passes against the live local backend: configure a collection in the builder, publish, register a member in a separate browser context, create/edit a record, reload and retain it, sign out and lose private visibility, navigate to Contact and submit a real message, inspect records/messages as the owner, and unpublish. Screenshots: [generated app data screen](generated-app-backend.png), [backend management](backend-management.png).

All 11 unit/API tests, the PostgreSQL integration test, all 7 browser tests, and the production build passed after these changes. Database/account runtime capabilities are delivered through Publish app; static ZIP export does not include them.

## App-builder expansion: final integrated checks

Latest run: **19 unit/API tests, 8 backend integration/security/recovery tests, 9 Chromium browser tests, TypeScript and Vite production build all pass**. This supersedes counts in earlier milestone sections.

New coverage includes AI draft signature/tamper/expiry/stale-state rejection; atomic catalogue install and clean graph duplication; relationship integrity; schema migration refusal; unique/immutable/transition rules; role isolation; concurrent writes; server workspace autosaving and account isolation; conflict draft preservation; durable job claims/retries/lease recovery; file ownership/MIME/size/reference checks; and actual PostgreSQL dump/restore.

The expanded catalogue browser flow installs Client space, publishes locally, signs in as a member, creates a project and linked request, changes status on its board, reloads, searches the table, uploads a private file, creates a related document, downloads authenticated bytes, receives a real worker notification, and checks the 390px overview for horizontal overflow. Screenshots: [catalogue](app-catalogue.png), [portal overview](client-portal-overview.png), [portal table](client-portal-working.png).

The provider calls used by AI tests remain mocked. External webhooks use injected test transport; no external messages were sent. Local DB recovery does not establish hosted disaster recovery. BetterAuth can log initial schema warnings before migrations create tables in empty isolated test databases; tests verify the migrated behavior. The editor bundle remains over 1 MB and still produces Vite's chunk-size warning.

## Design and backend development expansion

2026-09-16: production build, 24 unit/API tests and 13 PostgreSQL integration/security/recovery tests pass. New validation covers constrained theme/widget definitions, design proposals against existing collection bindings, rejected malformed AI output, and read-only preview behavior. Provider responses are controlled fixtures; actual model quality remains unverified.

Backend additions cover full-dataset queries and summaries with private/editor/public scopes; typed filters and injection rejection; revision restoration and stale revision conflicts; cloned dashboard bindings; ordered conditional workflow actions; durable step retries; schedule concurrency and restart deduplication; and archived-project pause/resume. See [design studio](DESIGN_STUDIO.md), [data services](DATA_SERVICES.md), and [workflows](AUTOMATION.md).

The earlier claim that automatic account draft sync is absent is superseded: server workspace autosaving now exists. Hosting and external delivery validation remain out of scope.

The browser suite uses one worker and a separate rate-limit window for each account-heavy flow. This keeps real authentication/API protections enabled while preventing unrelated tests on the same loopback IP from consuming one another's limits. A full run takes several minutes. Backend test cleanup uses graceful temporary-database drops to avoid racing client socket shutdown.

Final integrated result: **24 unit/API tests, 13 PostgreSQL integration/security/recovery tests, all 10 Chromium browser tests, and the production build pass.** The catalogue test publishes the Editorial preset and checks its real CSS tokens, typography, top navigation, custom heading and a dashboard count after creating a record. The new history test restores through the owner UI, reloads the project, and verifies an existing member record is unchanged. Visual evidence: [design studio](design-studio.png), [published portal](client-portal-overview.png).

## Expanded third-party preset library

28 unit/API tests, 13 PostgreSQL tests and the production build pass after adding 81 theme families/123 variants. Every preset parses through the app schema; tests assert unique IDs/palettes, readable main text on both surfaces, primary-button foreground contrast, safe typography/layout enums, bounded auto-widget connections and preservation of operational bindings across every theme.

Theme datasets are pinned, licensed local inputs (see vendor/README.md). The importer uses Chromium to normalize CSS colors; application runtime never fetches a theme service. Six web-font families ship locally. Four layout structures remain independently selectable; 123 presets do not imply 123 different screen structures.

The new preset-library browser test passes: it filters the actual 123-preset catalogue, applies daisyUI Dracula, selects Manrope/Playfair and split layout, auto-connects dashboard widgets, publishes, checks dark authentication/record forms and button contrast, creates a project and linked request, then applies Editorial and republishes with schemas/widgets/records preserved. Dark runtime also passes the 390px horizontal-overflow check. Screenshots: [preset catalogue](preset-library.png), [dark operational app](dark-app.png).

The existing catalogue browser regression also passes with the new gallery and explicit navigation selection. Final checks for this iteration: 28 unit/API tests, 13 PostgreSQL tests, 2 targeted browser flows and production build. The previous full browser-suite run is recorded above; this iteration reran the two affected app-design flows.

## Plotform structural layout expansion

The product is now branded **Plotform**. Existing storage/account identifiers and the repository path stay compatible.

32 unit/API tests and 13 PostgreSQL integration tests pass. The new responsive browser matrix passes all 32 production overview layouts at 1600, 1100, 768, 390 and 320px (160 layout/viewport combinations) with expected container grids, all content slots present, no overlapping slots and no page-level horizontal overflow. This matrix uses HTTP data fixtures; the separate published-app browser flow uses real PostgreSQL and verifies new-layout selection, account forms, record creation, relationships and preservation through theme changes. The production build passes (the existing editor bundle-size warning remains).

See [responsive layout library](LAYOUT_LIBRARY.md), [layout picker](layout-library.png), and [journal arrangement](layout-journal.png).

The published-app flow additionally verifies actual 1440/1024/390px canvas widths and each device's expected grid areas, then returns to desktop before publishing. All three device preview controls pass.
