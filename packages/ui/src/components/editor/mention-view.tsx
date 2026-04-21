"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

export function MentionView({ node }: NodeViewProps) {
  const { type, id, label } = node.attrs;

  if (type === "issue") {
    return (
      <NodeViewWrapper as="span" className="inline">
        <a
          href={`/issues/${id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="issue-mention inline-flex items-center gap-1.5 rounded-md border mx-0.5 px-2 py-0.5 text-xs hover:bg-accent transition-colors cursor-pointer max-w-72"
        >
          <span className="font-medium text-muted-foreground">
            {label ?? id.slice(0, 8)}
          </span>
        </a>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <span className="mention bg-accent/50 rounded px-1 py-0.5 text-sm font-medium text-accent-foreground">
        @{label ?? id}
      </span>
    </NodeViewWrapper>
  );
}
