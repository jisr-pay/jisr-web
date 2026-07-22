import { useEffect, useRef, type RefObject } from "react";

/**
 * Tracks scroll progress (0 -> 1) through a tall container.
 * Returns a ref (not state) so consumers can read it inside a
 * requestAnimationFrame / useFrame loop without forcing React
 * re-renders on every scroll pixel.
 */
export function useScrollProgress(containerRef: RefObject<HTMLElement | null>) {
  const progressRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId: number;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const raw = total > 0 ? scrolled / total : 0;
      progressRef.current = Math.min(1, Math.max(0, raw));
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [containerRef]);

  return progressRef;
}
