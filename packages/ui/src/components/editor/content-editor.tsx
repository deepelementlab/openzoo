import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { cn } from "../../lib/utils";

export interface ContentEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  onSubmit?: () => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  disabled = false,
  minHeight = "120px",
  onSubmit,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          command: () => {},
          items: () => [],
        },
      }),
      Placeholder.configure({ placeholder }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Markdown,
    ],
    content: value ?? "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const storage = editor.storage as { markdown?: { getMarkdown: () => string } };
      const markdown = storage.markdown?.getMarkdown() ?? editor.getHTML();
      onChange?.(markdown);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  useEffect(() => {
    if (editor && value !== undefined) {
      const storage = editor.storage as { markdown?: { getMarkdown: () => string } };
      const current = storage.markdown?.getMarkdown() ?? "";
      if (value !== current) {
        editor.commands.setContent(value);
      }
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border bg-background transition-colors",
        isFocused ? "border-ring ring-1 ring-ring" : "border-input",
        disabled && "bg-muted/50",
        className,
      )}
      onKeyDown={handleKeyDown}
    >
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none p-3"
        style={{ minHeight }}
      />
    </div>
  );
};
