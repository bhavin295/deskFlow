import { DESKFLOW_BRAND_ICON_SVG } from "@/lib/brandIcon";

type DeskFlowLogoProps = {
  className?: string;
};

/** Inline SVG — same mark as Mac Dock PNG, always renders in the app header */
export default function DeskFlowLogo({ className = "" }: DeskFlowLogoProps) {
  return (
    <svg
      className={className}
      viewBox={DESKFLOW_BRAND_ICON_SVG.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="df-brand-bg" x1="96" y1="64" x2="416" y2="448" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="df-brand-wave" x1="128" y1="300" x2="384" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
        <radialGradient
          id="df-brand-glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(256 188) rotate(90) scale(72)"
        >
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="48" y="48" width="416" height="416" rx="96" fill="url(#df-brand-bg)" />
      <circle cx="256" cy="196" r="88" stroke="rgba(255,255,255,0.28)" strokeWidth="10" />
      <path
        d="M256 108 A88 88 0 1 1 188 248"
        stroke="#ffffff"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle cx="256" cy="196" r="6" fill="#ffffff" />
      <circle cx="256" cy="196" r="34" fill="url(#df-brand-glow)" />
      <circle cx="256" cy="196" r="18" fill="#ffffff" fillOpacity="0.92" />
      <path
        d="M128 312 C168 286 208 286 256 304 C304 322 344 322 384 296"
        stroke="url(#df-brand-wave)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M144 352 C184 332 220 332 256 346 C292 360 328 360 368 340"
        stroke="#ffffff"
        strokeWidth="12"
        strokeLinecap="round"
        opacity="0.88"
      />
      <rect x="176" y="292" width="160" height="18" rx="9" fill="#ffffff" fillOpacity="0.92" />
      <ellipse cx="256" cy="286" rx="22" ry="10" fill="#ffffff" />
    </svg>
  );
}
