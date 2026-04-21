"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

interface CarouselContextValue {
  currentIndex: number;
  total: number;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) throw new Error("useCarousel must be used within Carousel");
  return ctx;
}

export function Carousel({ children, className }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const items = React.Children.toArray(children);
  const total = items.length;

  const goTo = React.useCallback((i: number) => {
    setCurrentIndex(Math.max(0, Math.min(i, total - 1)));
  }, [total]);

  const next = React.useCallback(() => {
    setCurrentIndex((i) => (i + 1) % total);
  }, [total]);

  const prev = React.useCallback(() => {
    setCurrentIndex((i) => (i - 1 + total) % total);
  }, [total]);

  return (
    <CarouselContext.Provider value={{ currentIndex, total, goTo, next, prev }}>
      <div className={cn("relative", className)}>
        {items[currentIndex]}
      </div>
    </CarouselContext.Provider>
  );
}

export function CarouselContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden", className)}>{children}</div>;
}

export function CarouselPrevious({ className }: { className?: string }) {
  const { prev } = useCarousel();
  return (
    <button
      type="button"
      onClick={prev}
      className={cn(
        "absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow hover:bg-background",
        className,
      )}
    >
      <ChevronLeft className="size-4" />
    </button>
  );
}

export function CarouselNext({ className }: { className?: string }) {
  const { next } = useCarousel();
  return (
    <button
      type="button"
      onClick={next}
      className={cn(
        "absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow hover:bg-background",
        className,
      )}
    >
      <ChevronRight className="size-4" />
    </button>
  );
}

export function CarouselDots({ className }: { className?: string }) {
  const { currentIndex, total, goTo } = useCarousel();
  return (
    <div className={cn("flex justify-center gap-1.5 mt-2", className)}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => goTo(i)}
          className={cn(
            "size-2 rounded-full transition-colors",
            i === currentIndex ? "bg-primary" : "bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}
