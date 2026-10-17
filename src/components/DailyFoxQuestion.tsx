import foxAsset from "@/assets/daily/fox.png.asset.json";

/** The supplied mascot speaks only in the daily challenge. */
export function DailyFoxQuestion({ text }: { text: string }) {
  return (
    <div className="mt-6 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:gap-5">
      <img
        src={foxAsset.url}
        alt="Fox, a raposinha do Desafio Diário"
        width={128}
        height={128}
        className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32"
      />
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