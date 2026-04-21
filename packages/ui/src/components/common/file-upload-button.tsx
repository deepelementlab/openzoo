"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button";

interface FileUploadButtonProps {
  onUpload: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileUploadButton({
  onUpload,
  accept,
  multiple = false,
  className,
  children,
}: FileUploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      onUpload(files);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-8", className)}
        onClick={handleClick}
      >
        {children ?? <Upload className="size-4" />}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}
