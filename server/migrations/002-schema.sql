ALTER TABLE collections ADD COLUMN IF NOT EXISTS schema_version integer NOT NULL DEFAULT 1;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS editor_access boolean NOT NULL DEFAULT false;
ALTER TABLE app_members ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','editor','admin'));
CREATE TABLE IF NOT EXISTS collection_revisions (
 collection_id text NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
 schema_version integer NOT NULL, definition jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(collection_id,schema_version)
);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at timestamptz;
