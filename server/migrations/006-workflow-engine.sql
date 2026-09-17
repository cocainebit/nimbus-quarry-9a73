ALTER TABLE workflows ADD COLUMN IF NOT EXISTS actions jsonb;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '[]';
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS schedule jsonb;
ALTER TABLE workflows ADD COLUMN IF NOT EXISTS next_run_at timestamptz;
UPDATE workflows SET actions=jsonb_build_array(action) WHERE actions IS NULL;
ALTER TABLE workflows ALTER COLUMN actions SET NOT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS actions jsonb;
UPDATE jobs SET actions=jsonb_build_array(action) WHERE actions IS NULL;
ALTER TABLE jobs ALTER COLUMN actions SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN actions SET DEFAULT '[]';
CREATE TABLE IF NOT EXISTS job_steps (
 job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
 step integer NOT NULL, completed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(job_id,step)
);
ALTER TABLE app_notifications DROP CONSTRAINT IF EXISTS app_notifications_job_id_key;
ALTER TABLE app_notifications ADD COLUMN IF NOT EXISTS step integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS notification_job_step ON app_notifications(job_id,step);
CREATE INDEX IF NOT EXISTS workflows_schedule_due ON workflows(next_run_at) WHERE enabled=true AND event='schedule';
