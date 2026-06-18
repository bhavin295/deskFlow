"use client";

import { useId } from "react";

type DecorProps = {
  className?: string;
};

export function SparkleStar({ className = "", size = 16 }: DecorProps & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`sparkle-star ${className}`}
      aria-hidden
    >
      <path
        d="M12 2 L13.8 9.2 L21 11 L13.8 12.8 L12 20 L10.2 12.8 L3 11 L10.2 9.2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SparkleBurst({ className = "" }: DecorProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 48 48" className={`sparkle-burst ${className}`} aria-hidden>
      <defs>
        <radialGradient id={`burstCore-${id}`}>
          <stop offset="0%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#6366f1" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="3" fill={`url(#burstCore-${id})`} className="sparkle-burst-core" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <line
          key={deg}
          x1="24"
          y1="24"
          x2={24 + 14 * Math.cos((deg * Math.PI) / 180)}
          y2={24 + 14 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="sparkle-burst-ray"
          style={{ animationDelay: `${deg / 360}s` }}
        />
      ))}
      <path
        d="M24 14 L25.2 18.8 L30 20 L25.2 21.2 L24 26 L22.8 21.2 L18 20 L22.8 18.8 Z"
        fill="currentColor"
        className="sparkle-burst-star"
      />
    </svg>
  );
}

export function FashionCorner({ className = "" }: DecorProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={`fashion-corner ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`cornerGrad-${id}`} x1="4" y1="28" x2="28" y2="4">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path
        d="M4 28 Q4 4 28 4"
        fill="none"
        stroke={`url(#cornerGrad-${id})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        className="fashion-corner-path"
      />
      <circle cx="28" cy="4" r="2.5" fill="#ec4899" className="fashion-corner-dot" />
    </svg>
  );
}

export function OrbitDots({ className = "" }: DecorProps) {
  return (
    <svg viewBox="0 0 56 56" className={`orbit-dots ${className}`} aria-hidden>
      <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="4 6" className="orbit-dots-ring" />
      <circle cx="28" cy="6" r="3" fill="#f472b6" className="orbit-dot orbit-dot-1" />
      <circle cx="48" cy="28" r="2.5" fill="#22d3ee" className="orbit-dot orbit-dot-2" />
      <circle cx="28" cy="50" r="2" fill="#a78bfa" className="orbit-dot orbit-dot-3" />
    </svg>
  );
}

export function StatusGlowRing({ className = "" }: DecorProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 40 40" className={`status-glow-ring ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`statusRingGrad-${id}`} x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke={`url(#statusRingGrad-${id})`}
        strokeWidth="2"
        className="status-glow-ring-spin"
        strokeDasharray="8 12"
      />
    </svg>
  );
}
