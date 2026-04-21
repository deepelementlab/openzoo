import { getApiClient } from "../api/connect-client";
import type { Workspace, MemberWithUser, User } from "../types";

export async function listWorkspaces(): Promise<Workspace[]> {
  const res = await getApiClient().call<{ workspaces: Workspace[] }>("/rpc/workspace/list");
  return res.workspaces ?? [];
}

export async function getWorkspace(workspaceId: string): Promise<Workspace & { repos?: unknown[] }> {
  return getApiClient().call("/rpc/workspace/get", { workspace_id: workspaceId });
}

export async function createWorkspace(data: { name: string; description?: string; issue_prefix?: string }): Promise<Workspace> {
  return getApiClient().call<Workspace>("/rpc/workspace/create", data);
}

export async function updateWorkspace(workspaceId: string, data: Record<string, unknown>): Promise<Workspace> {
  return getApiClient().call<Workspace>("/rpc/workspace/update", { workspace_id: workspaceId, ...data });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await getApiClient().call("/rpc/workspace/delete", { workspace_id: workspaceId });
}

export async function listMembers(workspaceId: string): Promise<MemberWithUser[]> {
  const res = await getApiClient().call<{ members: MemberWithUser[] }>("/rpc/member/list", { workspace_id: workspaceId });
  return res.members ?? [];
}

export async function createMember(workspaceId: string, email: string, role?: string): Promise<MemberWithUser> {
  return getApiClient().call<MemberWithUser>("/rpc/member/create", { workspace_id: workspaceId, email, role: role ?? "member" });
}

export async function updateMember(workspaceId: string, memberId: string, role: string): Promise<MemberWithUser> {
  return getApiClient().call<MemberWithUser>("/rpc/member/update", { workspace_id: workspaceId, member_id: memberId, role });
}

export async function deleteMember(workspaceId: string, memberId: string): Promise<void> {
  await getApiClient().call("/rpc/member/delete", { workspace_id: workspaceId, member_id: memberId });
}
