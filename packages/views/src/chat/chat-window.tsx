import React, { useState, useRef, useEffect } from "react";
import { Button, Input, Card } from "@openzoo/ui";
import { X, Send } from "lucide-react";
import { Markdown } from "@openzoo/ui";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isStreaming?: boolean;
}

export function ChatWindow({ isOpen, onClose, messages, onSendMessage, isStreaming }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] flex flex-col border rounded-lg shadow-xl bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Chat</h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Start a conversation</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {msg.role === "assistant" ? <Markdown content={msg.content} /> : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isStreaming}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isStreaming}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
