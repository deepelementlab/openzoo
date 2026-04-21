"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-md border px-4 py-3 shadow-lg transition-all",
              "bg-background text-foreground",
              toast.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                {toast.title && (
                  <p className="text-sm font-semibold">{toast.title}</p>
                )}
                {toast.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 rounded-md p-0.5 hover:bg-secondary"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function toast(opts: Omit<Toast, "id">) {
  const event = new CustomEvent("openzoo-toast", { detail: opts });
  window.dispatchEvent(event);
}
