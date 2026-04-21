import React, { useState } from "react";
import { Button, Input, Popover, PopoverTrigger, PopoverContent } from "@openzoo/ui";

interface Project {
  id: string;
  name: string;
}

interface ProjectPickerProps {
  projects: Project[];
  value: string | null;
  onChange: (id: string | null) => void;
}

export function ProjectPicker({ projects, value, onChange }: ProjectPickerProps) {
  const [search, setSearch] = useState("");
  const current = projects.find((p) => p.id === value);

  const filtered = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">{current?.name || "No Project"}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <button
          type="button"
          className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          onClick={() => { onChange(null); }}
        >
          No Project
        </button>
        {filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => { onChange(p.id); }}
          >
            {p.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
