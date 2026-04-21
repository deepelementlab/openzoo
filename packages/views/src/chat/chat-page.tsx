import React, { useState, useRef, useEffect, useCallback } from "react";
import { useWorkspaceStore, useAgents, useCreateChatSession, useChatMessages, useSendChatMessage } from "@openzoo/core";
import { Button, Input, Card, EmptyState, Spinner, Badge } from "@openzoo/ui";
import type { Agent, ChatSession, ChatMessage } from "@openzoo/core";
import { ReadonlyContent } from "@openzoo/ui";

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[75%] rounded-lg px-4 py-3 ${
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      }`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">Assistant</span>
            {isStreaming && <span className="animate-pulse text-xs">...</span>}
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">
          <ReadonlyContent content={message.content ?? ""} />
        </div>
        <div className={`text-xs mt-1 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {message.created_at ? new Date(message.created_at).toLocaleTimeString() : ""}
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const wsId = useWorkspaceStore((s) => s.currentWorkspace?.id);
  const { data: agents = [], isLoading: agentsLoading } = useAgents(wsId ?? "");
  const createSession = useCreateChatSession();
  const sendMsg = useSendChatMessage();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: chatData = { messages: [] }, refetch: refetchMessages, isLoading: messagesLoading } = useChatMessages(
    wsId ?? "",
    activeSession?.id ?? "",
  );
  const messageList = chatData.messages ?? [];

  useEffect(() => {
    if (!wsId) return;
    import("@openzoo/core").then(({ listChatSessions }) =>
      listChatSessions({ workspace_id: wsId })
        .then((res: any) => { setSessions(res.sessions ?? []); setLoading(false); })
        .catch(() => setLoading(false))
    );
  }, [wsId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const startChat = useCallback(async (agent: Agent) => {
    if (!wsId) return;
    const res: any = await createSession.mutateAsync({
      workspace_id: wsId,
      agent_id: agent.id,
      title: `Chat with ${agent.name}`,
    });
    const session = res.session ?? res;
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
  }, [wsId, createSession]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamingId(null);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeSession || !wsId) return;
    const content = input;
    setInput("");

    const userMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      chat_session_id: activeSession.id,
      role: "user",
      content,
      task_id: null,
      created_at: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      chat_session_id: activeSession.id,
      role: "assistant",
      content: "",
      task_id: null,
      created_at: new Date().toISOString(),
    };

    const msgs = [...messageList, userMsg, assistantMsg];
    setStreamingId(assistantMsg.id);

    try {
      const response = await sendMsg.mutateAsync({
        workspace_id: wsId,
        session_id: activeSession.id,
        content,
      });
      setStreamingId(null);
      refetchMessages();
    } catch (e) {
      setStreamingId(null);
    }
  }, [input, activeSession, wsId, messageList, sendMsg, refetchMessages]);

  if (loading || agentsLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="flex h-full">
      <aside className="w-64 border-r flex flex-col bg-muted/10">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Agents</h3>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {agents.map((agent: Agent) => (
            <button
              key={agent.id}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm flex items-center gap-2"
              onClick={() => startChat(agent)}
            >
              <span className="w-2 h-2 rounded-full bg-primary/30 shrink-0" />
              <span className="truncate">{agent.name}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] capitalize">
                {agent.status ?? "idle"}
              </Badge>
            </button>
          ))}
        </div>

        {sessions.length > 0 && (
          <>
            <div className="p-3 border-t"><h3 className="font-semibold text-sm">History</h3></div>
            <div className="flex-1 overflow-auto p-2 space-y-1 max-h-64">
              {sessions.map((s: ChatSession) => (
                <button
                  key={s.id}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm truncate ${
                    activeSession?.id === s.id ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                  onClick={() => setActiveSession(s)}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      <main className="flex-1 flex flex-col">
        {activeSession ? (
          <>
            <div className="border-b px-4 py-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold truncate">{activeSession.title}</h2>
              <Badge variant="outline" className="text-xs">
                {messageList.length} messages
              </Badge>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32"><Spinner /></div>
              ) : (
                messageList.map((msg: ChatMessage) => (
                  <MessageBubble key={msg.id} message={msg} isStreaming={streamingId === msg.id} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message... (Enter to send)"
                className="flex-1"
                disabled={sendMsg.isPending}
              />
              {streamingId ? (
                <Button variant="destructive" onClick={stopStreaming}>Stop</Button>
              ) : (
                <Button onClick={sendMessage} disabled={!input.trim() || sendMsg.isPending}>
                  {sendMsg.isPending ? <Spinner size="sm" /> : "Send"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="No active chat"
              description="Select an agent to start a conversation"
            />
          </div>
        )}
      </main>
    </div>
  );
}
