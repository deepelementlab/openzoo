UPDATE workspaces SET issue_prefix = UPPER(
    LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3)
) WHERE issue_prefix = '';
UPDATE workspaces SET issue_prefix = 'OZ' WHERE issue_prefix = '';
