import { useHydrated } from "@tanstack/react-router";
import { motion, stagger, useReducedMotion, type MotionProps, type Variants } from "motion/react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

export type RevealVariant = "rise" | "blur" | "zoom" | "left" | "right" | "flip";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  once?: boolean;
  variant?: RevealVariant;
};

export const revealViewport = { amount: 0.2, margin: "0px 0px -10% 0px" } as const;
export const revealSpring = { type: "spring", stiffness: 120, damping: 16, mass: 0.8 } as const;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const instant = { duration: 0 };
const staticPose = { opacity: 1, filter: "none", transform: "none", transition: instant };

function subscribeToReducedMotion(update: () => void) {
  const preference = window.matchMedia(reducedMotionQuery);
  preference.addEventListener("change", update);
  return () => preference.removeEventListener("change", update);
}

function readReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

const poses = {
  rise: { hidden: { y: 60 }, visible: { y: 0 } },
  blur: {
    hidden: { filter: "blur(12px)", y: 40, scale: 0.94 },
    visible: { filter: "blur(0px)", y: 0, scale: 1 },
  },
  zoom: { hidden: { scale: 0.8 }, visible: { scale: 1 } },
  left: { hidden: { x: -80, rotate: -4 }, visible: { x: 0, rotate: 0 } },
  right: { hidden: { x: 80, rotate: 4 }, visible: { x: 0, rotate: 0 } },
  flip: {
    hidden: { transformPerspective: 900, rotateX: 35 },
    visible: { transformPerspective: 900, rotateX: 0, transitionEnd: { transform: "none" } },
  },
} satisfies Record<RevealVariant, Variants>;

export function useRevealMotion() {
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  // Also update mounted effects when the system preference changes mid-visit.
  const livePreference = useSyncExternalStore(subscribeToReducedMotion, readReducedMotion, () => null);
  return hydrated && !(livePreference ?? reduced) && typeof IntersectionObserver !== "undefined";
}

function entrance(variant: RevealVariant, delay?: number): Variants {
  const pose = poses[variant];
  const timing = delay === undefined ? {} : { delay };
  return {
    hidden: { opacity: 0, ...pose.hidden, transition: instant },
    visible: {
      opacity: 1,
      ...pose.visible,
      transition: {
        ...revealSpring,
        ...timing,
        opacity: { duration: 0.36, ...timing },
        filter: { duration: 0.5, ...timing },
      },
    },
  };
}

export function Reveal({ children, delay = 0, as = "div", className, once = true, variant = "blur" }: RevealProps) {
  const enabled = useRevealMotion();
  const [focused, setFocused] = useState(false);
  const Element = motion[as];

  return (
    <Element
      className={className}
      initial={false}
      animate={enabled ? (focused ? "visible" : "hidden") : staticPose}
      {...(enabled ? { variants: entrance(variant, delay / 1000), whileInView: "visible", viewport: { ...revealViewport, once } } : {})}
      onFocusCapture={() => setFocused(true)}
    >
      {children}
    </Element>
  );
}

const cascade: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: stagger(0.12, { startDelay: 0.1 }) } },
};

export function RevealStagger({ children, as = "div", className, once = true }: Omit<RevealProps, "delay" | "variant">) {
  const enabled = useRevealMotion();
  const [focused, setFocused] = useState(false);
  const Element = motion[as];
  return (
    <Element
      className={className}
      initial={false}
      variants={cascade}
      animate={enabled ? (focused ? "visible" : "hidden") : "static"}
      {...(enabled ? { whileInView: "visible", viewport: { ...revealViewport, once } } : {})}
      onFocusCapture={() => setFocused(true)}
    >
      {children}
    </Element>
  );
}

export function RevealItem({ children, as = "div", className, variant = "blur", lift = false, onViewportEnter }: Pick<RevealProps, "children" | "as" | "className" | "variant"> & { lift?: boolean; onViewportEnter?: MotionProps["onViewportEnter"] }) {
  const enabled = useRevealMotion();
  const Element = motion[as];
  return (
    <Element
      className={className}
      variants={enabled ? entrance(variant) : { static: staticPose }}
      {...(enabled && lift ? { whileHover: { scale: 1.02, y: -6, rotate: -0.5, transition: revealSpring } } : {})}
      {...(enabled && onViewportEnter ? { onViewportEnter, viewport: { ...revealViewport, once: true } } : {})}
    >
      {children}
    </Element>
  );
}

export function RevealStepIcon({ children, className }: Pick<RevealProps, "children" | "className">) {
  const enabled = useRevealMotion();
  return (
    <motion.span
      className={className}
      initial={false}
      variants={enabled ? {
        hidden: { rotate: -20, transition: { duration: 0 } },
        visible: { rotate: 0, transition: revealSpring },
      } : { static: { rotate: 0, transition: { duration: 0 } } }}
    >
      {children}
    </motion.span>
  );
}
