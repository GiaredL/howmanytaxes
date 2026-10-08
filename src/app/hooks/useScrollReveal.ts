"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** 0–1 fraction of the element that must be visible. Keep low for tall sections. */
  threshold?: number;
  rootMargin?: string;
};

/** Fires once when any part of the element enters the viewport. */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  options: Options = {},
) {
  // Tall sections can be taller than the viewport — a high threshold never fires.
  const { threshold = 0, rootMargin = "0px 0px -8% 0px" } = options;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, threshold, rootMargin]);

  return { ref, visible };
}
