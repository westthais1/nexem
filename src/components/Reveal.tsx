import { createElement, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  once?: boolean;
};

export function Reveal({ children, delay = 0, as = "div", className, once = true }: RevealProps) {
  const elementRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<"static" | "hidden" | "visible">("static");

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let revealed = false;

    function updateObserver() {
      observer?.disconnect();
      if (reducedMotion.matches) {
        setPhase("static");
        return;
      }
      if (once && revealed) return;

      setPhase("hidden");
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry || reducedMotion.matches) return;
          if (entry.isIntersecting) {
            revealed = true;
            setPhase("visible");
            if (once) observer?.disconnect();
          } else if (!once) {
            setPhase("hidden");
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
      );
      if (element) observer.observe(element);
    }

    updateObserver();
    reducedMotion.addEventListener("change", updateObserver);
    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener("change", updateObserver);
    };
  }, [as, once]);

  return createElement(
    as,
    {
      ref: elementRef,
      className: cn(
        className,
        phase === "hidden" &&
          "opacity-0 translate-y-6 focus-within:opacity-100 focus-within:translate-y-0 motion-reduce:opacity-100 motion-reduce:translate-y-0",
        phase === "visible" &&
          "opacity-100 translate-y-0 transition-all duration-700 ease-out motion-reduce:transition-none",
      ),
      style: phase === "visible" ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  );
}