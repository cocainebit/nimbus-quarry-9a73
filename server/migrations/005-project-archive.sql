-- Reconcile development databases whose initial schema migration predated archiving.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at timestamptz;
