import React, { useState, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { Markdown } from "./markdown";

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

function StreamingMarkdown({ content, isStreaming, className }: StreamingMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Markdown content={content} />
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}

export { StreamingMarkdown };
