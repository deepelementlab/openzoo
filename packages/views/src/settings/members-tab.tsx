import React, { useEffect, useState, useCallback } from "react";
import { useAuthStore, useWorkspaceStore, listMembers, createMember, updateMember, deleteMember } from "@openzoo/core";
import type { MemberWithUser, MemberRole } from "@openzoo/core";
import { Input } from "@openzoo/ui";
import { Button } from "@openzoo/ui";
import { Card } from "@openzoo/ui";
import { Badge } from "@openzoo/ui";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@openzoo/ui";

const roleConfig: Record<MemberRole, { label: string; description: string }> = {
  owner: { label: "Owner", description: "Full access, manage all settings" },
  admin: { label: "Admin", description: "Manage members and settings" },
  member: { label: "Member", description: "Create and work on issues" },
};

const roleBadgeVariant: Record<MemberRole, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

export function MembersTab() {
  const user = useAuthStore((s) => s.user);
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviting, setInviting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!workspace) return;
    setLoading(true);
    try {
      const list = await listMembers(workspace.id);
      setMembers(list);
    } catch (e) {
      console.error("Failed to load members:", e);
    } finally {
      setLoading(false);
    }
  }, [workspace]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const currentMember = members.find((m) => m.user_id === user?.id) ?? null;
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  const handleInvite = async () => {
    if (!workspace || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await createMember(workspace.id, inviteEmail, inviteRole);
      await loadMembers();
      setInviteEmail("");
      setInviteRole("member");
      setInviteOpen(false);
    } catch (e) {
      console.error("Failed to invite member:", e);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    if (!workspace) return;
    setChangingRole(memberId);
    setRoleMenuOpen(null);
    try {
      await updateMember(workspace.id, memberId, role);
      await loadMembers();
    } catch (e) {
      console.error("Failed to change role:", e);
    } finally {
      setChangingRole(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!workspace) return;
    setRemoving(memberId);
    setRoleMenuOpen(null);
    try {
      await deleteMember(workspace.id, memberId);
      await loadMembers();
    } catch (e) {
      console.error("Failed to remove member:", e);
    } finally {
      setRemoving(null);
    }
  };

  if (!workspace) return null;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Members ({members.length})</h2>
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Invite Member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                    >
                      {(Object.entries(roleConfig) as [MemberRole, typeof roleConfig[MemberRole]][]).map(([role, config]) => (
                        <option key={role} value={role}>{config.label} - {config.description}</option>
                      ))}
                    </select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
                    <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                      {inviting ? "Inviting..." : "Send Invite"}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {members.map((member) => {
              const isSelf = member.user_id === user?.id;
              const canEdit = canManage && !isSelf && member.role !== "owner";

              return (
                <Card key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{member.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {member.name}
                      {isSelf && <span className="text-muted-foreground ml-1">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                  </div>
                  <Badge variant={roleBadgeVariant[member.role]}>{roleConfig[member.role].label}</Badge>
                  {canEdit && (
                    <div className="relative inline-flex">
                      <button
                        className="text-sm px-2 py-1 rounded hover:bg-muted"
                        onClick={() => setRoleMenuOpen(roleMenuOpen === member.id ? null : member.id)}
                      >
                        ...
                      </button>
                      {roleMenuOpen === member.id && (
                        <div className="absolute right-0 top-full z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md">
                          {(Object.entries(roleConfig) as [MemberRole, typeof roleConfig[MemberRole]][]).map(([role, config]) => (
                            <button
                              key={role}
                              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent"
                              disabled={role === member.role || changingRole === member.id}
                              onClick={() => handleRoleChange(member.id, role)}
                            >
                              {config.label}
                            </button>
                          ))}
                          <div className="h-px bg-muted my-1" />
                          <button
                            className="w-full text-left px-2 py-1.5 text-sm rounded text-destructive hover:bg-accent"
                            onClick={() => handleRemove(member.id)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
