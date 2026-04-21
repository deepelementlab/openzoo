import * as React from "react";
import { cn } from "../../lib/utils";

const colorPalette = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
  "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-blue-500", "bg-indigo-500", "bg-violet-500",
  "bg-purple-500", "bg-fuchsia-500", "bg-pink-500", "bg-rose-500",
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

interface ActorAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  isAgent?: boolean;
}

function ActorAvatar({ name, src, size = "md", isAgent, className, ...props }: ActorAvatarProps) {
  const sizeClasses = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-sm", lg: "h-10 w-10 text-base" };
  const initials = name.slice(0, 2).toUpperCase();

  if (src) {
    return (
      <img src={src} alt={name} className={cn("rounded-full object-cover", sizeClasses[size], className)} {...props} />
    );
  }

  return (
    <div
      className={cn("flex items-center justify-center rounded-full font-medium text-white", sizeClasses[size], colorFromName(name), className)}
      {...props}
    >
      {isAgent ? "🤖" : initials}
    </div>
  );
}

export { ActorAvatar };
