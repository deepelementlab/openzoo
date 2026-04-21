import React from "react";
import { Button } from "@openzoo/ui";
import { MessageSquare, Plus } from "lucide-react";

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatSessionHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
}

export function ChatSessionHistory({ sessions, activeSessionId, onSelectSession, onNewSession }: ChatSessionHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sessions</h3>
        <Button variant="ghost" size="sm" onClick={onNewSession}><Plus className="h-4 w-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {sessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No sessions yet</p>
        )}
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent ${activeSessionId === session.id ? "bg-accent" : ""}`}
            onClick={() => onSelectSession(session.id)}
          >
            <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="truncate">{session.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
