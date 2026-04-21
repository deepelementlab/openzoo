export type AgentStatus = "idle" | "working" | "blocked" | "error" | "offline";
export type AgentRuntimeMode = "local" | "cloud";
export type AgentVisibility = "workspace" | "private";
export type RuntimePingStatus = "pending" | "running" | "completed" | "failed" | "timeout";
export type RuntimeUpdateStatus = "pending" | "running" | "completed" | "failed" | "timeout";

export interface RuntimeDevice {
  id: string;
  workspace_id: string;
  daemon_id: string | null;
  name: string;
  runtime_mode: AgentRuntimeMode;
  provider: string;
  status: "online" | "offline";
  device_info: string;
  owner_id: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AgentRuntime = RuntimeDevice;

export interface AgentTask {
  id: string;
  agent_id: string;
  issue_id: string;
  runtime_id: string;
  status: string;
  priority: number;
  dispatched_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  result: unknown;
  error: string | null;
  created_at: string;
}

export interface Agent {
  id: string;
  workspace_id: string;
  runtime_id: string;
  name: string;
  description: string;
  instructions: string;
  avatar_url: string | null;
  runtime_mode: AgentRuntimeMode;
  runtime_config: Record<string, unknown>;
  visibility: AgentVisibility;
  status: AgentStatus;
  max_concurrent_tasks: number;
  owner_id: string | null;
  skills?: Skill[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  archived_by: string | null;
}

export interface Skill {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  content: string;
  config: Record<string, unknown>;
  files: SkillFile[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillFile {
  id: string;
  skill_id: string;
  path: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  instructions?: string;
  runtime_id: string;
  visibility?: AgentVisibility;
  max_concurrent_tasks?: number;
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  instructions?: string;
  visibility?: AgentVisibility;
  max_concurrent_tasks?: number;
}

export interface CreateSkillRequest {
  name: string;
  description?: string;
  content?: string;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  content?: string;
}

export interface SetAgentSkillsRequest {
  skill_ids: string[];
}

export interface RuntimePing {
  id: string;
  runtime_id: string;
  status: RuntimePingStatus;
  output: string | null;
  error: string | null;
  duration_ms: number | null;
}

export interface IssueUsageSummary {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  task_count: number;
}

export interface RuntimeUsage {
  runtime_id: string;
  date: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
}

export interface RuntimeHourlyActivity {
  hour: string;
  count: number;
}

export interface RuntimeUpdate {
  id: string;
  runtime_id: string;
  target_version: string;
  status: RuntimeUpdateStatus;
  output: string | null;
  error: string | null;
}
