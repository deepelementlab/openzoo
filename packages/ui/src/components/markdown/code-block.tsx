import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../../lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative group rounded-lg border bg-muted", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <span className="text-xs text-muted-foreground font-mono">{language || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export { CodeBlock };
