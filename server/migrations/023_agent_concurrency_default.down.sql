UPDATE agent SET max_concurrent_tasks = 1 WHERE max_concurrent_tasks = 6;
ALTER TABLE agent ALTER COLUMN max_concurrent_tasks SET DEFAULT 1;
