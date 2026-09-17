# Functional app-builder review

Reviewed official Base44 sources on 2026-09-16. This is a feature comparison, not a claim of compatibility or parity. Public hosting is excluded from the current work at the user's request.

## What the reference product establishes

Base44's [template marketplace](https://base44.com/templates) offers categorized, cloneable apps, including CRM, productivity and other business use cases. A useful catalogue therefore needs to install functioning app structures, rather than simply swap a marketing hero.

Its [backend automations documentation](https://docs.base44.com/developers/backend/resources/backend-functions/automations) describes scheduled, database-event and connector-webhook triggers. The [app-editor documentation](https://docs.base44.com/Building-your-app/Creating-automations) says workflows are replacing automations. Our event jobs cover only part of that scope.

Its [built-in integrations](https://docs.base44.com/Integrations/built-in-integrations) cover email, media generation, files, extraction and model calls. Its [shared connectors](https://docs.base44.com/developers/backend/resources/connectors/shared-connectors) support app-wide external accounts. Our webhook adapter is a smaller integration surface, not an equivalent connector library.

## Current local implementation

| Area | Working now | Material remaining work |
| --- | --- | --- |
| Catalogue | Client portal, sales CRM and project tracker; transactional installation of related collections; clean duplication | Larger curated library, community publishing/import, marketplace |
| Frontend | Designed app shell, overview counts, cards, tables, status boards, search, record dialogs, files/activity, mobile layouts | Freeform app component generation, charts/report builders, fine-grained layout composition |
| Customization | Workspace title/description, styles, navigation order/labels, table/card/board layouts, binding collection screens | Arbitrary React editing and roundtrip code import/export |
| AI backend | Review/apply drafts for collections, references, permissions and validated field rules; stale-draft/ownership checks | Live model quality evaluation, automatic app UI composition, multi-step workflow generation |
| Data model | Typed fields, enum transitions, same-app relations, uniqueness, immutable values, safe preview/apply changes | Destructive migrations with explicit transforms, many-to-many relations, cascading actions, full query/report language |
| Accounts/roles | Separate builder/member identities, app memberships, member/editor/admin, explicit collection sharing | Custom role hierarchy, invitations, separate identity namespace per app, OAuth/SSO |
| Workflows | Record-event jobs, private notifications, HTTPS webhooks, retry/lease recovery and owner job inspection | Schedules, condition/action graphs, approval flows, OAuth connectors |
| Files | Private DB-backed uploads, MIME/size/quota checks, safe reference deletion, authenticated download | Object storage, malware scanning, transformations, large multipart uploads |
| Workspace | Account-based dashboard loading/autosave, explicit local imports, conflict-preserving saves, archive | Realtime collaboration, version browsing/restore UI, offline server-draft queue |
| Reliability | Real PostgreSQL isolation/concurrency tests, logical backup/restore, worker recovery, browser app workflow tests | Load/chaos tests, broader accessibility/cross-browser checks, external integration verification |

## What the new client portal actually does

Installing Client space creates Projects, Requests and Documents, with real relationships. A member registers, creates a project, submits a request linked to it, changes request status on its board, searches its table, uploads a private document, and attaches it to a request. An owner can assign editors, inspect records, change schemas safely, and configure event notifications. Values and counts come from the database; fresh installations have no fabricated operational data.

The catalogue cards contain explicitly illustrative design previews. Published apps start empty and explain how to create the first record. The original marketing website templates are retained separately.

## Explicit non-goals of this milestone

No public deployment. No live payment processing, guaranteed appointment availability, arbitrary code execution, external email/calendar sync or autonomous external actions. No fabricated live AI test: provider responses are mocked in automated generation tests until a local model or hosted credentials are configured. Exported static ZIPs do not contain the full shared managed app runtime.

## Further implementation: design and backend development

The app renderer now shares validated semantic design tokens with its preview: four presets, editable colors/type/radius/density, sidebar or top navigation, configurable count/sum/group/recent widgets, and screen-column visibility. A new AI design preview accepts the existing schema and a prompt, validates the proposed bindings, and requires applying the reviewed draft before changing the project. Actual inference quality is not established by mocked provider tests.

Queries now search/sort/page the full authorized collection; summaries run on that same permission scope. Relationships support server lookup. Workflows now support conditions, ordered actions, validated record updates, durable step checkpoints and persistent schedules. Owner project history can restore interface documents without rolling back live app records or schemas.

These additions do not supply arbitrary React/backend code generation, a visual workflow DAG, calendar cron scheduling, payments/OAuth connectors, real-time collaboration or a large third-party template marketplace. Public hosting remains outside this iteration.
