import foxAsset from "@/assets/daily/fox.png.asset.json";

export type FoxMood = "talking" | "thinking" | "celebrating" | "encouraging";

/** The supplied mascot speaks only in the daily challenge, animated with CSS (no video). */
export function DailyFoxQuestion({ text, mood = "talking" }: { text: string; mood?: FoxMood }) {
  return (
    <div className="mt-6 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:gap-5">
      <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
        <span aria-hidden="true" className="fox-shadow absolute inset-x-3 bottom-0 h-2 rounded-full bg-foreground/15 blur-sm" />
        <img
          key={mood}
          src={foxAsset.url}
          alt="Fox, a raposinha do Desafio Diário"
          width={128}
          height={128}
          className={`fox-anim fox-${mood} relative h-full w-full object-contain`}
        />
        {mood === "celebrating" && (
          <span aria-hidden="true" className="fox-sparkles pointer-events-none absolute inset-0">
            <i /><i /><i /><i />
          </span>
        )}
        {mood === "thinking" && (
          <span aria-hidden="true" className="fox-think absolute -right-1 top-1 rounded-full bg-card px-1.5 text-sm font-bold text-primary">?</span>
        )}
      </div>
      <div className="relative min-w-0 w-full flex-1 rounded-2xl border-2 border-border bg-background p-4 sm:mt-3 sm:p-5">
        <span
          aria-hidden="true"
          className="absolute -top-2 left-10 h-3.5 w-3.5 rotate-45 border-l-2 border-t-2 border-border bg-background sm:top-8 sm:-left-2 sm:border-t-0 sm:border-b-2"
        />
        <p className="relative whitespace-pre-line break-words text-base leading-relaxed text-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}
