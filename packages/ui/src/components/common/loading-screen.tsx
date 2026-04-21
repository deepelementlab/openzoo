import * as React from "react";
import { cn } from "../../lib/utils";

function LoadingScreen({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-screen items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-10">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[400px] items-center justify-center p-8", className)}>
      <div className="w-full max-w-4xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}

export { LoadingScreen, LoadingSkeleton };
