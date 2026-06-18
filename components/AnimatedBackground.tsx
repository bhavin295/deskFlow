import AmbientCartoonPeeks from "@/components/animations/AmbientCartoonPeeks";
import BackgroundFloaters from "@/components/animations/BackgroundFloaters";
import FloatingShapes from "@/components/animations/FloatingShapes";

const SPARKLE_COLORS = [
  "bg-fuchsia-400/70 dark:bg-fuchsia-300/50",
  "bg-cyan-400/70 dark:bg-cyan-300/50",
  "bg-amber-300/80 dark:bg-amber-200/50",
  "bg-violet-400/70 dark:bg-violet-300/50",
  "bg-emerald-400/70 dark:bg-emerald-300/50",
];

export default function AnimatedBackground() {
  return (
    <div
      className="animated-bg-funky pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br from-violet-100 via-sky-50 to-fuchsia-100 dark:bg-gradient-to-br dark:from-slate-800 dark:via-[#1a2234] dark:to-indigo-950"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tracker-bg-robot-light.png"
        alt=""
        className="animate-ken-burns bg-photo-light absolute inset-0 h-full w-full object-cover object-center opacity-90 dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tracker-bg-robot-dark.png"
        alt=""
        className="animate-ken-burns bg-photo-dark absolute inset-0 hidden h-full w-full object-cover object-center dark:block"
      />

      <div className="bg-mesh-light absolute inset-0 dark:hidden" />
      <div className="bg-mesh-dark absolute inset-0 hidden dark:block" />

      <div className="aurora-blob aurora-blob-1 absolute -left-[20%] top-[15%] h-48 w-48 rounded-full bg-gradient-to-br from-cyan-400/30 to-fuchsia-400/20 blur-3xl dark:from-cyan-500/25 dark:to-fuchsia-500/15" />
      <div className="aurora-blob aurora-blob-2 absolute -right-[15%] bottom-[20%] h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/25 to-pink-500/20 blur-3xl dark:from-violet-500/22 dark:to-pink-500/15" />
      <div className="aurora-blob aurora-blob-3 absolute left-[30%] top-[55%] h-40 w-40 rounded-full bg-gradient-to-br from-sky-400/20 to-emerald-400/18 blur-3xl dark:from-blue-500/15 dark:to-emerald-500/12" />
      <div className="aurora-blob absolute right-[10%] top-[8%] h-32 w-32 rounded-full bg-amber-400/15 blur-3xl dark:bg-amber-500/12" style={{ animationDelay: "-3s", animationDuration: "20s" }} />

      <div className="bg-neon-sweep absolute inset-0 opacity-60 dark:opacity-55" />

      <div className="absolute inset-0">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={`p-${i}`}
            className={`animate-float-particle absolute rounded-full ${SPARKLE_COLORS[i % SPARKLE_COLORS.length]}`}
            style={{
              width: `${3 + (i % 4) * 2}px`,
              height: `${3 + (i % 4) * 2}px`,
              left: `${5 + ((i * 17) % 90)}%`,
              top: `${8 + ((i * 23) % 85)}%`,
              animationDelay: `${i * 0.55}s`,
              animationDuration: `${3.5 + (i % 5)}s`,
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <span
            key={`s-${i}`}
            className="animate-twinkle absolute text-lg leading-none"
            style={{
              left: `${12 + ((i * 29) % 76)}%`,
              top: `${15 + ((i * 19) % 70)}%`,
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          >
            ✦
          </span>
        ))}
      </div>

      <FloatingShapes />

      <BackgroundFloaters />

      <AmbientCartoonPeeks />

      <div className="bg-scrim-light absolute inset-0 dark:hidden" />
      <div className="bg-scrim-dark absolute inset-0 hidden dark:block" />
    </div>
  );
}
