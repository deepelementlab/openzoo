import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import React from "react";

function CodeBlockViewComponent({ node }: { node: { attrs: { language: string }; content: { text: string } } }) {
  const lang = node.attrs.language || "text";
  const code = node.content?.text || "";
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <NodeViewWrapper>
      <div className="rounded-lg border bg-muted my-2">
        <div className="flex items-center justify-between px-4 py-1.5 border-b bg-muted/50 text-xs">
          <span className="font-mono text-muted-foreground">{lang}</span>
          <button type="button" onClick={handleCopy} className="text-muted-foreground hover:text-foreground">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
}

export const CodeBlockView = Node.create({
  name: "codeBlock",

  addOptions() {
    return { HTMLAttributes: { class: "" } };
  },

  content: "text*",
  marks: "",
  code: true,
  defining: true,

  addAttributes() {
    return { language: { default: null } };
  },

  parseHTML() {
    return [{ tag: "pre" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["pre", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ["code", 0]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockViewComponent);
  },
});
