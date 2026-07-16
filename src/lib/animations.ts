"use client";

import { useCallback } from "react";

/* ─── CSS Transition Helpers ─── */
export const transitionFast = {
  className: "transition-fast",
  style: { transition: "120ms cubic-bezier(0.16, 1, 0.3, 1)" } as React.CSSProperties,
};

export const transitionBase = {
  className: "transition-base",
  style: { transition: "220ms cubic-bezier(0.16, 1, 0.3, 1)" } as React.CSSProperties,
};

export const transitionSlow = {
  className: "transition-slow",
  style: { transition: "400ms cubic-bezier(0.16, 1, 0.3, 1)" } as React.CSSProperties,
};

/* ─── Staggered Entry Hook ─── */
export function useStaggerEntry(delayBase = 0, staggerMs = 80) {
  const getStyle = useCallback(
    (index: number): React.CSSProperties => ({
      animation: `slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both`,
      animationDelay: `${delayBase + index * staggerMs}ms`,
    }),
    [delayBase, staggerMs]
  );
  return getStyle;
}

/* ─── Scroll Observer (reduced, CSS-driven) ─── */
export function observeEntries(
  refs: (HTMLElement | null)[],
  onVisible?: (el: HTMLElement) => void
) {
  if (typeof IntersectionObserver === "undefined") return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-slide-up");
          if (onVisible) onVisible(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 }
  );

  refs.forEach((ref) => {
    if (ref) observer.observe(ref);
  });

  return () => observer.disconnect();
}
