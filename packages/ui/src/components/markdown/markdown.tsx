import React from "react";
import { cn } from "../../lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

function Markdown({ content, className }: MarkdownProps) {
  const html = simpleMarkdownToHtml(content);
  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function simpleMarkdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline">$1</a>');
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = html.replace(/\n/g, "<br />");
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p>(<h[1-3]>)/g, "$1");
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<pre>)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)<\/p>/g, "$1");

  return html;
}

export { Markdown };
