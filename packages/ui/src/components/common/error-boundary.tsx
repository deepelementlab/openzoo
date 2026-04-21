import * as React from "react";
import { AlertTriangle, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
      }
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again or refresh the page.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-colors",
            )}
          >
            <RotateCcw className="size-4" />
            Try Again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cn(
              "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
              "border border-border bg-background hover:bg-secondary",
              "transition-colors",
            )}
          >
            Refresh Page
          </button>
        </div>
        <div className="text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            Error details
          </button>
          {showDetails && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

const ErrorBoundary = ErrorBoundaryInner;

export { ErrorBoundary };
