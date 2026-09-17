CREATE TABLE IF NOT EXISTS projects (
 id text PRIMARY KEY, owner_id text NOT NULL, document jsonb NOT NULL,
 revision integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_owner ON projects(owner_id);
CREATE TABLE IF NOT EXISTS publications (
 project_id text PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
 slug text UNIQUE NOT NULL, document jsonb NOT NULL, revision integer NOT NULL,
 published_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS app_members (
 project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 user_id text NOT NULL, joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(project_id,user_id)
);
CREATE TABLE IF NOT EXISTS collections (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 name text NOT NULL, fields jsonb NOT NULL,
 public_read boolean NOT NULL DEFAULT false, member_create boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,name)
);
CREATE TABLE IF NOT EXISTS records (
 id text PRIMARY KEY, collection_id text NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
 owner_id text NOT NULL, data jsonb NOT NULL, version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS records_collection_owner ON records(collection_id,owner_id);
CREATE TABLE IF NOT EXISTS submissions (
 id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 name text NOT NULL, email text NOT NULL, message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_revisions (
 project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 revision integer NOT NULL, document jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(project_id,revision)
);
