# Runtime queries and project history

Generated apps can query their complete accessible dataset through:

- `POST /api/apps/:slug/collections/:collectionId/query`
- `POST /api/apps/:slug/collections/:collectionId/summary`

A query accepts `search` (literal, case-insensitive text across text/email/enum fields), `filters` (`[{field,op,value}]` with `eq`, `ne`, `contains`, `gt`, `gte`, `lt`, `lte`), optional `sort: {field,direction}`, `offset`, and `limit` (1–100). Response: `{records,total,offset,limit}`. Sorting supports declared fields or `created_at`/`updated_at`, always with record ID as a stable tie-breaker. Pagination uses offsets; inserts/deletes between requests can shift pages.

A summary accepts the same search/filters plus `metrics: [{name,op,field?}]` and optional `groupBy`. Operations are `count`, `sum`, `avg`, `min`, `max`; all except count require a number field. It returns `{total,groups:[{key,metrics:{[name]:value}}]}`. Aggregation covers the entire matching authorized dataset, not the loaded page. More than 500 groups returns an explicit error rather than silently truncating totals. Empty sums/averages remain `null`, empty counts are zero.

All queries bind values and JSON field keys as PostgreSQL parameters; field names and operations must match the collection schema. Private collections are restricted to the signed-in member's own records, or all records for admin/editor members when that collection grants editor access. Public collections allow anonymous reads but do not grant edit permissions. Collection lookup is scoped to the published app's project.

## Saved project versions

`GET /api/projects/:id/history` returns 50 snapshot summaries and the current revision. `?offset=50` fetches older entries. `GET /api/projects/:id/history/:revision` returns a snapshot for inspection. `POST /api/projects/:id/history/:revision/restore` takes `{expectedRevision}` and creates a **new** project revision. Only the project owner can inspect or restore snapshots. A stale current revision returns 409. Restore and the resulting snapshot are one transaction protected by the project's lock.

Restoration changes the project document only: pages, theme and app interface configuration. It does not roll back database schemas, records, uploaded files, users, workflows, or the published snapshot. App navigation and widget bindings are validated against current same-project collections and fields before restoration. Old snapshots with missing/incompatible bindings must be repaired manually rather than blindly restored.

Snapshots begin at this feature's installation (the current document is backfilled); earlier versions that were never recorded cannot be recovered. No automatic retention deletion is configured yet.

## Verification

`node --env-file=.env --test tests/data-services.integration.mjs`

Tests use a new isolated PostgreSQL database and exercise 220 records, >100-row aggregates, member/editor/public isolation, literal-search escaping, typed filters, malicious fields, owner-only history, conflict rejection, binding validation and restoration without changing records.
