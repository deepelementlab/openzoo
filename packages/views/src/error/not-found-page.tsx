import * as React from "react";
import { Home, ArrowLeft } from "lucide-react";

interface NotFoundPageProps {
  onGoHome?: () => void;
  onGoBack?: () => void;
}

function NotFoundPage({ onGoHome, onGoBack }: NotFoundPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-muted-foreground/30">404</h1>
          <h2 className="text-xl font-semibold">Page Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          {onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium bg-background hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="size-4" />
              Go Back
            </button>
          )}
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Home className="size-4" />
              Go Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { NotFoundPage };
