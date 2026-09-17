ALTER TABLE project_revisions ADD COLUMN IF NOT EXISTS actor_id text;
INSERT INTO project_revisions(project_id,revision,document)
 SELECT id,revision,document FROM projects ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS records_collection_created ON records(collection_id,created_at DESC,id);
