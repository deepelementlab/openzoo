import React, { useState } from "react";
import { Button } from "@openzoo/ui";
import { MessageCircle } from "lucide-react";

interface ChatFabProps {
  onClick: () => void;
  unreadCount?: number;
}

export function ChatFab({ onClick, unreadCount = 0 }: ChatFabProps) {
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={onClick}
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg relative"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </div>
  );
}
