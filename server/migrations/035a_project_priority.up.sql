ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'none'
    CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent'));
