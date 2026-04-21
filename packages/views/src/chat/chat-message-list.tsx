import { useRef, useEffect } from "react";
import type { ChatMessage } from "@openzoo/core/types";
import { StreamingMarkdown } from "@openzoo/ui/components/markdown/streaming-markdown";
import { ActorAvatar } from "@openzoo/ui/components/common/actor-avatar";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isWaiting?: boolean;
}

export function ChatMessageList({ messages, isWaiting }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWaiting]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
        >
          {msg.role === "assistant" && (
            <ActorAvatar actorType="agent" actorId="assistant" size="sm" />
          )}
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <StreamingMarkdown content={msg.content} />
          </div>
        </div>
      ))}
      {isWaiting && (
        <div className="flex gap-3">
          <ActorAvatar actorType="agent" actorId="assistant" size="sm" />
          <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
            <span className="animate-pulse">Thinking...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
