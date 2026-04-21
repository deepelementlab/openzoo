"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Button } from "@openzoo/ui/components/button";

export function PingSection({ runtimeId }: { runtimeId: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "running" | "completed" | "failed">("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleTest = async () => {
    cleanup();
    setTesting(true);
    setStatus("pending");
    setOutput("");
    setError("");

    try {
      const res = await fetch(`/api/v1/runtimes/${runtimeId}/ping`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to initiate ping");
      const { id: pingId } = await res.json();

      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/v1/runtimes/${runtimeId}/pings/${pingId}`);
          const result = await r.json();
          if (result.status === "completed") {
            setOutput(result.output ?? "OK");
            setStatus("completed");
            setTesting(false);
            cleanup();
          } else if (result.status === "failed") {
            setError(result.error ?? "Unknown error");
            setStatus("failed");
            setTesting(false);
            cleanup();
          }
        } catch {
          // ignore poll errors
        }
      }, 2000);
    } catch {
      setStatus("failed");
      setError("Failed to initiate test");
      setTesting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
          {testing ? "Testing..." : "Test Connection"}
        </Button>
        {status === "completed" && (
          <span className="inline-flex items-center gap-1 text-xs text-green-500">
            <CheckCircle2 className="h-3 w-3" /> Connected
          </span>
        )}
        {status === "failed" && (
          <span className="inline-flex items-center gap-1 text-xs text-red-500">
            <XCircle className="h-3 w-3" /> Failed
          </span>
        )}
      </div>
      {status === "completed" && output && (
        <div className="rounded-lg border bg-green-50 px-3 py-2">
          <pre className="text-xs font-mono whitespace-pre-wrap">{output}</pre>
        </div>
      )}
      {status === "failed" && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
}
