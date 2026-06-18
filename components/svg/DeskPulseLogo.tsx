type DeskPulseLogoProps = {
  className?: string;
};

export default function DeskPulseLogo({ className = "h-9 w-9" }: DeskPulseLogoProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="dp-bg" x1="6" y1="4" x2="42" y2="44">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="dp-pulse" x1="10" y1="24" x2="38" y2="24">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
        <filter id="dp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="4" y="4" width="40" height="40" rx="11" fill="url(#dp-bg)" />
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="11"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.75"
      />

      <circle
        cx="24"
        cy="24"
        r="14"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="24"
        cy="24"
        r="10"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1"
        strokeDasharray="3 5"
        fill="none"
        className="animate-spin-slow"
        style={{ transformOrigin: "24px 24px" }}
      />

      <path
        d="M11 26 L17 26 L19 18 L22 32 L25 22 L27 26 L37 26"
        stroke="url(#dp-pulse)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#dp-glow)"
        className="deskpulse-wave"
      />
      <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" className="logo-orbit-ring" />

      <circle cx="24" cy="24" r="2.5" fill="#fff" opacity="0.95" />
    </svg>
  );
}
