import * as React from "react";
import { CheckCircle, XCircle, Terminal, Loader2 } from "lucide-react";
import { useAuthStore, setToken, getApiClient, type User } from "@openzoo/core";

interface CallbackPageProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function CallbackPage({ onSuccess, onError }: CallbackPageProps) {
  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = React.useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const params = React.useMemo(() => new URLSearchParams(window.location.search), []);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const isCliCallback = params.get("cli_callback") === "true";
  const cliState = params.get("cli_state");

  React.useEffect(() => {
    if (error) {
      setStatus("error");
      setErrorMsg(params.get("error_description") || error);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMsg("No authorization code received.");
      return;
    }

    (async () => {
      try {
        const result = await getApiClient().call<{ token: string; user: User }>(
          "/rpc/auth/oauth/callback",
          { code, state },
        );
        setToken(result.token);
        setAuth(result.user, result.token);

        if (isCliCallback) {
          setStatus("success");
          return;
        }

        onSuccess?.();
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(e.message || "OAuth callback failed");
        onError?.(e.message);
      }
    })();
  }, [code, state, error, isCliCallback]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (status === "success" && isCliCallback) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <CheckCircle className="size-12 text-green-500" />
          <h1 className="text-xl font-semibold">Authentication Successful</h1>
          <p className="text-sm text-muted-foreground">
            You can now return to your terminal to continue.
          </p>
          {cliState && (
            <div className="mt-4 flex items-center gap-2 rounded-md bg-muted p-3 text-sm">
              <Terminal className="size-4 text-muted-foreground" />
              <code className="text-xs text-muted-foreground">State: {cliState}</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <XCircle className="size-12 text-destructive" />
          <h1 className="text-xl font-semibold">Authentication Failed</h1>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            type="button"
            onClick={() => window.location.href = "/"}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export { CallbackPage };
