import type { CSSProperties, ReactNode } from "react";

import type { Tracks } from "@/lib/progress";

type Props = {
  tracks: Tracks;
  children: ReactNode;
  className?: string;
};

const AURA_TRACKS = ["natureza", "humanas", "linguagens", "matematica"] as const;

/** Malha de conhecimento: cada setor responde à proficiência de uma área. */
export function KnowledgeAura({ tracks, children, className = "" }: Props) {
  return (
    <div
      className={`knowledge-aura relative isolate flex aspect-square items-center justify-center ${className}`}
      aria-label="Aura de conhecimento baseada na proficiência por área"
    >
      <div className="absolute inset-0 rounded-full bg-background/70 blur-sm" aria-hidden="true" />
      {AURA_TRACKS.map((track) => {
        const score = tracks[track];
        const weight = score < 40 ? 0.22 : 0.3 + (score / 100) * 0.58;
        const style = { "--aura-weight": weight } as CSSProperties;
        return (
          <span
            key={track}
            style={style}
            aria-hidden="true"
            className={`aura-sector aura-${track} ${score > 75 ? "aura-mastered motion-safe:animate-pulse" : ""} ${score < 40 ? "aura-muted" : ""}`}
          />
        );
      })}
      <div className="relative z-10 flex h-[76%] w-[76%] items-center justify-center rounded-full border border-border bg-card/80 shadow-inner backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}