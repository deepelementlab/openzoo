import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

export interface TitleEditorProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onSubmit?: (value: string) => void;
}

export const TitleEditor: React.FC<TitleEditorProps> = ({
  value,
  onChange,
  placeholder = "Untitled",
  className,
  disabled = false,
  onSubmit,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit(value);
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (inputRef.current && value) {
      inputRef.current.select();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-0",
        className,
      )}
    />
  );
};
