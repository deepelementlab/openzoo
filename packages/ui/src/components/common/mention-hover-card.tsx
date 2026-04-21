"use client";

import * as React from "react";
import { ActorAvatar } from "./actor-avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../popover";

interface MentionHoverCardProps {
  type: "member" | "agent";
  id: string;
  label: string;
  children: React.ReactNode;
}

export function MentionHoverCard({
  type,
  id,
  label,
  children,
}: MentionHoverCardProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="top" className="w-56 p-3" sideOffset={4}>
        <div className="flex items-center gap-2">
          <ActorAvatar actorType={type} actorId={id} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{label}</p>
            <p className="text-xs text-muted-foreground">{type}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
