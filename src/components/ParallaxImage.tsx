import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ComponentPropsWithoutRef } from "react";
import { useRevealMotion } from "./Reveal";

type ImageProps = Pick<ComponentPropsWithoutRef<"img">, "src" | "alt" | "loading" | "width" | "height" | "className">;

function MovingImage(props: ImageProps) {
  const target = useRef<HTMLImageElement>(null);
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [18, 0]);

  return <motion.img {...props} ref={target} style={{ scale, y }} />;
}

export function ParallaxImage(props: ImageProps) {
  const enabled = useRevealMotion();
  return enabled ? <MovingImage {...props} /> : <img {...props} />;
}
