import React, { useEffect, useState } from "react";
import { useAuthStore, updateCurrentUser } from "@openzoo/core";
import { Input } from "@openzoo/ui";
import { Button } from "@openzoo/ui";
import { Card } from "@openzoo/ui";

export function AccountTab() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setAuth);
  const [profileName, setProfileName] = useState(user?.name ?? "");
  const [profileEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfileName(user?.name ?? "");
  }, [user]);

  const initials = (user?.name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleProfileSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateCurrentUser({ name: profileName });
      setUser(updated, useAuthStore.getState().token!);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error("Failed to update profile:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Profile</h2>
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{user?.name ?? "Unknown"}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={profileName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={profileEmail} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleProfileSave} disabled={saving || profileName === user?.name}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
