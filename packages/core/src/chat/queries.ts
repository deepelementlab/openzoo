import { getApiClient } from "../api/connect-client";
import type { ChatSession, ChatMessage } from "../types";

export async function listChatSessions(params: {
  workspace_id: string;
  agent_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: ChatSession[] }> {
  return getApiClient().call("/rpc/chat/sessions", params);
}

export async function getChatSession(workspaceId: string, sessionId: string): Promise<ChatSession> {
  return getApiClient().call<ChatSession>("/rpc/chat/get-session", { workspace_id: workspaceId, session_id: sessionId });
}

export async function createChatSession(data: {
  workspace_id: string;
  agent_id: string;
  title?: string;
}): Promise<ChatSession> {
  return getApiClient().call<ChatSession>("/rpc/chat/create-session", data);
}

export async function archiveChatSession(workspaceId: string, sessionId: string): Promise<ChatSession> {
  return getApiClient().call<ChatSession>("/rpc/chat/archive-session", { workspace_id: workspaceId, session_id: sessionId });
}

export async function listChatMessages(params: {
  workspace_id: string;
  session_id: string;
  limit?: number;
  offset?: number;
}): Promise<{ messages: ChatMessage[] }> {
  return getApiClient().call("/rpc/chat/messages", params);
}

export async function sendChatMessage(data: {
  workspace_id: string;
  session_id: string;
  content: string;
}): Promise<{ message_id: string; task_id: string }> {
  return getApiClient().call("/rpc/chat/send", data);
}
