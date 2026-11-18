import { motion, stagger, type Variants } from "motion/react";
import { Fragment } from "react";
import { revealSpring, revealViewport, useRevealMotion } from "./Reveal";

const title: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: stagger(0.06) } },
};
const word: Variants = {
  static: { y: "0%", opacity: 1, filter: "none", transition: { duration: 0 } },
  hidden: { y: "100%", opacity: 0, filter: "blur(5px)", transition: { duration: 0 } },
  visible: {
    y: "0%", opacity: 1, filter: "blur(0px)",
    transition: { ...revealSpring, opacity: { duration: 0.32 }, filter: { duration: 0.4 } },
  },
};

type Line = string | { text: string; className: string };

export function WordsReveal({ text, as = "h2", className }: { text: string | readonly Line[]; as?: "h1" | "h2"; className?: string }) {
  const enabled = useRevealMotion();
  const Element = motion[as];
  const lines = typeof text === "string" ? [text] : text;
  const label = lines.map((line) => typeof line === "string" ? line : line.text).join(" ");

  return (
    <Element
      aria-label={label}
      className={className}
      initial={false}
      variants={title}
      animate={enabled ? "hidden" : "static"}
      {...(enabled ? { whileInView: "visible", viewport: { ...revealViewport, once: true } } : {})}
    >
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && typeof line === "string" && <br />}
          {lineIndex > 0 && typeof line !== "string" && " "}
          <span aria-hidden="true" className={typeof line === "string" ? undefined : line.className}>
            {(typeof line === "string" ? line : line.text).split(/(\s+)/).map((part, index) => (
              /^\s+$/.test(part) ? part : (
                <span key={index} className="-my-[0.15em] inline-block overflow-clip py-[0.15em] align-baseline">
                  <motion.span className="inline-block" variants={word}>{part}</motion.span>
                </span>
              )
            ))}
          </span>
        </Fragment>
      ))}
    </Element>
  );
}
