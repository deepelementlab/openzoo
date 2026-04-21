DROP TABLE IF EXISTS external_sessions;
ALTER TABLE agents DROP COLUMN IF EXISTS last_discovered_at;
ALTER TABLE agents DROP COLUMN IF EXISTS external_metadata;
ALTER TABLE agents DROP COLUMN IF EXISTS external_cwd;
ALTER TABLE agents DROP COLUMN IF EXISTS external_pid;
ALTER TABLE agents DROP COLUMN IF EXISTS external_session_id;
ALTER TABLE agents DROP COLUMN IF EXISTS session_source;
