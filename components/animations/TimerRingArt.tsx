type TimerRingArtProps = {
  active: boolean;
};

export default function TimerRingArt({ active }: TimerRingArtProps) {
  if (!active) {
    return (
      <svg
        className="timer-ring-art timer-ring-art-idle pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 210 210"
        aria-hidden
      >
        <circle
          cx="105"
          cy="105"
          r="98"
          fill="none"
          stroke="rgba(139,92,246,0.15)"
          strokeWidth="1"
          strokeDasharray="6 10"
          className="timer-ring-art-dash"
        />
      </svg>
    );
  }

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const inner = 96;
    const outer = i % 3 === 0 ? 104 : 100;
    return {
      x1: 105 + inner * Math.cos(rad),
      y1: 105 + inner * Math.sin(rad),
      x2: 105 + outer * Math.cos(rad),
      y2: 105 + outer * Math.sin(rad),
      major: i % 3 === 0,
      delay: i * 0.08,
    };
  });

  return (
    <svg
      className="timer-ring-art pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 210 210"
      aria-hidden
    >
      <defs>
        <linearGradient id="timerArtGrad" x1="0" y1="0" x2="210" y2="210">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="33%" stopColor="#818cf8" />
          <stop offset="66%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <filter id="timerArtGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx="105"
        cy="105"
        r="102"
        fill="none"
        stroke="url(#timerArtGrad)"
        strokeWidth="1.5"
        strokeDasharray="12 18"
        opacity="0.55"
        className="timer-ring-art-outer"
      />

      {ticks.map((tick, i) => (
        <line
          key={i}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke="url(#timerArtGrad)"
          strokeWidth={tick.major ? 2.5 : 1.5}
          strokeLinecap="round"
          className="timer-ring-tick"
          style={{ animationDelay: `${tick.delay}s` }}
        />
      ))}

      {[0, 90, 180, 270].map((deg, i) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const cx = 105 + 102 * Math.cos(rad);
        const cy = 105 + 102 * Math.sin(rad);
        return (
          <circle
            key={deg}
            cx={cx}
            cy={cy}
            r="3"
            fill={["#f472b6", "#818cf8", "#22d3ee", "#34d399"][i]}
            className="timer-ring-orb"
            style={{ animationDelay: `${i * 0.4}s` }}
            filter="url(#timerArtGlow)"
          />
        );
      })}
    </svg>
  );
}
