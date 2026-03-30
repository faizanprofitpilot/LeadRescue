"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** Extra delay (ms) after the element enters view before the transition runs */
  delay?: number;
};

/**
 * Fades in and rises slightly when scrolled into view. Respects prefers-reduced-motion.
 */
export function RevealOnView({ children, className, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setActive(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          obs.disconnect();
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.06 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "motion-reduce:translate-y-0 motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none",
        active &&
          "transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        active ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
      style={
        active && delay > 0
          ? { transitionDelay: `${delay}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}
