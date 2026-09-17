# Prompt-to-backend drafts

In **App backend → Generate a backend**, describe collections, relationships, field rules, and privacy requirements. Preview calls the configured Ollama, Venice, or Chutes provider; it does not write data. Review every collection, public-access choice, and unsupported request before applying.

Supported generated behavior: required fields, text/number bounds, enum options and allowed transitions, uniqueness, immutable fields, file references, same-app record relationships, public reading, member creation, and editor access. Existing collection definitions are supplied to the model for reference. Generated drafts add collections; modifying existing schemas uses the dedicated schema preview flow.

Limits are shown with every preview. Payments, availability/booking logic, external integration configuration, scheduled actions, arbitrary JavaScript/SQL, and automatic frontend binding are not generated. Requested unsupported capabilities are returned separately. Existing integrations and background job configuration are independent features. AI output can be wrong: the schema validator guarantees the supported structure, not that a model understood every requirement.

Routes (builder session, project ownership, and normal origin protections required):

- `POST /api/projects/:id/backend-ai/preview` with `{prompt}` → `{plan,limits,token}`.
- `POST /api/projects/:id/backend-ai/apply` with `{token}` → `{collections}`.

Drafts are HMAC signed, bound to project and owner, expire after 30 minutes, and carry an existing-schema fingerprint. Applying rechecks ownership and fingerprint under a project transaction lock. Relations are resolved from draft keys to real IDs; cycles and nonexistent/cross-app references are rejected. All collection writes commit together or roll back together. Successful nonempty drafts cannot be replayed because they change the schema fingerprint. Without a configured secret, signatures use a process-local random key and drafts expire on restart.

Validation: `node --test tests/backend-ai.test.mjs` covers strict parsing/adversarial fields, references/cycles, signing/expiration, owner/schema changes, transactional rollback orchestration, and a real HTTP preview with a mocked provider. Live model quality requires a configured provider; these tests do not prove inference quality.

## Functional app catalogue

**Starter templates → The app collection** provides three prebuilt applications without requiring AI inference. Sign into a builder account, select **Use this app**, then open **App backend** and publish locally.

- **Client space:** projects, project-linked requests with a status board, request-linked document uploads.
- **Pipeline:** contacts and contact-linked sales opportunities.
- **Momentum:** projects and related tasks with priorities and due dates.

Installation creates a server project and all required collections in one database transaction, including navigation configured with the actual collection IDs. Apps start with empty databases. Catalogue design previews show illustrative data only. Member records are private by default; designated editors can access shared app records. Schema permissions and fields remain editable through App backend.

The catalogue is not arbitrary app generation. Payments, invoicing, automatic email sync, advanced scheduling, and dependency solving are not part of these starter definitions. The runtime supplies operational overview screens, record forms, cards/boards/tables, search, relationships, account access, and private file storage.

Duplicating an app from the dashboard copies its design and collection schemas into a new server project, remapping navigation and every relationship to fresh collection IDs. It deliberately starts empty: member accounts/memberships, records, uploaded files, workflow definitions/jobs, and publication settings are not copied. Configure workflows and publish the copy separately. Marketing website duplicates retain their existing local-copy behavior.
