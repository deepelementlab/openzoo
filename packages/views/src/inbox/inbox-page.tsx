import React from "react";
import { listInbox, markInboxRead, markAllInboxRead, type InboxItem } from "@openzoo/core";
import { Button, Badge, Card, CardContent } from "@openzoo/ui";
import { getWorkspaceId } from "@openzoo/core";

export function InboxPage() {
  const [items, setItems] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const wsId = getWorkspaceId();

  const loadInbox = React.useCallback(() => {
    if (!wsId) return;
    listInbox({ workspace_id: wsId }).then((res) => {
      setItems(res.items ?? []);
      setUnreadCount(res.unread_count ?? 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [wsId]);

  React.useEffect(() => { loadInbox(); }, [loadInbox]);

  const handleMarkAllRead = async () => {
    if (!wsId) return;
    await markAllInboxRead(wsId);
    loadInbox();
  };

  if (!wsId) return <div className="p-8 text-center text-muted-foreground">Select a workspace first</div>;
  if (loading) return <div className="p-8 text-center">Loading inbox...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Inbox</h2>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={handleMarkAllRead}>Mark all read</Button>}
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No notifications</div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <Card key={item.id} className={item.is_read ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.message && <p className="text-xs text-muted-foreground mt-1">{item.message}</p>}
                  </div>
                  <Badge variant={item.severity === "action_required" ? "destructive" : item.severity === "attention" ? "default" : "secondary"}>
                    {(item.type ?? "").replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

