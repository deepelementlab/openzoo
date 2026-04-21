import { getApiClient } from "../api/connect-client";
import type { ChatSession, ChatMessage } from "../types";

export async function sendChatMessage(workspaceId: string, sessionId: string, content: string): Promise<ChatMessage> {
  return getApiClient().call<ChatMessage>("/rpc/chat/send-message", {
    workspace_id: workspaceId,
    session_id: sessionId,
    content,
  });
}

export async function stopChatMessage(workspaceId: string, sessionId: string, messageId: string): Promise<void> {
  await getApiClient().call("/rpc/chat/stop-message", {
    workspace_id: workspaceId,
    session_id: sessionId,
    message_id: messageId,
  });
}

export async function updateChatSessionConfig(
  workspaceId: string,
  sessionId: string,
  config: Record<string, unknown>,
): Promise<ChatSession> {
  return getApiClient().call<ChatSession>("/rpc/chat/update-session-config", {
    workspace_id: workspaceId,
    session_id: sessionId,
    config,
  });
}
