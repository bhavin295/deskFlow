export default function FloatingShapes() {
  return (
    <svg
      className="floating-shapes pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="fsGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="fsGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <polygon points="8,18 14,14 18,19 12,21" fill="url(#fsGrad1)" className="floating-shape floating-shape-1" />
      <circle cx="82" cy="22" r="3.5" fill="url(#fsGrad2)" className="floating-shape floating-shape-2" />
      <path
        d="M72 78 Q76 74 80 78 T88 78"
        fill="none"
        stroke="#c084fc"
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.45"
        className="floating-shape floating-shape-3"
      />
      <rect x="6" y="82" width="5" height="5" rx="1.2" fill="#f472b6" opacity="0.22" className="floating-shape floating-shape-4" />
      <path d="M88 72 L91 67 L94 72 L91 77 Z" fill="#22d3ee" opacity="0.25" className="floating-shape floating-shape-5" />
      <circle cx="48" cy="6" r="1.8" fill="#fbbf24" opacity="0.4" className="floating-shape floating-shape-6" />
      <path
        d="M38 38 C42 34 46 38 50 36"
        fill="none"
        stroke="#ec4899"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.4"
        className="floating-shape floating-shape-7"
      />
    </svg>
  );
}
