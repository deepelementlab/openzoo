"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ReactRenderer } from "@tiptap/react";
import { computePosition, offset, flip, shift } from "@floating-ui/dom";
import { ActorAvatar } from "../common/actor-avatar";

export interface MentionItem {
  id: string;
  label: string;
  type: "member" | "agent" | "issue" | "all";
  description?: string;
  status?: string;
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: MentionItem) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionGroup {
  label: string;
  items: MentionItem[];
}

function groupItems(items: MentionItem[]): MentionGroup[] {
  const users: MentionItem[] = [];
  const issues: MentionItem[] = [];
  for (const item of items) {
    if (item.type === "issue") {
      issues.push(item);
    } else {
      users.push(item);
    }
  }
  const groups: MentionGroup[] = [];
  if (users.length > 0) groups.push({ label: "Users", items: users });
  if (issues.length > 0) groups.push({ label: "Issues", items: issues });
  return groups;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command],
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((i) => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="rounded-md border bg-popover p-2 text-xs text-muted-foreground shadow-md">
          No results
        </div>
      );
    }

    const groups = groupItems(items);
    let globalIndex = 0;

    return (
      <div className="rounded-md border bg-popover py-1 shadow-md w-72 max-h-[300px] overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {group.label}
            </div>
            {group.items.map((item) => {
              const idx = globalIndex++;
              return (
                <button
                  key={`${item.type}-${item.id}`}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors ${
                    idx === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                  onClick={() => selectItem(idx)}
                >
                  {item.type !== "issue" && (
                    <ActorAvatar
                      actorType={item.type === "all" ? "member" : item.type}
                      actorId={item.id}
                      size={20}
                    />
                  )}
                  <span className="truncate font-medium">{item.label}</span>
                  {item.type === "agent" && (
                    <span className="ml-auto text-[10px] border rounded px-1.5 py-0.5">Agent</span>
                  )}
                  {item.description && (
                    <span className="truncate text-muted-foreground">{item.description}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  },
);

export { MentionList };

export function createMentionSuggestion(
  getItems: (query: string) => MentionItem[],
): Omit<import("@tiptap/suggestion").SuggestionOptions<MentionItem>, "editor"> {
  return {
    items: ({ query }) => getItems(query.toLowerCase()).slice(0, 10),
    render: () => {
      let renderer: ReactRenderer<MentionListRef> | null = null;
      let popup: HTMLDivElement | null = null;

      return {
        onStart: (props) => {
          renderer = new ReactRenderer(MentionList, {
            props: { items: props.items, command: props.command },
            editor: props.editor,
          });
          popup = document.createElement("div");
          popup.style.position = "fixed";
          popup.style.zIndex = "50";
          popup.appendChild(renderer.element);
          document.body.appendChild(popup);
          updatePosition(popup, props.clientRect);
        },
        onUpdate: (props) => {
          renderer?.updateProps({ items: props.items, command: props.command });
          if (popup) updatePosition(popup, props.clientRect);
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            cleanup();
            return true;
          }
          return renderer?.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => { cleanup(); },
      };

      function updatePosition(
        el: HTMLDivElement,
        clientRect: (() => DOMRect | null) | null | undefined,
      ) {
        if (!clientRect) return;
        const virtualEl = {
          getBoundingClientRect: () => clientRect() ?? new DOMRect(),
        };
        computePosition(virtualEl, el, {
          placement: "bottom-start",
          strategy: "fixed",
          middleware: [offset(4), flip(), shift({ padding: 8 })],
        }).then(({ x, y }) => {
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        });
      }

      function cleanup() {
        renderer?.destroy();
        renderer = null;
        popup?.remove();
        popup = null;
      }
    },
  };
}
