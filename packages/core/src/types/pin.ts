export type PinnedItemType = "issue" | "project";

export interface PinnedItem {
  id: string;
  workspace_id: string;
  user_id: string;
  item_type: PinnedItemType;
  item_id: string;
  position: number;
  created_at: string;
  title: string;
  identifier?: string;
  status?: string;
}

export interface CreatePinRequest {
  item_type: PinnedItemType;
  item_id: string;
}

export interface ReorderPinsRequest {
  pins: { id: string; position: number }[];
}
