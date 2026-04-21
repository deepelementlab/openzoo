"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@openzoo/ui/components/button";
import { Textarea } from "@openzoo/ui/components/textarea";

interface CommentInputProps {
  issueId: string;
  onSubmit: (content: string) => Promise<void>;
}

export function CommentInput({ onSubmit }: CommentInputProps) {
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

  return (
    <div className="relative flex max-h-56 flex-col rounded-lg bg-card pb-8 ring-1 ring-border">
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Leave a comment..."
          className="min-h-[60px] resize-none border-0 shadow-none focus-visible:ring-0 p-0"
        />
      </div>
      <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
        <Button size="sm" disabled={!content.trim() || submitting} onClick={handleSubmit}>
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
