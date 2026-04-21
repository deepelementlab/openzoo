import React, { useEffect, useState } from "react";

const themeOptions = [
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" },
  { value: "system" as const, label: "System" },
];

const LIGHT_COLORS = {
  titleBar: "#e8e8e8",
  content: "#ffffff",
  sidebar: "#f4f4f5",
  bar: "#e4e4e7",
  barMuted: "#d4d4d8",
};

const DARK_COLORS = {
  titleBar: "#333338",
  content: "#27272a",
  sidebar: "#1e1e21",
  bar: "#3f3f46",
  barMuted: "#52525b",
};

function WindowMockup({ variant }: { variant: "light" | "dark" }) {
  const colors = variant === "light" ? LIGHT_COLORS : DARK_COLORS;

  return (
    <div className="flex h-full w-full flex-col rounded-md border overflow-hidden">
      <div
        className="flex items-center gap-[3px] px-2 py-1.5"
        style={{ backgroundColor: colors.titleBar }}
      >
        <span className="size-[6px] rounded-full bg-[#ff5f57]" />
        <span className="size-[6px] rounded-full bg-[#febc2e]" />
        <span className="size-[6px] rounded-full bg-[#28c840]" />
      </div>
      <div className="flex flex-1" style={{ backgroundColor: colors.content }}>
        <div className="w-[30%] space-y-1 p-2" style={{ backgroundColor: colors.sidebar }}>
          <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: colors.bar }} />
          <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: colors.bar }} />
        </div>
        <div className="flex-1 space-y-1.5 p-2">
          <div className="h-1.5 w-4/5 rounded-full" style={{ backgroundColor: colors.bar }} />
          <div className="h-1 w-full rounded-full" style={{ backgroundColor: colors.barMuted }} />
          <div className="h-1 w-3/5 rounded-full" style={{ backgroundColor: colors.barMuted }} />
        </div>
      </div>
    </div>
  );
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppearanceTab() {
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const stored = localStorage.getItem("openzoo_theme") as "light" | "dark" | "system" | null;
    if (stored) setThemeState(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const effective = theme === "system" ? getSystemTheme() : theme;
    root.classList.remove("light", "dark");
    root.classList.add(effective);
    localStorage.setItem("openzoo_theme", theme);
  }, [theme]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Theme</h2>
        <div className="flex gap-6" role="radiogroup" aria-label="Theme">
          {themeOptions.map((opt) => {
            const active = theme === opt.value;
            const preview = opt.value === "system" ? getSystemTheme() : opt.value;
            return (
              <button
                key={opt.value}
                role="radio"
                aria-checked={active}
                onClick={() => setThemeState(opt.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors ${
                  active ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                <div className="h-20 w-32">
                  <WindowMockup variant={preview} />
                </div>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
