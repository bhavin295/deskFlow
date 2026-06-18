export default function TrackerLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="logoGradInner" x1="12" y1="12" x2="36" y2="36">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="12"
        fill="url(#logoGrad)"
        className="animate-pulse-soft"
      />
      <circle cx="24" cy="24" r="12" stroke="white" strokeWidth="2" opacity="0.3" />
      <circle
        cx="24"
        cy="24"
        r="12"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="20 56"
        strokeLinecap="round"
        className="animate-spin-slow origin-center"
        style={{ transformOrigin: "24px 24px" }}
      />
      <path
        d="M24 16v8l5 3"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="2" fill="white" />
    </svg>
  );
}
