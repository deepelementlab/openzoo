import * as React from "react";
import { cn } from "../../lib/utils";

const commonEmojis = ["👍", "👎", "❤️", "🎉", "🚀", "👀", "💯", "🔥", "😂", "🤔", "✅", "❌"];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  return (
    <div className={cn("grid grid-cols-6 gap-1 p-2", className)}>
      {commonEmojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-lg"
          onClick={() => onSelect(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export { EmojiPicker };
