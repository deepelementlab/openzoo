import * as React from "react";
import { cn } from "../lib/utils";

interface ItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  selected?: boolean;
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, title, description, icon, actions, selected, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        selected && "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{title}</div>
        {description && (
          <div className="text-xs text-muted-foreground truncate">{description}</div>
        )}
      </div>
      {actions && <span className="shrink-0">{actions}</span>}
    </div>
  ),
);
Item.displayName = "Item";

export { Item };
