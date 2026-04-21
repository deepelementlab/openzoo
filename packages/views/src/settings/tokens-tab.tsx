import React, { useEffect, useState, useCallback } from "react";
import { getApiClient } from "@openzoo/core";
import { Input } from "@openzoo/ui";
import { Button } from "@openzoo/ui";
import { Card } from "@openzoo/ui";
import { Badge } from "@openzoo/ui";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";

interface PersonalAccessToken {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
}

export function TokensTab() {
  const [tokens, setTokens] = useState<PersonalAccessToken[]>([]);
  const [tokenName, setTokenName] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState("90");
  const [tokenCreating, setTokenCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadTokens = useCallback(async () => {
    try {
      const res = await getApiClient().call<{ tokens: PersonalAccessToken[] }>("/rpc/pat/list");
      setTokens(res.tokens ?? []);
    } catch (e) {
      console.error("Failed to load tokens:", e);
    } finally {
      setTokensLoading(false);
    }
  }, []);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const handleCreateToken = async () => {
    if (!tokenName.trim()) return;
    setTokenCreating(true);
    try {
      const expiresInDays = tokenExpiry === "never" ? undefined : Number(tokenExpiry);
      const res = await getApiClient().call<{ token: string; pat: PersonalAccessToken }>("/rpc/pat/create", {
        name: tokenName,
        expires_in_days: expiresInDays,
      });
      setNewToken(res.token);
      setTokenName("");
      setTokenExpiry("90");
      await loadTokens();
    } catch (e: any) {
      console.error("Failed to create token:", e);
    } finally {
      setTokenCreating(false);
    }
  };

  const handleRevokeToken = async (id: string) => {
    try {
      await getApiClient().call("/rpc/pat/delete", { pat_id: id });
      await loadTokens();
    } catch (e) {
      console.error("Failed to revoke token:", e);
    }
  };

  const handleCopyToken = async () => {
    if (!newToken) return;
    await navigator.clipboard.writeText(newToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Personal Access Tokens</h2>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Create Token</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Personal Access Token</DialogTitle>
              </DialogHeader>
              {newToken ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Copy your token now. You won&apos;t be able to see it again.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted p-2 text-xs break-all">{newToken}</code>
                    <Button size="sm" variant="outline" onClick={handleCopyToken}>
                      {tokenCopied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setNewToken(null); setCreateOpen(false); }}>Done</Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Name</label>
                    <Input
                      value={tokenName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenName(e.target.value)}
                      placeholder="e.g. CI/CD Pipeline"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expires In</label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={tokenExpiry}
                      onChange={(e) => setTokenExpiry(e.target.value)}
                    >
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                      <option value="365">1 year</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateToken} disabled={tokenCreating || !tokenName.trim()}>
                      {tokenCreating ? "Creating..." : "Create Token"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {tokensLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : tokens.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No tokens yet. Create one to use the API programmatically.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <Card key={token.id} className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{token.name}</span>
                    <code className="text-xs text-muted-foreground">{token.prefix}...</code>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Created {new Date(token.created_at).toLocaleDateString()}</span>
                    {token.last_used_at && (
                      <span>Last used {new Date(token.last_used_at).toLocaleDateString()}</span>
                    )}
                    {token.expires_at && (
                      <Badge variant="outline">
                        Expires {new Date(token.expires_at).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRevokeToken(token.id)}
                >
                  Revoke
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
