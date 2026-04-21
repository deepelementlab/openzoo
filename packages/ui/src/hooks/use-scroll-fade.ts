import { useEffect, useState, type RefObject } from "react";

export function useScrollFade(ref: RefObject<HTMLElement | null>) {
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setFadeTop(scrollTop > 4);
      setFadeBottom(scrollTop + clientHeight < scrollHeight - 4);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [ref]);

  return { fadeTop, fadeBottom };
}
