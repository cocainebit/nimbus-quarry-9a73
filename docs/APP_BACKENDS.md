# Generated app backends

Published apps now use a real Node/Express service, Better Auth accounts, and PostgreSQL. This is a shared runtime with application-level data isolation, not a separate database/server per generated app.

## Run locally

Requires Node 22.12+ and Docker.

```sh
npm install
npm run setup:local
npm run services:up
npm run dev
```

The setup script creates `.env` with random secrets only when it does not already exist. Existing installations must supply DATABASE_URL, AUTH_SECRET (32+ characters), APP_ORIGIN and email settings; see `.env.example`. Do not replace existing secrets on every startup. PostgreSQL data lives in a named Docker volume. Migrations run before the server starts. Local emails arrive at http://127.0.0.1:8025.

## Build and publish

1. Create or open a project, then open **App backend**.
2. Create an owner account or sign in. This is separate from generated-app member accounts.
3. Click **Save backend project** to upload the current project to PostgreSQL.
4. Create collections such as Tasks, Requests or Applications. Define field keys, labels, types and required values. **Edit schema & rules** adds enum/reference/file fields, bounds, unique/immutable values and enum transitions, with a safety preview before applying changes. Destructive changes are refused.
5. Leave public reads disabled for private member records. Public reads deliberately make all records in that collection available to visitors. Never enable that for sensitive information.
6. Choose a unique site address and click **Publish app**. The app is available at `/sites/<address>/` on this server.
7. Open **Data & account** in the published app. Register/sign in as a member to create, list, edit and delete records. Standard contact sections also submit real messages to the backend.
8. Inspect records and contact messages in the owner's App backend panel. Reopening the panel refreshes its data. Unpublish removes public access without deleting records.

Publishing snapshots the website document. Editing locally does not change the published page until republished. Runtime records remain intact across republishing. Collection changes take effect immediately. Changing the site address invalidates the old address.

## Identity and permissions

- Owner and member sessions use different auth tables and cookies. Neither grants the other role.
- Members currently share a login identity across apps on the same host. Joining each app creates a separate membership; records are isolated by collection/app and owner.
- Private collections return only the current member's records. Public collections return all records but members can modify only their own. Owners can inspect all records through authenticated management routes.
- Unknown fields and forged owner IDs are rejected. The backend assigns ownership from the session, validates types, uses parameterized SQL, and checks record versions to prevent stale overwrites.
- Mutations require the configured browser Origin. Authentication endpoints additionally apply Better Auth's own origin protections. Client IP headers used by authentication are overwritten from the socket/Express IP, not trusted from callers.
- Passwords require 12 characters. Password reset revokes existing sessions. Production requires verification email and HTTPS. Local development allows immediate signup; Mailpit captures reset emails.
- Collection metadata and published page content are public. The builder brief is excluded from public app responses. Database connection details, password hashes, member emails and record ownership IDs are not in public responses.

## Backend API

Builder session: `/api/projects`, `/api/projects/:id`, `/api/projects/:id/backend`, `/api/projects/:id/collections`, `/api/projects/:id/collections/:collectionId/records`, `/api/projects/:id/publish`.

Member/public runtime: `/api/apps/:slug`, `/api/apps/:slug/join`, `/api/apps/:slug/collections/:collectionId/records`, `/api/apps/:slug/collections/:collectionId/records/:recordId`, `/api/apps/:slug/contact`.

Auth: `/api/auth/*` (owners), `/api/member-auth/*` (members). Record reads support `?offset=100` pagination, 100 records per page. Updates and deletes require the current `version`. Server-side AI generation/refinement requires an owner login.

## Validation

`npm run test:backend` creates an isolated temporary PostgreSQL database, exercises real auth/session cookies, two owners and two members, forbidden origins, cross-user/app access, private/public reads, schema validation, optimistic concurrency, contact submission, republishing, password reset/session revocation and unpublishing, then drops only that test database. The local PostgreSQL user needs permission to create test databases. Never point this test at a production account.

`npm run test:e2e` includes a browser flow that configures/publishes an app, registers a member, creates and edits a record, reloads to verify persistence, signs out to verify records disappear, submits contact data, and inspects it as the owner. Browser tests leave test accounts/projects in the local development database and unpublish their app.

## Remaining boundaries

Public hosting is currently out of scope. A real logical backup/restore test verifies database records, memberships, file bytes and recoverable jobs. Future production operation needs HTTPS, external transactional email, trusted reverse-proxy configuration and operational monitoring. The in-process general request limiter is suitable for a single server; distributed hosting requires shared limits.

This release adds functional app starters, AI backend drafts, same-app relationships, safe schema editing, roles, record-event jobs, webhook adapters, and private file storage. See [AI and catalogue](BACKEND_AI.md), [automation and files](AUTOMATION.md), and [Base44 feature gaps](BASE44_GAP_REVIEW.md). It does not generate arbitrary executable backend code, payments or guaranteed appointment availability.

Use **Account & server projects** to sign in and load/autosave account projects. Local browser drafts remain separate; import them explicitly as copies. Concurrent changes produce an error and retain unsaved edits instead of overwriting someone else's version. BackendPanel and autosaving share revision tracking. Archiving hides a project and stops public access while preserving its records.

Static ZIP exports retain their standalone contact server; they do not bundle the managed database/account runtime. Publish locally to use app capabilities. Member identity is shared across apps on this host, with separate per-app memberships and records. This is not a separate physical database per app.
