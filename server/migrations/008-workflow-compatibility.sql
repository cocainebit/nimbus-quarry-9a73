-- Legacy internal import tools may still write only the v1 action column.
ALTER TABLE workflows ALTER COLUMN actions SET DEFAULT '[]';
