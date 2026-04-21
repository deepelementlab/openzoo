import React from "react";

interface FileEntry {
  name: string;
  type: "file" | "directory";
  content?: string;
  children?: FileEntry[];
}

interface FileTreeProps {
  files: FileEntry[];
  selectedFile: string | null;
  onSelectFile: (name: string, content: string) => void;
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  return (
    <div className="py-1">
      {files.map((file) => (
        <button
          key={file.name}
          type="button"
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent text-left ${selectedFile === file.name ? "bg-accent" : ""}`}
          onClick={() => { if (file.type === "file" && file.content !== undefined) onSelectFile(file.name, file.content); }}
        >
          <span className="text-muted-foreground">{file.type === "directory" ? "📁" : "📄"}</span>
          <span className="truncate">{file.name}</span>
        </button>
      ))}
    </div>
  );
}
