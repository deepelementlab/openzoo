ALTER TABLE agents ALTER COLUMN max_concurrent_tasks SET DEFAULT 6;
UPDATE agents SET max_concurrent_tasks = 6 WHERE max_concurrent_tasks = 1;
