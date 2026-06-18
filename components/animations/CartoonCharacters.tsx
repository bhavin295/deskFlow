type CharacterProps = {
  size?: number;
  className?: string;
  running?: boolean;
};

/** Tom-inspired chase cat (original cartoon style) */
export function CatCharacter({ size = 32, className = "", running = false }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 44 48" className={`cartoon-char ${className}`.trim()} aria-hidden>
      <ellipse cx="22" cy="30" rx="15" ry="13" fill="var(--toon-cat-body)" />
      <ellipse cx="22" cy="32" rx="11" ry="9" fill="var(--toon-cat-highlight)" opacity="0.7" />
      <circle cx="22" cy="18" r="11" fill="var(--toon-cat-body)" />
      <path d="M12 10 L10 2 L18 8 Z" fill="var(--toon-cat-body)" />
      <path d="M32 10 L34 2 L26 8 Z" fill="var(--toon-cat-body)" />
      <path d="M13 8 L14 4 L17 9 Z" fill="var(--toon-cat-ear-inner)" />
      <path d="M31 8 L30 4 L27 9 Z" fill="var(--toon-cat-ear-inner)" />
      <ellipse cx="22" cy="20" rx="8" ry="7" fill="var(--toon-cat-belly)" />
      {running ? (
        <>
          <ellipse cx="17" cy="17" rx="3" ry="3.5" fill="#fff" />
          <ellipse cx="27" cy="17" rx="3" ry="3.5" fill="#fff" />
          <circle cx="17" cy="17" r="1.6" fill="#0f172a" />
          <circle cx="27" cy="17" r="1.6" fill="#0f172a" />
          <ellipse cx="22" cy="24" rx="4" ry="3" fill="#0f172a" />
          <path d="M6 28 L2 22" stroke="var(--toon-cat-limb)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M38 28 L42 22" stroke="var(--toon-cat-limb)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M16 40 L13 47" stroke="var(--toon-cat-limb)" strokeWidth="3" strokeLinecap="round" className="chase-leg-a" />
          <path d="M28 40 L31 47" stroke="var(--toon-cat-limb)" strokeWidth="3" strokeLinecap="round" className="chase-leg-b" />
        </>
      ) : (
        <>
          <ellipse cx="17" cy="18" rx="2.2" ry="2.8" fill="#fff" />
          <ellipse cx="27" cy="18" rx="2.2" ry="2.8" fill="#fff" />
          <circle cx="17" cy="18" r="1.2" fill="#0f172a" />
          <circle cx="27" cy="18" r="1.2" fill="#0f172a" />
          <path d="M18 24 Q22 27 26 24" fill="none" stroke="#0f172a" strokeWidth="1.4" />
          <path d="M8 30 L4 36" stroke="var(--toon-cat-limb)" strokeWidth="3" strokeLinecap="round" />
          <path d="M36 30 L40 36" stroke="var(--toon-cat-limb)" strokeWidth="3" strokeLinecap="round" />
          <path d="M17 40 L17 46" stroke="var(--toon-cat-limb)" strokeWidth="3" strokeLinecap="round" />
          <path d="M27 40 L27 46" stroke="var(--toon-cat-limb)" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** Jerry-inspired chase mouse — bright for green button */
export function MouseCharacter({ size = 26, className = "", running = false }: CharacterProps) {
  const h = Math.round(size * 1.15);
  return (
    <svg width={size} height={h} viewBox="0 0 36 42" className={className} aria-hidden>
      <ellipse cx="18" cy="26" rx="10" ry="11" fill="#fcd34d" stroke="#b45309" strokeWidth="1" />
      <ellipse cx="18" cy="28" rx="7" ry="7" fill="#fef3c7" opacity="0.85" />
      <circle cx="18" cy="14" r="9" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
      <ellipse cx="10" cy="8" rx="5" ry="7" fill="#fbbf24" />
      <ellipse cx="26" cy="8" rx="5" ry="7" fill="#fbbf24" />
      <ellipse cx="10" cy="8" rx="3" ry="5" fill="#fde68a" />
      <ellipse cx="26" cy="8" rx="3" ry="5" fill="#fde68a" />
      <circle cx="15" cy="14" r="2" fill="#0f172a" />
      <circle cx="21" cy="14" r="2" fill="#0f172a" />
      <circle cx="15.6" cy="13.4" r="0.7" fill="#fff" />
      <circle cx="21.6" cy="13.4" r="0.7" fill="#fff" />
      <path d="M16 18 Q18 20 20 18" fill="none" stroke="#0f172a" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M24 16 Q30 14 34 16" stroke="#b45309" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {running ? (
        <>
          <ellipse cx="15" cy="13" rx="2.2" ry="2.6" fill="#fff" />
          <ellipse cx="21" cy="13" rx="2.2" ry="2.6" fill="#fff" />
          <circle cx="15" cy="13" r="1.3" fill="#0f172a" />
          <circle cx="21" cy="13" r="1.3" fill="#0f172a" />
          <ellipse cx="18" cy="17" rx="2.5" ry="2" fill="#0f172a" />
          <path d="M6 24 L2 18" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 24 L34 18" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M14 34 L10 41" stroke="#92400e" strokeWidth="2.8" strokeLinecap="round" className="chase-leg-a" />
          <path d="M22 34 L26 41" stroke="#92400e" strokeWidth="2.8" strokeLinecap="round" className="chase-leg-b" />
        </>
      ) : (
        <>
          <path d="M15 34 L15 39" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M21 34 L21 39" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** Blue bird — walks the timer ring */
export function BlueBirdCharacter({ size = 30, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 40 44" className={className} aria-hidden>
      <ellipse cx="20" cy="28" rx="13" ry="11" fill="#3b82f6" />
      <ellipse cx="20" cy="30" rx="9" ry="7" fill="#93c5fd" opacity="0.75" />
      <circle cx="20" cy="15" r="10" fill="#2563eb" />
      <circle cx="16" cy="14" r="2.2" fill="#fff" />
      <circle cx="24" cy="14" r="2.2" fill="#fff" />
      <circle cx="16" cy="14" r="1.1" fill="#0f172a" />
      <circle cx="24" cy="14" r="1.1" fill="#0f172a" />
      <path d="M26 15 L34 13 L30 18 Z" fill="#f59e0b" />
      <path d="M14 24 Q20 28 26 24" fill="none" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 26 L3 20" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" className="chase-leg-a" />
      <path d="M32 26 L37 20" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" className="chase-leg-b" />
      <path d="M14 36 L11 42" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 36 L29 42" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Purple owl — status guide, high contrast */
export function OwlCharacter({ size = 36, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.15);
  return (
    <svg width={size} height={h} viewBox="0 0 44 50" className={className} aria-hidden>
      <ellipse cx="22" cy="28" rx="16" ry="17" fill="#9333ea" />
      <ellipse cx="22" cy="30" rx="12" ry="11" fill="#fbbf24" />
      <circle cx="22" cy="14" r="12" fill="#9333ea" />
      <circle cx="16" cy="14" r="5" fill="#fff" stroke="#6b21a8" strokeWidth="1" />
      <circle cx="28" cy="14" r="5" fill="#fff" stroke="#6b21a8" strokeWidth="1" />
      <circle cx="16" cy="14" r="2.2" fill="#0f172a" />
      <circle cx="28" cy="14" r="2.2" fill="#0f172a" />
      <path d="M22 18 L19 22 L25 22 Z" fill="#f97316" />
      <path d="M14 8 Q22 2 30 8" fill="none" stroke="#c084fc" strokeWidth="2" />
      <path d="M6 26 Q2 20 6 14" stroke="#9333ea" strokeWidth="4" fill="none" strokeLinecap="round" className="owl-wing" />
      <path d="M38 26 Q42 20 38 14" stroke="#9333ea" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M16 38 L14 44" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 38 L30 44" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Yellow chick — idle nap on timer */
export function ChickCharacter({ size = 28, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 40 44" className={className} aria-hidden>
      <text x="24" y="10" fontSize="7" fontWeight="800" fill="var(--toon-chick-z)">z</text>
      <text x="29" y="5" fontSize="5" fontWeight="800" fill="var(--toon-chick-z-dim)">z</text>
      <ellipse cx="20" cy="28" rx="12" ry="11" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
      <ellipse cx="20" cy="30" rx="8" ry="7" fill="#fef9c3" />
      <circle cx="20" cy="18" r="10" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="16" cy="17" r="1.8" fill="#0f172a" />
      <circle cx="24" cy="17" r="1.8" fill="#0f172a" />
      <path d="M16 21 Q20 23 24 21" fill="none" stroke="#854d0e" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 12 Q20 4 28 12" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
      <path d="M14 34 L14 39" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 34 L26 39" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Emerald fox — focus sprint, running status */
export function FoxCharacter({ size = 34, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 44 48" className={className} aria-hidden>
      <ellipse cx="22" cy="30" rx="14" ry="12" fill="#10b981" />
      <ellipse cx="22" cy="32" rx="10" ry="8" fill="#6ee7b7" opacity="0.75" />
      <circle cx="22" cy="17" r="11" fill="#059669" />
      <path d="M11 12 L8 3 L17 10 Z" fill="#059669" />
      <path d="M33 12 L36 3 L27 10 Z" fill="#059669" />
      <path d="M12 10 L14 6 L16 11 Z" fill="#fde68a" />
      <path d="M32 10 L30 6 L28 11 Z" fill="#fde68a" />
      <ellipse cx="22" cy="19" rx="8" ry="7" fill="#ecfdf5" />
      <circle cx="17" cy="17" r="2" fill="#fff" />
      <circle cx="27" cy="17" r="2" fill="#fff" />
      <circle cx="17" cy="17" r="1.1" fill="#0f172a" />
      <circle cx="27" cy="17" r="1.1" fill="#0f172a" />
      <ellipse cx="22" cy="22" rx="3" ry="2.2" fill="#0f172a" />
      <path d="M7 28 L3 22" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
      <path d="M37 28 L41 22" stroke="#047857" strokeWidth="3" strokeLinecap="round" className="fox-tail" />
      <path d="M16 40 L12 47" stroke="#047857" strokeWidth="3" strokeLinecap="round" className="chase-leg-a" />
      <path d="M28 40 L32 47" stroke="#047857" strokeWidth="3" strokeLinecap="round" className="chase-leg-b" />
    </svg>
  );
}

/** Camera bot — DeskQ sync status */
export function CameraBotCharacter({ size = 34, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 44 48" className={className} aria-hidden>
      <rect x="8" y="18" width="28" height="22" rx="6" fill="#0ea5e9" />
      <rect x="12" y="22" width="20" height="14" rx="3" fill="#0369a1" />
      <circle cx="22" cy="29" r="6" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
      <circle cx="22" cy="29" r="3" fill="#0c4a6e" />
      <circle cx="20.5" cy="27.5" r="1" fill="#fff" opacity="0.8" />
      <rect x="18" y="12" width="8" height="8" rx="2" fill="#38bdf8" />
      <circle cx="22" cy="10" r="3" fill="#ef4444" className="camera-blink" />
      <circle cx="14" cy="20" r="2" fill="#7dd3fc" />
      <circle cx="30" cy="20" r="2" fill="#7dd3fc" />
      <path d="M14 42 L14 46" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 42 L30 46" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Alarm bell — alert / countdown hype */
export function AlarmBellCharacter({ size = 40, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.05);
  return (
    <svg width={size} height={h} viewBox="0 0 44 46" className={className} aria-hidden>
      <path d="M22 4 L22 8" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 38 Q22 46 34 38" fill="#ef4444" />
      <path d="M12 36 Q22 42 32 36" fill="#fca5a5" />
      <path d="M8 34 L36 34 Q34 14 22 12 Q10 14 8 34 Z" fill="#ef4444" />
      <ellipse cx="22" cy="34" rx="14" ry="3" fill="#b91c1c" />
      <circle cx="16" cy="24" r="2.5" fill="#fff" />
      <circle cx="28" cy="24" r="2.5" fill="#fff" />
      <circle cx="16" cy="24" r="1.2" fill="#0f172a" />
      <circle cx="28" cy="24" r="1.2" fill="#0f172a" />
      <ellipse cx="22" cy="29" rx="3" ry="2.5" fill="#0f172a" />
      <path d="M6 18 L2 12" stroke="#f87171" strokeWidth="3" strokeLinecap="round" className="alarm-arm-a" />
      <path d="M38 18 L42 12" stroke="#f87171" strokeWidth="3" strokeLinecap="round" className="alarm-arm-b" />
    </svg>
  );
}

/** Cyan desk buddy — brand header wave */
export function WaveMascotCharacter({ size = 28, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.15);
  return (
    <svg width={size} height={h} viewBox="0 0 36 42" className={className} aria-hidden>
      <ellipse cx="18" cy="26" rx="12" ry="11" fill="#22d3ee" />
      <ellipse cx="18" cy="28" rx="8" ry="7" fill="#a5f3fc" opacity="0.85" />
      <circle cx="18" cy="14" r="10" fill="#06b6d4" />
      <circle cx="14" cy="13" r="2" fill="#fff" />
      <circle cx="22" cy="13" r="2" fill="#fff" />
      <circle cx="14" cy="13" r="1" fill="#0f172a" />
      <circle cx="22" cy="13" r="1" fill="#0f172a" />
      <path d="M14 18 Q18 21 22 18" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 20 L1 14" stroke="#0891b2" strokeWidth="2.8" strokeLinecap="round" className="wave-arm" />
      <path d="M32 22 L35 18" stroke="#0891b2" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M13 34 L13 39" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23 34 L23 39" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Purple game critter — break hub dock */
export function GameCritterCharacter({ size = 26, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 36 40" className={className} aria-hidden>
      <rect x="6" y="14" width="24" height="18" rx="5" fill="#a855f7" />
      <rect x="10" y="18" width="6" height="4" rx="1" fill="#f3e8ff" />
      <rect x="20" y="18" width="6" height="4" rx="1" fill="#f3e8ff" />
      <circle cx="13" cy="26" r="2" fill="#581c87" />
      <circle cx="23" cy="26" r="2" fill="#581c87" />
      <rect x="14" y="8" width="8" height="8" rx="2" fill="#9333ea" />
      <circle cx="18" cy="6" r="2" fill="#fbbf24" className="game-antenna-blink" />
      <path d="M11 34 L11 38" stroke="#7e22ce" strokeWidth="2.5" strokeLinecap="round" className="chase-leg-a" />
      <path d="M25 34 L25 38" stroke="#7e22ce" strokeWidth="2.5" strokeLinecap="round" className="chase-leg-b" />
    </svg>
  );
}

/** Orange cheer blob — stats strip hype */
export function CheerBlobCharacter({ size = 24, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 32 36" className={className} aria-hidden>
      <ellipse cx="16" cy="20" rx="11" ry="10" fill="#fb923c" />
      <ellipse cx="16" cy="22" rx="7" ry="6" fill="#fed7aa" />
      <circle cx="12" cy="17" r="1.6" fill="#0f172a" />
      <circle cx="20" cy="17" r="1.6" fill="#0f172a" />
      <path d="M11 22 Q16 26 21 22" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2 16 L0 10" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" className="cheer-arm-a" />
      <path d="M30 16 L32 10" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" className="cheer-arm-b" />
      <path d="M11 28 L9 33" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21 28 L23 33" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Star sparkle — ambient background float */
export function StarBuddyCharacter({ size = 20, className = "" }: CharacterProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="13" r="6" fill="#fde047" />
      <circle cx="10" cy="12" r="1" fill="#0f172a" />
      <circle cx="14" cy="12" r="1" fill="#0f172a" />
      <path d="M10 15 Q12 16 14 15" fill="none" stroke="#854d0e" strokeWidth="0.8" />
      <path d="M12 2 L13 7 L18 7 L14 10 L15 15 L12 12 L9 15 L10 10 L6 7 L11 7 Z" fill="#fbbf24" opacity="0.9" />
    </svg>
  );
}

/** Sleepy cloud — ambient background drift */
export function CloudNapCharacter({ size = 28, className = "" }: CharacterProps) {
  const h = Math.round(size * 0.72);
  return (
    <svg width={size} height={h} viewBox="0 0 40 28" className={`cartoon-char ${className}`.trim()} aria-hidden>
      <text x="28" y="8" fontSize="6" fontWeight="800" fill="var(--toon-cloud-z)">z</text>
      <text x="32" y="4" fontSize="4.5" fontWeight="800" fill="var(--toon-cloud-z-dim)">z</text>
      <ellipse cx="20" cy="18" rx="16" ry="9" fill="var(--toon-cloud-body)" />
      <circle cx="12" cy="16" r="7" fill="var(--toon-cloud-bubble)" />
      <circle cx="24" cy="15" r="8" fill="var(--toon-cloud-highlight)" />
      <circle cx="18" cy="13" r="6" fill="var(--toon-cloud-highlight)" />
      <circle cx="15" cy="17" r="1.4" fill="var(--toon-cloud-eye)" />
      <circle cx="21" cy="17" r="1.4" fill="var(--toon-cloud-eye)" />
      <path d="M16 19.5 Q18 20.5 20 19.5" fill="none" stroke="var(--toon-cloud-mouth)" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** Snail — slow ambient crawl */
export function SnailCharacter({ size = 24, className = "" }: CharacterProps) {
  const h = Math.round(size * 0.85);
  return (
    <svg width={size} height={h} viewBox="0 0 36 30" className={className} aria-hidden>
      <ellipse cx="24" cy="20" rx="10" ry="8" fill="#fcd34d" />
      <path d="M18 14 Q24 6 30 14 Q28 22 24 20 Q20 22 18 14 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
      <path d="M22 10 Q24 8 26 10" fill="none" stroke="#92400e" strokeWidth="0.8" />
      <circle cx="12" cy="22" r="7" fill="#fde68a" stroke="#ca8a04" strokeWidth="0.8" />
      <circle cx="10" cy="20" r="1.2" fill="#0f172a" />
      <circle cx="14" cy="20" r="1.2" fill="#0f172a" />
      <path d="M10 23 Q12 24 14 23" fill="none" stroke="#854d0e" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M6 18 L4 12" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 16 L6 11" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Coffee cup — onboarding peek */
export function CoffeeCupCharacter({ size = 22, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.1);
  return (
    <svg width={size} height={h} viewBox="0 0 32 36" className={className} aria-hidden>
      <path d="M8 10 Q8 4 16 4 Q24 4 24 10 L24 24 Q24 30 16 30 Q8 30 8 24 Z" fill="#92400e" />
      <path d="M10 12 Q10 8 16 8 Q22 8 22 12 L22 22 Q22 26 16 26 Q10 26 10 22 Z" fill="#b45309" />
      <ellipse cx="16" cy="24" rx="5" ry="3" fill="#78350f" />
      <path d="M24 14 L28 12 L28 20 L24 18 Z" fill="#92400e" />
      <circle cx="13" cy="16" r="1.2" fill="#fef3c7" />
      <circle cx="19" cy="16" r="1.2" fill="#fef3c7" />
      <path d="M14 19 Q16 20 18 19" fill="none" stroke="#fef3c7" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M12 6 Q14 2 16 4" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" className="coffee-steam-a" />
      <path d="M16 4 Q18 0 20 2" fill="none" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" className="coffee-steam-b" />
      <path d="M20 6 Q22 2 24 4" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" className="coffee-steam-c" />
    </svg>
  );
}

/** Rocket — focus launch ambient */
export function RocketBuddyCharacter({ size = 22, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.25);
  return (
    <svg width={size} height={h} viewBox="0 0 32 40" className={className} aria-hidden>
      <path d="M16 4 L22 28 L16 24 L10 28 Z" fill="#6366f1" />
      <path d="M16 8 L19 24 L16 22 L13 24 Z" fill="#a5b4fc" />
      <circle cx="16" cy="16" r="4" fill="#e0e7ff" />
      <circle cx="15" cy="15.5" r="1" fill="#0f172a" />
      <circle cx="17" cy="15.5" r="1" fill="#0f172a" />
      <path d="M15 17.5 Q16 18.5 17 17.5" fill="none" stroke="#0f172a" strokeWidth="0.7" strokeLinecap="round" />
      <path d="M10 28 L6 34 L10 32 Z" fill="#f472b6" />
      <path d="M22 28 L26 34 L22 32 Z" fill="#f472b6" />
      <ellipse cx="16" cy="32" rx="3" ry="2" fill="#fbbf24" className="rocket-flame" />
    </svg>
  );
}

/** Wellness blob — stretch / breathe dock buddy */
export function WellnessBlobCharacter({ size = 24, className = "" }: CharacterProps) {
  const h = Math.round(size * 1.15);
  return (
    <svg width={size} height={h} viewBox="0 0 32 38" className={className} aria-hidden>
      <ellipse cx="16" cy="22" rx="11" ry="10" fill="#34d399" />
      <ellipse cx="16" cy="24" rx="7" ry="6" fill="#a7f3d0" />
      <circle cx="16" cy="13" r="8" fill="#10b981" />
      <path d="M12 12 Q14 11 16 12 Q18 11 20 12" fill="none" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M14 15 Q16 16 18 15" fill="none" stroke="#047857" strokeWidth="1" strokeLinecap="round" />
      <path d="M4 18 L1 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" className="wellness-arm-a" />
      <path d="M28 18 L31 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" className="wellness-arm-b" />
      <path d="M11 30 L9 35" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21 30 L23 35" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Gear buddy — settings peek */
export function GearBuddyCharacter({ size = 22, className = "" }: CharacterProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={`cartoon-char ${className}`.trim()} aria-hidden>
      <circle cx="16" cy="16" r="9" fill="var(--toon-gear-body)" />
      <circle cx="16" cy="16" r="5.5" fill="var(--toon-gear-inner)" />
      <circle cx="14" cy="15" r="1.1" fill="#0f172a" />
      <circle cx="18" cy="15" r="1.1" fill="#0f172a" />
      <path d="M14 18 Q16 19.5 18 18" fill="none" stroke="#0f172a" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M16 4 L17 7 L16 8 L15 7 Z" fill="var(--toon-gear-spoke)" />
      <path d="M16 28 L17 25 L16 24 L15 25 Z" fill="var(--toon-gear-spoke)" />
      <path d="M4 16 L7 17 L8 16 L7 15 Z" fill="var(--toon-gear-spoke)" />
      <path d="M28 16 L25 17 L24 16 L25 15 Z" fill="var(--toon-gear-spoke)" />
      <path d="M7 7 L9 9 L8 10 L6 8 Z" fill="var(--toon-gear-spoke)" />
      <path d="M25 7 L23 9 L24 10 L26 8 Z" fill="var(--toon-gear-spoke)" />
      <path d="M7 25 L9 23 L8 22 L6 24 Z" fill="var(--toon-gear-spoke)" />
      <path d="M25 25 L23 23 L24 22 L26 24 Z" fill="var(--toon-gear-spoke)" />
    </svg>
  );
}

/** Moon buddy — theme dock peek */
export function MoonBuddyCharacter({ size = 20, className = "" }: CharacterProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" className={`cartoon-char ${className}`.trim()} aria-hidden>
      <path d="M18 4 A10 10 0 1 0 18 24 A7 7 0 1 1 18 4 Z" fill="var(--toon-moon-body)" />
      <circle cx="14" cy="13" r="1" fill="var(--toon-moon-face)" />
      <circle cx="17" cy="15" r="0.9" fill="var(--toon-moon-face)" />
      <path d="M13 17 Q15 18 17 17" fill="none" stroke="var(--toon-moon-face)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}
