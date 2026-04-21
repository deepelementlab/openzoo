ALTER TABLE agent_task_queue DROP COLUMN IF EXISTS chat_session_id;
DROP TABLE IF EXISTS chat_message;
DROP TABLE IF EXISTS chat_session;
