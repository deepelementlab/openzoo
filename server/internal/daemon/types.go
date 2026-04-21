package daemon

type AgentEntry struct {
	Path  string
	Model string
}

type Runtime struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Provider string `json:"provider"`
	Status   string `json:"status"`
}

type RepoData struct {
	URL         string `json:"url"`
	Description string `json:"description"`
}

type Task struct {
	ID                   string     `json:"id"`
	AgentID              string     `json:"agent_id"`
	RuntimeID            string     `json:"runtime_id"`
	IssueID              string     `json:"issue_id"`
	WorkspaceID          string     `json:"workspace_id"`
	Agent                *AgentData `json:"agent,omitempty"`
	Repos                []RepoData `json:"repos,omitempty"`
	Provider             string     `json:"-"`
	PriorSessionID       string     `json:"prior_session_id,omitempty"`
	PriorWorkDir         string     `json:"prior_work_dir,omitempty"`
	TriggerCommentID     string     `json:"trigger_comment_id,omitempty"`
	TriggerCommentContent string    `json:"trigger_comment_content,omitempty"`
	ChatSessionID        string     `json:"chat_session_id,omitempty"`
	ChatMessage          string     `json:"chat_message,omitempty"`
}

type AgentData struct {
	ID           string      `json:"id"`
	Name         string      `json:"name"`
	Instructions string      `json:"instructions"`
	Skills       []SkillData `json:"skills"`
}

type SkillData struct {
	Name    string          `json:"name"`
	Content string          `json:"content"`
	Files   []SkillFileData `json:"files,omitempty"`
}

type SkillFileData struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

type TaskUsageEntry struct {
	Provider         string `json:"provider"`
	Model            string `json:"model"`
	InputTokens      int64  `json:"input_tokens"`
	OutputTokens     int64  `json:"output_tokens"`
	CacheReadTokens  int64  `json:"cache_read_tokens"`
	CacheWriteTokens int64  `json:"cache_write_tokens"`
}

type TaskResult struct {
	Status     string           `json:"status"`
	Comment    string           `json:"comment,omitempty"`
	BranchName string           `json:"branch_name,omitempty"`
	EnvType    string           `json:"env_type,omitempty"`
	SessionID  string           `json:"session_id,omitempty"`
	WorkDir    string           `json:"work_dir,omitempty"`
	Usage      []TaskUsageEntry `json:"usage,omitempty"`
}

type TaskMessageData struct {
	Seq     int32  `json:"seq"`
	Type    string `json:"type"`
	Content string `json:"content,omitempty"`
	Tool    string `json:"tool,omitempty"`
	CallID  string `json:"call_id,omitempty"`
	Input   string `json:"input,omitempty"`
	Output  string `json:"output,omitempty"`
}

type HeartbeatResponse struct {
	Status        string         `json:"status"`
	PendingPing   *PendingPing   `json:"pending_ping,omitempty"`
	PendingUpdate *PendingUpdate `json:"pending_update,omitempty"`
}

type PendingPing struct {
	ID string `json:"id"`
}

type PendingUpdate struct {
	ID            string `json:"id"`
	TargetVersion string `json:"target_version"`
}

type WorkspaceInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type RegisterResponse struct {
	Runtimes []Runtime  `json:"runtimes"`
	Repos    []RepoData `json:"repos"`
}
