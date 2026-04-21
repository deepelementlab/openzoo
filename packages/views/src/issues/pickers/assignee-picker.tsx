"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@openzoo/ui/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@openzoo/ui/components/popover";
import { Button } from "@openzoo/ui/components/button";
import { ActorAvatar } from "@openzoo/ui/components/common/actor-avatar";

interface Member { id: string; name: string; avatar_url: string | null; }

interface AssigneePickerProps {
  members: Member[];
  value?: string;
  onChange?: (id: string | null) => void;
}

export function AssigneePicker({ members, value, onChange }: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = members.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {selected ? (
            <>
              <ActorAvatar actorType="member" actorId={selected.id} size={16} />
              {selected.name}
            </>
          ) : "Unassigned"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start">
        <button onClick={() => { onChange?.(null); setOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
          <div className="size-4 rounded-full bg-muted" />
          <span className="text-muted-foreground">Unassigned</span>
          {!value && <Check className="ml-auto size-3.5" />}
        </button>
        {members.map((m) => (
          <button key={m.id} onClick={() => { onChange?.(m.id); setOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent", value === m.id && "bg-accent")}>
            <ActorAvatar actorType="member" actorId={m.id} size={16} />
            <span>{m.name}</span>
            {value === m.id && <Check className="ml-auto size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
