"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

const QUICK_EMOJIS = [
  "👍", "❤️", "😊", "😂", "🎉", "🔥", "👀", "💯", "🙏", "🚀", "✅", "💡",
];

interface QuickEmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function QuickEmojiPicker({ onSelect, className }: QuickEmojiPickerProps) {
  return (
    <div className={cn("flex flex-wrap gap-1 p-2", className)}>
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="inline-flex items-center justify-center size-8 rounded-md hover:bg-accent transition-colors text-base"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
