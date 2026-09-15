type Props = {
  stage: 1 | 2 | 3 | 4;
  className?: string;
  animated?: boolean;
};

/** Raposa mascote — paleta grafite, branco, teal e azul da marca. 4 estágios evolutivos. */
export function FoxMascot({ stage, className, animated = true }: Props) {
  const scale = [0.78, 0.88, 0.96, 1][stage - 1];
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Mascote raposa, estágio ${stage}`}
      className={className}
    >
      <defs>
        <radialGradient id="foxGlow" cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--neon)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="foxFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2536" />
          <stop offset="100%" stopColor="#121018" />
        </linearGradient>
        <linearGradient id="foxPurple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon)" />
          <stop offset="100%" stopColor="var(--electric)" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="105" r="82" fill="url(#foxGlow)" />

      <g
        transform={`translate(100 108) scale(${scale}) translate(-100 -108)`}
        className={animated ? "origin-center animate-[pulse_4s_ease-in-out_infinite]" : undefined}
      >
        {/* cauda */}
        <path d="M44 138c-22-8-30-30-18-46 4 18 16 26 30 26z" fill="url(#foxFur)" />
        <path d="M30 96c-4 16 4 32 16 40-6-14-8-28-4-40z" fill="#f4f2fa" />

        {/* corpo */}
        <ellipse cx="100" cy="146" rx="42" ry="30" fill="url(#foxFur)" />
        <ellipse cx="100" cy="152" rx="24" ry="20" fill="#f4f2fa" />

        {/* orelhas */}
        <path d="M62 74 58 34l34 24z" fill="url(#foxFur)" />
        <path d="M138 74 142 34l-34 24z" fill="url(#foxFur)" />
        <path d="M68 68 66 46l18 14z" fill="url(#foxPurple)" />
        <path d="M132 68 134 46l-18 14z" fill="url(#foxPurple)" />

        {/* cabeça */}
        <path
          d="M100 44c30 0 48 20 48 44 0 26-21 42-48 42s-48-16-48-42c0-24 18-44 48-44z"
          fill="url(#foxFur)"
        />
        <path
          d="M100 82c16 0 28 8 28 20 0 14-13 24-28 24s-28-10-28-24c0-12 12-20 28-20z"
          fill="#f7f5fc"
        />

        {/* olhos */}
        <ellipse cx="83" cy="86" rx="6" ry="7" fill="#f7f5fc" />
        <ellipse cx="117" cy="86" rx="6" ry="7" fill="#f7f5fc" />
        <circle cx="83" cy="87" r="3.4" fill="#7c3aed" />
        <circle cx="117" cy="87" r="3.4" fill="#7c3aed" />
        <circle cx="84.5" cy="84.5" r="1.4" fill="#fff" />
        <circle cx="118.5" cy="84.5" r="1.4" fill="#fff" />

        {/* focinho */}
        <ellipse cx="100" cy="103" rx="7" ry="5" fill="#1b1823" />
        <path
          d="M100 108v6M100 114c-4 5-11 4-13 0M100 114c4 5 11 4 13 0"
          stroke="#1b1823"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* bochechas */}
        <ellipse cx="72" cy="99" rx="7" ry="4" fill="#a855f7" opacity="0.35" />
        <ellipse cx="128" cy="99" rx="7" ry="4" fill="#a855f7" opacity="0.35" />

        {/* estágio 2: lenço */}
        {stage >= 2 && (
          <path d="M74 122c16 10 36 10 52 0l6 12c-20 12-44 12-64 0z" fill="url(#foxPurple)" />
        )}

        {/* estágio 3: bússola de aventureira */}
        {stage >= 3 && (
          <g>
            <circle cx="140" cy="152" r="14" fill="#f4f2fa" stroke="#7c3aed" strokeWidth="3" />
            <path d="M140 144l4 8-4 8-4-8z" fill="#7c3aed" />
          </g>
        )}

        {/* estágio 4: óculos + coroa */}
        {stage >= 4 && (
          <g>
            <g fill="none" stroke="#f4f2fa" strokeWidth="3">
              <circle cx="83" cy="86" r="12" />
              <circle cx="117" cy="86" r="12" />
              <path d="M95 86h10" />
            </g>
            <path
              d="M74 40l10 12 16-18 16 18 10-12 4 20H70z"
              fill="url(#foxPurple)"
              stroke="#f4f2fa"
              strokeWidth="2"
            />
          </g>
        )}
      </g>
    </svg>
  );
}
