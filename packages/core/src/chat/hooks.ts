import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listChatSessions, getChatSession, createChatSession, listChatMessages, sendChatMessage } from "../chat/queries";

export function useChatSessions(workspaceId: string) {
  return useQuery({
    queryKey: ["chat-sessions", workspaceId],
    queryFn: () => listChatSessions({ workspace_id: workspaceId }),
    enabled: !!workspaceId,
  });
}

export function useChatSession(workspaceId: string, sessionId: string) {
  return useQuery({
    queryKey: ["chat-session", workspaceId, sessionId],
    queryFn: () => getChatSession(workspaceId, sessionId),
    enabled: !!workspaceId && !!sessionId,
  });
}

export function useChatMessages(workspaceId: string, sessionId: string) {
  return useQuery({
    queryKey: ["chat-messages", workspaceId, sessionId],
    queryFn: () => listChatMessages({ workspace_id: workspaceId, session_id: sessionId }),
    enabled: !!workspaceId && !!sessionId,
  });
}

export function useCreateChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createChatSession,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-sessions", vars.workspace_id] });
    },
  });
}

export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspace_id, session_id, content }: { workspace_id: string; session_id: string; content: string }) =>
      sendChatMessage({ workspace_id, session_id, content }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", vars.workspace_id, vars.session_id] });
    },
  });
}
