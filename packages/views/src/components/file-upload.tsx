import { useState, useCallback, useRef } from "react";
import { Button, Progress } from "@openzoo/ui";
import { X, Upload, File } from "lucide-react";

interface FileUploadProps {
  onUpload?: (files: FileUploadResult[]) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
}

interface FileUploadResult {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

export function FileUpload({
  onUpload,
  accept = "*/*",
  maxSize = 10,
  multiple = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const newFiles: FileUploadResult[] = Array.from(fileList).map((file) => {
        if (file.size > maxSize * 1024 * 1024) {
          return {
            file,
            progress: 0,
            status: "error" as const,
            error: `File size exceeds ${maxSize}MB limit`,
          };
        }
        return {
          file,
          progress: 0,
          status: "uploading" as const,
        };
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Simulate upload progress
      newFiles.forEach((f, idx) => {
        if (f.status === "error") return;

        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 30;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setFiles((prev) => {
              const updated = [...prev];
              const targetIdx = prev.length - newFiles.length + idx;
              if (updated[targetIdx]) {
                updated[targetIdx] = {
                  ...updated[targetIdx],
                  progress: 100,
                  status: "success",
                  url: `/api/files/simulated-${Date.now()}`,
                };
              }
              return updated;
            });
            if (onUpload) {
              onUpload(newFiles.filter((nf) => nf.status !== "error"));
            }
          } else {
            setFiles((prev) => {
              const updated = [...prev];
              const targetIdx = prev.length - newFiles.length + idx;
              if (updated[targetIdx]) {
                updated[targetIdx] = {
                  ...updated[targetIdx],
                  progress,
                };
              }
              return updated;
            });
          }
        }, 200);
      });
    },
    [maxSize, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop files here, or click to select
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Max file size: {maxSize}MB
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{f.file.name}</p>
                {f.status === "uploading" && (
                  <Progress value={f.progress} className="h-1 mt-1" />
                )}
                {f.status === "error" && (
                  <p className="text-xs text-red-500 mt-1">{f.error}</p>
                )}
                {f.status === "success" && (
                  <p className="text-xs text-green-500 mt-1">Upload complete</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
