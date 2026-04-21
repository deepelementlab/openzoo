import { useEffect, useState } from "react";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint}px)`);
}

function useAutoScroll(deps: unknown[] = []) {
  const ref = { current: null as HTMLDivElement | null };
  const scrollToBottom = () => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, deps);
  return { ref, scrollToBottom };
}

export { useMediaQuery, useIsMobile, useAutoScroll };
