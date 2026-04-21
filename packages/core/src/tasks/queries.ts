import { getApiClient } from "../api/connect-client";
import type { Task, TaskMessage } from "../types";

export async function createTask(data: {
  workspace_id: string;
  issue_id: string;
  runtime_id?: string;
  agent_id?: string;
  prompt?: string;
}): Promise<Task> {
  return getApiClient().call<Task>("/rpc/task/create", data);
}

export async function getTask(workspaceId: string, taskId: string): Promise<Task> {
  return getApiClient().call<Task>("/rpc/task/get", { workspace_id: workspaceId, task_id: taskId });
}

export async function listTasks(params: {
  workspace_id: string;
  issue_id?: string;
  agent_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ tasks: Task[]; total: number }> {
  return getApiClient().call("/rpc/task/list", params);
}

export async function updateTaskStatus(
  workspaceId: string, taskId: string, status: string, data?: { error?: string; result_json?: string }
): Promise<Task> {
  return getApiClient().call<Task>("/rpc/task/update-status", { workspace_id: workspaceId, task_id: taskId, status, ...data });
}

export async function cancelTask(workspaceId: string, taskId: string): Promise<Task> {
  return getApiClient().call<Task>("/rpc/task/cancel", { workspace_id: workspaceId, task_id: taskId });
}

export async function listTaskMessages(
  workspaceId: string, taskId: string, limit = 100, offset = 0
): Promise<TaskMessage[]> {
  const res = await getApiClient().call<{ messages: TaskMessage[] }>("/rpc/task/messages", {
    workspace_id: workspaceId, task_id: taskId, limit, offset,
  });
  return res.messages ?? [];
}
