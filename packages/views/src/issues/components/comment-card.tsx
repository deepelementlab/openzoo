"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card } from "@openzoo/ui/components/card";
import { Button } from "@openzoo/ui/components/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@openzoo/ui/components/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@openzoo/ui/components/alert-dialog";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@openzoo/ui/components/collapsible";
import { ActorAvatar } from "@openzoo/ui/components/common/actor-avatar";
import { ReactionBar } from "@openzoo/ui/components/common/reaction-bar";
import { cn } from "@openzoo/ui/lib/utils";
import { Markdown } from "@openzoo/ui/components/markdown/markdown";
import { ReplyInput } from "./reply-input";
import type { Comment } from "@openzoo/core/types";

interface CommentCardProps {
  comment: Comment;
  replies?: Comment[];
  currentUserId?: string;
  onReply?: (parentId: string, content: string) => Promise<void>;
  onEdit?: (commentId: string, content: string) => Promise<void>;
  onDelete?: (commentId: string) => void;
  onToggleReaction?: (commentId: string, emoji: string) => void;
  highlightedCommentId?: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentCard({
  comment,
  replies = [],
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onToggleReaction,
  highlightedCommentId,
}: CommentCardProps) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isOwn = comment.author_type === "member" && comment.author_id === currentUserId;
  const isTemp = comment.id.startsWith("temp-");
  const isHighlighted = highlightedCommentId === comment.id;

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent.trim() === comment.content.trim()) {
      setEditing(false);
      return;
    }
    await onEdit?.(comment.id, editContent.trim());
    setEditing(false);
  };

  const contentPreview = comment.content.replace(/\n/g, " ").slice(0, 80);

  return (
    <Card className={cn("!py-0 !gap-0 overflow-hidden", isTemp && "opacity-60", isHighlighted && "ring-2 ring-blue-500/50 bg-blue-50/5")}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CollapsibleTrigger className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <svg className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </CollapsibleTrigger>
            <ActorAvatar actorType={comment.author_type} actorId={comment.author_id} size={24} />
            <span className="shrink-0 text-sm font-medium">{comment.author_type === "agent" ? "Agent" : "You"}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
            {!open && contentPreview && <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{contentPreview}</span>}
            {!open && replies.length > 0 && <span className="shrink-0 text-xs text-muted-foreground">{replies.length} {replies.length === 1 ? "reply" : "replies"}</span>}
            {open && !isTemp && (
              <div className="ml-auto flex items-center gap-0.5">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(comment.content)}>Copy</DropdownMenuItem>
                    {isOwn && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setEditing(true)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-3">
            {editing ? (
              <div className="pl-10" onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full min-h-[60px] rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" variant="outline" onClick={handleSaveEdit}>Save</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="pl-10 text-sm leading-relaxed text-foreground/85">
                  <Markdown content={comment.content} />
                </div>
                {!isTemp && comment.reactions.length > 0 && (
                  <ReactionBar
                    reactions={comment.reactions.map((r) => ({ ...r, user_id: r.actor_id }))}
                    currentUserId={currentUserId}
                    onToggle={(emoji) => onToggleReaction?.(comment.id, emoji)}
                    className="mt-1.5 pl-10"
                  />
                )}
              </>
            )}
          </div>

          {replies.map((reply) => (
            <div key={reply.id} className={cn("border-t border-border/50 px-4 py-3", highlightedCommentId === reply.id && "bg-blue-50/5")}>
              <div className="flex items-center gap-2.5">
                <ActorAvatar actorType={reply.author_type} actorId={reply.author_id} size={20} />
                <span className="text-sm font-medium">{reply.author_type === "agent" ? "Agent" : "You"}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(reply.created_at)}</span>
              </div>
              <div className="mt-1.5 pl-8 text-sm leading-relaxed text-foreground/85">
                <Markdown content={reply.content} />
              </div>
            </div>
          ))}

          {onReply && (
            <div className="border-t border-border/50 px-4 py-2.5">
              <ReplyInput
                placeholder="Leave a reply..."
                size="sm"
                avatarType="member"
                avatarId={currentUserId ?? ""}
                onSubmit={(content) => onReply(comment.id, content)}
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment</AlertDialogTitle>
            <AlertDialogDescription>
              {replies.length > 0
                ? "This comment and all its replies will be permanently deleted. This cannot be undone."
                : "This comment will be permanently deleted. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.(comment.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
