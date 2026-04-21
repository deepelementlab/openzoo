"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface InputOTPProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function InputOTP({
  length = 6,
  value = "",
  onChange,
  className,
}: InputOTPProps) {
  const inputs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    const newValue = value.split("");
    newValue[index] = char;
    const joined = newValue.join("").slice(0, length);
    onChange?.(joined);
    if (char && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, length);
    onChange?.(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputs.current[focusIndex]?.focus();
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-10 w-10 rounded-md border bg-background text-center text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      ))}
    </div>
  );
}
