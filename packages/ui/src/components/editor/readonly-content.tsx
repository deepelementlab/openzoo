import React from "react";
import { cn } from "../../lib/utils";

export interface ReadonlyContentProps {
  content: string;
  className?: string;
}

export const ReadonlyContent: React.FC<ReadonlyContentProps> = ({ content, className }) => {
  if (!content) return null;

  const isHtml = content.startsWith("<") && content.includes(">");

  if (isHtml) {
    return (
      <div
        className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className={cn("whitespace-pre-wrap text-sm", className)}>
      {content}
    </div>
  );
};
