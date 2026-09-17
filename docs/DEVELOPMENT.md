# Development map

- `shared/schema.mjs`: versioned project, page, section and item contract. Used by import, save, export and model output validation. Also resolves page destinations and export names.
- `src/model.ts`: model types, initial data and section defaults.
- `src/blocks.tsx` + `src/site.css`: actual website components, shared between canvas, preview, Puck and exported HTML.
- `src/SectionFields.tsx`: item editors, image upload, page-aware link fields and section library.
- `src/Editor.tsx`: workspace views, page properties, structural edits and undo/redo.
- `src/PageDesigner.tsx`: Puck configuration and visual editor save boundary.
- `src/RefinePanel.tsx`: targeted model requests and review/apply flow.
- `src/storage.ts`: serialized IndexedDB saves, v1 storage migration, and save status.
- `src/export.tsx`: HTML/asset/document export. `src/export-runtime/`: runnable server and progressive contact handling shipped inside the ZIP.
- `server/app.mjs`: model integration, generation and scoped refinement. `server/index.mjs`: local entrypoint.

To add a component: add its kind to the shared schema; define defaults/label in model.ts; render it in blocks.tsx; style it in site.css; and expose its structured fields in SectionFields/PageDesigner. The renderer is not a freeform code-execution environment.

## Deliberate boundaries

Authenticated dashboard loading/autosave, local draft imports, shared revision tracking and archival are implemented. See APP_BACKENDS.md. UI drafts may temporarily contain invalid URLs/metadata while typing; saves and exports validate them, and retain the previous valid persisted snapshot on failure. Uploads live in the document, making backups portable but large. Image editing/cropping, schema migration history beyond v1→v2, saved revisions, and React-source export are future work.

- `server/platform.mjs`: project ownership, publishing, collection validation, per-member record permissions and contact submissions.
- `server/auth.mjs`, `server/db.mjs`: separate owner/member auth namespaces, PostgreSQL connections and startup migrations.
- `src/BackendPanel.tsx`, `src/PublishedApp.tsx`: owner management and the published account/data UI.

- `shared/backend-schema.mjs`, `server/backend-data.mjs`: declarative data model, relationship integrity and safe schema migrations.
- `server/backend-ai.mjs`: signed, reviewable backend drafts and atomic apply.
- `shared/app-catalog.mjs`, `server/app-catalog.mjs`: complete app starter definitions and installation.
- `src/AppWorkspace.tsx`, `src/AppLayoutSettings.tsx`: operational app screens and their builder configuration.
- `src/cloud-projects.ts`: serialized account-bound project saving and revision snapshots.
- `server/automation.mjs`, `server/files.mjs`: persistent jobs, private notifications/webhooks and file storage.
