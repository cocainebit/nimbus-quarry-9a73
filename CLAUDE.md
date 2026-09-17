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
| _(claude: plotform continuation, 2026-09-17)_ | `src/Template*.tsx`, `src/template-typography.ts`, `src/source-template-html.ts`, `src/NativeTemplateEditor.tsx`, `src/SourceTemplateCatalogue.tsx`, `tests/browser/{template-typography,studio-*,contemporary-collection}.spec.ts`, `public/templates/studio-*`, `vendor/templates/studio-*`, this file | taking over from Codex: fixing the typography controls (spec failed 02:51, never re-run), re-verifying the studio templates, then continuing the template-quality and Base44-parity goal |
| _(claude subagent A: studio-practice)_ | `public/templates/studio-practice/**`, `vendor/templates/studio-practice/**`, `shared/source-templates-studio-practice.json`, `tests/browser/studio-practice.spec.ts`, one import + spread line in `shared/source-templates.mjs` | new studio edition: architecture and interiors practice |
| _(claude subagent B: studio-retreat)_ | `public/templates/studio-retreat/**`, `vendor/templates/studio-retreat/**`, `shared/source-templates-studio-retreat.json`, `tests/browser/studio-retreat.spec.ts`, one import + spread line in `shared/source-templates.mjs` | new studio edition: image-led hospitality place |
| _(claude subagent C: studio-launch)_ | `public/templates/studio-launch/**`, `vendor/templates/studio-launch/**`, `shared/source-templates-studio-launch.json`, `tests/browser/studio-launch.spec.ts`, one import + spread line in `shared/source-templates.mjs` | new studio edition: dark product launch |
| _(codex, paused)_ | everything, historically | stopped mid-typography on 2026-09-17 02:55. If resumed after the limit resets, it auto-continues its goal: read `git log` first |

## Rules

**Running services belong to the Codex session.** Vite :5173 and the API :3001
(`node --watch`) run from this tree, plus Docker Postgres :55432 and Mailpit
:1025/:8025. Playwright reuses :5173. Do not kill or restart them by pattern; kill
by PID only after checking what the PID is.

**`.env` holds real local secrets** (DB password, auth secret, maybe provider keys).
It is gitignored. Never print it or commit it.

**No invented numbers or em dashes in UI copy.** User rules across all projects.

**Commit your own work before going idle.** The repo had zero commits until the
baseline on 2026-09-17; keep it that way no longer.
