import { getApiClient } from "../api/connect-client";
import type { Agent, Skill } from "../types";

export async function listAgents(workspaceId: string): Promise<Agent[]> {
  const res = await getApiClient().call<{ agents: Agent[] }>("/rpc/agent/list", { workspace_id: workspaceId });
  return res.agents ?? [];
}

export async function getAgent(workspaceId: string, agentId: string): Promise<Agent> {
  return getApiClient().call<Agent>("/rpc/agent/get", { workspace_id: workspaceId, agent_id: agentId });
}

export async function createAgent(data: {
  workspace_id: string;
  name: string;
  description?: string;
  instructions?: string;
  runtime_id?: string;
  visibility?: string;
  max_concurrent_tasks?: number;
}): Promise<Agent> {
  return getApiClient().call<Agent>("/rpc/agent/create", data);
}

export async function updateAgent(
  workspaceId: string, agentId: string, data: Record<string, unknown>
): Promise<Agent> {
  return getApiClient().call<Agent>("/rpc/agent/update", { workspace_id: workspaceId, agent_id: agentId, ...data });
}

export async function archiveAgent(workspaceId: string, agentId: string): Promise<Agent> {
  return getApiClient().call<Agent>("/rpc/agent/archive", { workspace_id: workspaceId, agent_id: agentId });
}

export async function restoreAgent(workspaceId: string, agentId: string): Promise<Agent> {
  return getApiClient().call<Agent>("/rpc/agent/restore", { workspace_id: workspaceId, agent_id: agentId });
}

export async function setAgentSkills(workspaceId: string, agentId: string, skillIds: string[]): Promise<Agent> {
  return getApiClient().call<Agent>("/rpc/agent/set-skills", { workspace_id: workspaceId, agent_id: agentId, skill_ids: skillIds });
}

// Skills
export async function listSkills(workspaceId: string): Promise<Skill[]> {
  const res = await getApiClient().call<{ skills: Skill[] }>("/rpc/skill/list", { workspace_id: workspaceId });
  return res.skills ?? [];
}

export async function createSkill(data: {
  workspace_id: string;
  name: string;
  description?: string;
  content?: string;
  files?: { path: string; content: string }[];
}): Promise<Skill> {
  return getApiClient().call<Skill>("/rpc/skill/create", data);
}

export async function updateSkill(
  workspaceId: string, skillId: string, data: Record<string, unknown>
): Promise<Skill> {
  return getApiClient().call<Skill>("/rpc/skill/update", { workspace_id: workspaceId, skill_id: skillId, ...data });
}

export async function deleteSkill(workspaceId: string, skillId: string): Promise<void> {
  await getApiClient().call("/rpc/skill/delete", { workspace_id: workspaceId, skill_id: skillId });
}
