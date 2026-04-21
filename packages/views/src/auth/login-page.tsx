import React, { useState } from "react";
import { useAuthStore } from "@openzoo/core";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@openzoo/ui";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sendCode = useAuthStore((s) => s.sendCode);
  const verifyCode = useAuthStore((s) => s.verifyCode);

  const handleSendCode = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    const ok = await sendCode(email);
    setLoading(false);
    if (ok) setStep("code");
    else setError("Failed to send verification code");
  };

  const handleVerify = async () => {
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      await verifyCode(email, code);
    } catch (e: any) {
      setError(e.message || "Verification failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in to OpenZoo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" ? (
            <>
              <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendCode()} />
              <Button className="w-full" onClick={handleSendCode} disabled={loading || !email}>
                {loading ? "Sending..." : "Send Verification Code"}
              </Button>
            </>
          ) : (
            <>
              <Input placeholder="Verification code" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()} autoFocus />
              <Button className="w-full" onClick={handleVerify} disabled={loading || !code}>
                {loading ? "Verifying..." : "Sign In"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep("email")}>Back</Button>
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
