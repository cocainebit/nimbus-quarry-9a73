# Working in this repo

Plotform (dir `~/site-studio`): a local Relume/Base44-style website and app builder.
Several Claude instances may share this tree, and a Codex CLI session (ttys007)
built most of it and is paused on a usage limit until 2026-09-22 19:34. Keep this
file short; detail belongs in `README.md` and `docs/`.

## Who is working on what

One line each: the paths you write and what you are mid-way through. Update it
when you start, not when you finish. If a path is listed against someone, do not
write it.

| instance | writes | mid-way through |
|---|---|---|
| _(claude: plotform continuation, 2026-09-17)_ | `src/Template*.tsx`, `src/template-typography.ts`, `src/source-template-html.ts`, `src/NativeTemplateEditor.tsx`, `src/SourceTemplateCatalogue.tsx`, `tests/browser/{template-typography,studio-*,contemporary-collection}.spec.ts`, `public/templates/studio-*`, `vendor/templates/studio-*`, this file | took over from Codex on 2026-09-17: typography spec fixed, two stale specs fixed, studio editions cleaned up (em dashes, GPL notice), three new editions added through subagents, docs updated. Next: Base44-parity gaps in docs/BASE44_GAP_REVIEW.md |
| _(achi-a5, claude: shared account + pay per action)_ | `server/auth.mjs`, `server/platform-billing.mjs`, `server/app.mjs` (AI routes), `server/platform.mjs` (publish, charge status), `server/backend-ai.mjs`, `server/design-ai.mjs`, `server/index.mjs` (wiring), `src/AccountForm.tsx`, `src/PaymentPrompt.tsx`, `src/AccountChip.tsx`, `src/backend-api.ts`, `src/App.tsx` (header chip, generate call), `src/{RefinePanel,BackendPanel,AppDesignAI,BackendAI}.tsx` (paid calls), the shared-account block at the end of `src/style.css`, `src/AppWorkspace.tsx` (overview primary action), `tests/platform-billing.test.mjs`, `tests/browser/platform-account.spec.ts`, `README.md` (payment section), `.env.example` | **done, committed e5ea253, plus 244a50d (amount reads USDC) and 82ead8d (overview button created the wrong collection's record, which is why preset-library.spec.ts had never passed).** Pay per action against `~/platform` SPEC v0.2: no balance anywhere, each paid action is its own charge paid on the platform's payment sheet; unpriced SKUs stay free, and nothing is priced yet. The charge routes it calls exist in SPEC v0.2 only, so paying end to end waits on the platform side |
| _(claude subagent A: studio-practice)_ | `public/templates/studio-practice/**`, `vendor/templates/studio-practice/**`, `shared/source-templates-studio-practice.json`, `tests/browser/studio-practice.spec.ts`, one import + spread line in `shared/source-templates.mjs` | **done, committed 029a4d8 (Lintel).** |
| _(claude subagent B: studio-retreat)_ | `public/templates/studio-retreat/**`, `vendor/templates/studio-retreat/**`, `shared/source-templates-studio-retreat.json`, `tests/browser/studio-retreat.spec.ts`, one import + spread line in `shared/source-templates.mjs` | **done, committed 0aafb0d (Strand).** |
| _(claude subagent C: studio-launch)_ | `public/templates/studio-launch/**`, `vendor/templates/studio-launch/**`, `shared/source-templates-studio-launch.json`, `tests/browser/studio-launch.spec.ts`, one import + spread line in `shared/source-templates.mjs` | **done, committed 0e5a8ee (Apogee).** |
| _(codex, paused)_ | everything, historically | stopped mid-typography on 2026-09-17 02:55. If resumed after the limit resets, it auto-continues its goal: read `git log` first |

## Rules

**Running services belong to the Codex session.** Vite :5173 and the API :3001
(`node --watch`) run from this tree, plus Docker Postgres :55432 and Mailpit
:1025/:8025. Playwright reuses :5173. Do not kill or restart them by pattern; kill
by PID only after checking what the PID is.

**If account flows fail with "The server did not respond (500)", check :3001 first.** `node --watch` does not restart a crashed server child until a file changes; `touch server/index.mjs` restarts it without editing anything. Editing `shared/*.mjs` or `server/*.mjs` while browser specs run restarts the API mid-test and fails them.

**`.env` holds real local secrets** (DB password, auth secret, maybe provider keys).
It is gitignored. Never print it or commit it.

**No invented numbers or em dashes in UI copy.** User rules across all projects.

**Commit your own work before going idle.** The repo had zero commits until the
baseline on 2026-09-17; keep it that way no longer.
