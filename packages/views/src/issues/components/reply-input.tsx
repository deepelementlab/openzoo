"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { ActorAvatar } from "@openzoo/ui/components/common/actor-avatar";
import { cn } from "@openzoo/ui/lib/utils";

interface ReplyInputProps {
  placeholder?: string;
  avatarType: string;
  avatarId: string;
  onSubmit: (content: string) => Promise<void>;
  size?: "sm" | "default";
}

export function ReplyInput({ placeholder = "Leave a reply...", avatarType, avatarId, onSubmit, size = "default" }: ReplyInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const avatarSize = size === "sm" ? 22 : 28;

  return (
    <div className="group/editor flex items-start gap-2.5">
      <ActorAvatar actorType={avatarType} actorId={avatarId} size={avatarSize} className="mt-0.5 shrink-0" />
      <div className={cn("relative min-w-0 flex-1 flex flex-col", size === "sm" ? "max-h-40" : "max-h-56")}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[36px] resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="absolute bottom-0 right-0 flex items-center gap-1">
          <button
            type="button"
            disabled={!content.trim() || submitting}
            onClick={handleSubmit}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
