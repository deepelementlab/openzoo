import { getApiClient } from "../api/connect-client";

export interface ExternalSession {
  id: string;
  workspace_id: string;
  agent_id: string | null;
  session_id: string;
  pid: number;
  process_cwd: string;
  claude_version: string;
  session_file_path: string;
  status: string;
  discovered_at: string;
  last_seen_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DiscoverResult {
  total: number;
  processes: number;
  sessions: number;
  discovered: Array<{
    id: string;
    session_id: string;
    pid: number;
    process_cwd: string;
    status: string;
    confidence: number;
  }>;
}

export async function discoverExternalSessions(workspaceId: string): Promise<DiscoverResult> {
  return getApiClient().call<DiscoverResult>("/rpc/daemon/external/discover", { workspace_id: workspaceId });
}

export async function listExternalSessions(workspaceId: string): Promise<ExternalSession[]> {
  const res = await getApiClient().call<{ sessions: ExternalSession[] }>("/rpc/daemon/external/list", { workspace_id: workspaceId });
  return res.sessions ?? [];
}

export async function monitorExternalSession(id: string): Promise<{ status: string }> {
  return getApiClient().call("/rpc/daemon/external/monitor", { id });
}

export async function adoptExternalSession(id: string, agentId: string): Promise<{ status: string }> {
  return getApiClient().call("/rpc/daemon/external/adopt", { id, agent_id: agentId });
}

export async function releaseExternalSession(id: string): Promise<{ status: string }> {
  return getApiClient().call("/rpc/daemon/external/release", { id });
}
