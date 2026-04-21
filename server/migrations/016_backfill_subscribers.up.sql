INSERT INTO issue_subscribers (issue_id, user_type, user_id, reason)
SELECT id, creator_type, creator_id, 'creator' FROM issues ON CONFLICT DO NOTHING;

INSERT INTO issue_subscribers (issue_id, user_type, user_id, reason)
SELECT id, assignee_type, assignee_id, 'assignee' FROM issues
WHERE assignee_type IS NOT NULL AND assignee_id IS NOT NULL ON CONFLICT DO NOTHING;

INSERT INTO issue_subscribers (issue_id, user_type, user_id, reason)
SELECT DISTINCT c.issue_id, c.author_type, c.author_id, 'commenter'
FROM comments c ON CONFLICT DO NOTHING;
