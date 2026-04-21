import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const markdownPasteKey = new PluginKey("markdownPaste");

export const MarkdownPaste = Extension.create({
  name: "markdownPaste",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: markdownPasteKey,
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData("text/plain");
            if (!text) return false;

            const hasMarkdown = /^#{1,3}\s|^\*\s|^\-\s|```|\*\*.*\*\*|^\[.*\]\(.*\)|^>\s/m.test(text);
            if (!hasMarkdown) return false;

            const html = simpleMarkdownToHtml(text);
            view.pasteHTML(html);
            return true;
          },
        },
      }),
    ];
  },
});

function simpleMarkdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  return html;
}
