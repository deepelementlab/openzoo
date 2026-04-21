DROP INDEX IF EXISTS idx_issues_title_bigm;
DROP INDEX IF EXISTS idx_issues_description_bigm;
DROP INDEX IF EXISTS idx_comments_content_bigm;

DO $$
BEGIN
    CREATE INDEX idx_issues_title_bigm ON issues USING gin (LOWER(title) gin_bigm_ops);
    CREATE INDEX idx_issues_description_bigm ON issues USING gin (LOWER(COALESCE(description, '')) gin_bigm_ops);
    CREATE INDEX idx_comments_content_bigm ON comments USING gin (LOWER(content) gin_bigm_ops);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_bigm not available, skipping search indexes: %', SQLERRM;
END $$;
