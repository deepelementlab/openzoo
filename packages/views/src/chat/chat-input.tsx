import { useState, useRef, type KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isRunning?: boolean;
}

export function ChatInput({ onSend, onStop, disabled, isRunning }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="flex items-end gap-2 border-t px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Ask OpenZoo..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      {isRunning ? (
        <button
          onClick={onStop}
          className="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Send
        </button>
      )}
    </div>
  );
}
