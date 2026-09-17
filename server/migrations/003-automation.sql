CREATE TABLE IF NOT EXISTS workflows (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 name text NOT NULL, collection_id text NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
 event text NOT NULL, action jsonb NOT NULL, enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS jobs (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 workflow_id text REFERENCES workflows(id) ON DELETE SET NULL,
 event_key text NOT NULL UNIQUE, payload jsonb NOT NULL, action jsonb NOT NULL,
 status text NOT NULL DEFAULT 'queued', attempts integer NOT NULL DEFAULT 0,
 available_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, lease_token text,
 last_error text, created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS jobs_due ON jobs(status,available_at);
CREATE TABLE IF NOT EXISTS app_notifications (
 id text PRIMARY KEY, job_id text NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
 project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 user_id text NOT NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_files (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 owner_id text NOT NULL, name text NOT NULL, mime text NOT NULL, size integer NOT NULL,
 content bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(size > 0 AND size <= 5242880)
);
CREATE INDEX IF NOT EXISTS app_files_owner ON app_files(project_id,owner_id);
