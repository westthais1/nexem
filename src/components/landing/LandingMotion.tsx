import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { useRevealMotion } from "@/components/Reveal";

/** Thin teal-to-blue bar under the header that tracks reading progress. */
export function ScrollProgress() {
  const enabled = useRevealMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-primary to-accent"
    />
  );
}

/** Soft light that follows the pointer over the hero, with spring lag. Pointer devices only. */
export function HeroSpotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const enabled = useRevealMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 90, damping: 20 });
  const sy = useSpring(y, { stiffness: 90, damping: 20 });
  const background = useMotionTemplate`radial-gradient(420px circle at ${sx}px ${sy}px, color-mix(in oklab, var(--primary) 32%, transparent), transparent 70%)`;

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - box.left);
    y.set(event.clientY - box.top);
  }

  return (
    <div className={className} onPointerMove={enabled ? move : undefined}>
      {enabled && (
        <motion.div
          aria-hidden="true"
          style={{ background }}
          className="pointer-events-none absolute inset-0 z-[1] hidden md:block"
        />
      )}
      {children}
    </div>
  );
}

const chips = [
  {
    icon: Flame,
    label: "Sequência: 12 dias",
    className: "left-[6%] top-[22%]",
    delay: 0.9,
    float: 10,
  },
  { icon: Sparkles, label: "+10 XP", className: "right-[8%] top-[30%]", delay: 1.1, float: -12 },
  {
    icon: Trophy,
    label: "Baú diário aberto",
    className: "left-[10%] bottom-[16%]",
    delay: 1.3,
    float: 8,
  },
] as const;

/** Decorative game chips that pop in and bob around the hero on large screens. */
export function FloatingChips() {
  const enabled = useRevealMotion();
  if (!enabled) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] hidden lg:block">
      {chips.map(({ icon: Icon, label, className, delay, float }) => (
        <motion.div
          key={label}
          className={`absolute ${className}`}
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.7, bounce: 0.25, delay }}
        >
          <motion.span
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md"
            animate={{ y: [0, float, 0], rotate: [0, float > 0 ? 2 : -2, 0] }}
            transition={{
              duration: 5 + delay,
              ease: "easeInOut",
              repeat: Infinity,
              delay: delay + 0.7,
            }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}

/** Marquee that speeds up and changes direction with scroll velocity. Static row without motion. */
export function VelocityMarquee({
  children,
  baseVelocity = -2.5,
}: {
  children: ReactNode;
  baseVelocity?: number;
}) {
  const enabled = useRevealMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smoothVelocity, [-2000, 0, 2000], [8, 0, -8]);
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (!enabled) return;
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    moveBy += direction.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden">
      <motion.div className="flex w-max gap-10 pr-10" {...(enabled ? { style: { x, skewX } } : {})}>
        {children}
        <div className="contents" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/** 3D tilt that follows the pointer with spring damping; inert on touch and with reduced motion. */
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const enabled = useRevealMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [8, -8]), {
    stiffness: 160,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), {
    stiffness: 160,
    damping: 18,
  });
  const glareX = useTransform(px, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(py, [-0.5, 0.5], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(260px circle at ${glareX}% ${glareY}%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)`;

  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - box.left) / box.width - 0.5);
    py.set((event.clientY - box.top) / box.height - 0.5);
    glareOpacity.set(1);
  }
  function leave() {
    px.set(0);
    py.set(0);
    glareOpacity.set(0);
  }

  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={`relative ${className ?? ""}`}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <motion.div
        aria-hidden="true"
        style={{ background: glare, opacity: glareOpacity }}
        className="pointer-events-none absolute inset-0 z-0"
      />
      <div className="relative z-[1] flex h-full flex-col">{children}</div>
    </motion.div>
  );
}

/** Vertical line beside a list that fills as the list scrolls through the viewport. */
export function ScrollLine({ children, className }: { children: ReactNode; className?: string }) {
  const enabled = useRevealMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-[51px] top-0 hidden w-0.5 bg-background/10 md:left-[59px] sm:block"
      />
      {enabled && (
        <motion.div
          aria-hidden="true"
          style={{ scaleY }}
          className="absolute bottom-0 left-[51px] top-0 hidden w-0.5 origin-top bg-gradient-to-b from-primary to-accent md:left-[59px] sm:block"
        />
      )}
      {children}
    </div>
  );
}

/** Slowly turning rings behind the closing call to action. */
export function OrbitRings() {
  const enabled = useRevealMotion();
  if (!enabled) {
    return (
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-primary-foreground/10"
        aria-hidden="true"
      />
    );
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-dashed border-primary-foreground/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full border-[2px] border-primary-foreground/15"
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/5 blur-3xl"
        animate={{ scale: [0.9, 1.05, 0.9] }}
        transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}
