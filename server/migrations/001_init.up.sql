-- OpenZoo Database Schema
-- Migration 001: Initial schema

-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT DEFAULT '',
    password_hash TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    context TEXT DEFAULT '',
    issue_prefix TEXT NOT NULL DEFAULT 'OZ',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace Repos
CREATE TABLE IF NOT EXISTS workspace_repos (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    description TEXT DEFAULT '',
    PRIMARY KEY (workspace_id, url)
);

-- Members (workspace membership)
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- Issues
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,
    identifier TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog','todo','in_progress','in_review','done','blocked','cancelled')),
    priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('urgent','high','medium','low','none')),
    assignee_type TEXT CHECK (assignee_type IN ('member','agent')),
    assignee_id TEXT,
    creator_type TEXT NOT NULL DEFAULT 'member',
    creator_id TEXT NOT NULL,
    parent_issue_id TEXT REFERENCES issues(id),
    project_id TEXT,
    position DOUBLE PRECISION DEFAULT 0,
    due_date TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, number)
);

CREATE INDEX IF NOT EXISTS idx_issues_workspace ON issues(workspace_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(workspace_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_identifier ON issues(identifier);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL,
    author_type TEXT NOT NULL DEFAULT 'member',
    author_id TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('comment','status_change','progress_update','system')),
    parent_id TEXT REFERENCES comments(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issue_id);

-- Reactions
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, actor_type, actor_id, emoji)
);

-- Issue Reactions
CREATE TABLE IF NOT EXISTS issue_reactions (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(issue_id, actor_type, actor_id, emoji)
);

-- Agents
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    runtime_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    instructions TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    runtime_mode TEXT DEFAULT 'local' CHECK (runtime_mode IN ('local','cloud')),
    runtime_config JSONB DEFAULT '{}',
    visibility TEXT DEFAULT 'workspace' CHECK (visibility IN ('workspace','private')),
    status TEXT DEFAULT 'idle' CHECK (status IN ('idle','working','blocked','error','offline')),
    max_concurrent_tasks INTEGER DEFAULT 1,
    owner_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ,
    archived_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_agents_workspace ON agents(workspace_id);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    content TEXT DEFAULT '',
    config JSONB DEFAULT '{}',
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skill Files
CREATE TABLE IF NOT EXISTS skill_files (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent Skills (join table)
CREATE TABLE IF NOT EXISTS agent_skills (
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (agent_id, skill_id)
);

-- Runtimes
CREATE TABLE IF NOT EXISTS runtimes (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    daemon_id TEXT,
    name TEXT NOT NULL,
    runtime_mode TEXT DEFAULT 'local' CHECK (runtime_mode IN ('local','cloud')),
    provider TEXT NOT NULL DEFAULT '',
    status TEXT DEFAULT 'offline' CHECK (status IN ('online','offline')),
    device_info TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    owner_id TEXT,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    runtime_id TEXT NOT NULL DEFAULT '',
    issue_id TEXT NOT NULL REFERENCES issues(id),
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued','dispatched','running','completed','failed','cancelled')),
    priority INTEGER DEFAULT 0,
    dispatched_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_issue ON tasks(issue_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id);

-- Task Messages
CREATE TABLE IF NOT EXISTS task_messages (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    issue_id TEXT NOT NULL,
    seq INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','thinking','tool_use','tool_result','error')),
    tool TEXT,
    content TEXT,
    input JSONB,
    output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    title TEXT DEFAULT 'New Chat',
    status TEXT DEFAULT 'active' CHECK (status IN ('active','archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    chat_session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(chat_session_id);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK (status IN ('active','archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);

-- Issue Subscribers
CREATE TABLE IF NOT EXISTS issue_subscribers (
    id TEXT PRIMARY KEY,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_issue ON issue_subscribers(issue_id);

-- Activities (audit trail for issues)
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_value TEXT DEFAULT '',
    new_value TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_issue ON activities(issue_id);
CREATE INDEX IF NOT EXISTS idx_activities_workspace ON activities(workspace_id);

-- Personal Access Tokens
CREATE TABLE IF NOT EXISTS pats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{read,write}',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pats_user ON pats(user_id);

-- Files (attachments)
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
    comment_id TEXT REFERENCES comments(id) ON DELETE SET NULL,
    uploader_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT DEFAULT 'application/octet-stream',
    size_bytes BIGINT DEFAULT 0,
    storage_path TEXT NOT NULL,
    download_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_issue ON files(issue_id);
CREATE INDEX IF NOT EXISTS idx_files_workspace ON files(workspace_id);

-- Pins (pinned items in workspace)
CREATE TABLE IF NOT EXISTS pins (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('issue','project','agent','runtime')),
    entity_id TEXT NOT NULL,
    position DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pins_workspace ON pins(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pins_entity ON pins(workspace_id, entity_type, entity_id);

-- Inbox Items
CREATE TABLE IF NOT EXISTS inbox_items (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('issue_assigned','issue_mentioned','comment_reply','status_change','system')),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    title TEXT DEFAULT '',
    message TEXT DEFAULT '',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inbox_user ON inbox_items(user_id, is_read, is_archived);
CREATE INDEX IF NOT EXISTS idx_inbox_workspace ON inbox_items(workspace_id);
