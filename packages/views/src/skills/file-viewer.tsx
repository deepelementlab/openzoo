import React from "react";
import { CodeBlock } from "@openzoo/ui";

interface FileViewerProps {
  filename: string;
  content: string;
}

export function FileViewer({ filename, content }: FileViewerProps) {
  const ext = filename.split(".").pop() || "txt";
  const langMap: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", go: "go", rs: "rust", md: "markdown", json: "json",
    yaml: "yaml", yml: "yaml", toml: "toml", sql: "sql", sh: "bash",
  };
  const language = langMap[ext] || "text";

  const isMarkdown = ext === "md";

  return (
    <div className="h-full">
      <div className="px-4 py-2 border-b bg-muted/30">
        <span className="text-sm font-medium">{filename}</span>
      </div>
      <div className="p-4">
        {isMarkdown ? (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{content}</div>
        ) : (
          <CodeBlock code={content} language={language} />
        )}
      </div>
    </div>
  );
}
