"use client";

import { useEffect, useState } from "react";
import SnakeGame from "@/components/games/SnakeGame";
import MemoryGame from "@/components/games/MemoryGame";
import ReactionGame from "@/components/games/ReactionGame";
import BreathingExercise from "@/components/wellness/BreathingExercise";
import EyeRestTimer from "@/components/wellness/EyeRestTimer";
import StretchGuide from "@/components/wellness/StretchGuide";
import { CloseIcon, GamepadIcon, WellnessIcon } from "@/components/svg/Icons";
import BreakCountdownBar from "@/components/BreakCountdownBar";
import type { HubTab } from "@/components/IPhoneDock";

export type HubItem = "snake" | "memory" | "reaction" | "breathing" | "eyes" | "stretch";

const GAME_ITEMS: { id: HubItem; label: string; emoji: string; desc: string }[] = [
  { id: "snake", label: "Snake", emoji: "🐍", desc: "Classic arcade" },
  { id: "memory", label: "Memory", emoji: "🧠", desc: "Match pairs" },
  { id: "reaction", label: "Reaction", emoji: "⚡", desc: "Test reflexes" },
];

const WELLNESS_ITEMS: { id: HubItem; label: string; emoji: string; desc: string }[] = [
  { id: "breathing", label: "Breathe", emoji: "🌬️", desc: "Box breathing" },
  { id: "eyes", label: "Eye Rest", emoji: "👁️", desc: "20-20-20 rule" },
  { id: "stretch", label: "Stretch", emoji: "🧘", desc: "Desk exercises" },
];

function HubContent({ item }: { item: HubItem }) {
  switch (item) {
    case "snake":
      return <SnakeGame />;
    case "memory":
      return <MemoryGame />;
    case "reaction":
      return <ReactionGame />;
    case "breathing":
      return <BreathingExercise />;
    case "eyes":
      return <EyeRestTimer />;
    case "stretch":
      return <StretchGuide />;
    default:
      return null;
  }
}

function itemLabel(item: HubItem): string {
  return [...GAME_ITEMS, ...WELLNESS_ITEMS].find((i) => i.id === item)?.label ?? "";
}

type BreakHubProps = {
  open: boolean;
  initialTab?: HubTab;
  initialItem?: HubItem | null;
  autoStartBreakTimer?: boolean;
  onClose: () => void;
};

function hubTitle(tab: HubTab): string {
  return tab === "games" ? "Games" : "Wellness";
}

function hubSubtitle(tab: HubTab): string {
  return tab === "games"
    ? "Snake, Memory & Reaction"
    : "Breathe, eyes & stretch";
}

export default function BreakHub({
  open,
  initialTab = "games",
  initialItem = null,
  autoStartBreakTimer = false,
  onClose,
}: BreakHubProps) {
  const [tab, setTab] = useState<HubTab>(initialTab);
  const [active, setActive] = useState<HubItem | null>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setActive(initialItem);
    }
  }, [open, initialTab, initialItem]);

  if (!open) return null;

  const items = tab === "games" ? GAME_ITEMS : WELLNESS_ITEMS;

  const handleClose = () => {
    setActive(null);
    onClose();
  };

  return (
    <div className="iphone-no-drag absolute inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close hub"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
      />
      <div className="relative flex max-h-[78%] animate-slide-up flex-col rounded-t-[28px] border border-cyan-500/20 bg-white/95 shadow-[0_-12px_40px_rgba(14,165,233,0.15)] backdrop-blur-xl dark:border-slate-500/25 dark:bg-slate-800/92">
        <BreakCountdownBar
          active={tab === "wellness" || (active !== null && WELLNESS_ITEMS.some((item) => item.id === active))}
          autoStart={autoStartBreakTimer}
        />
        <div className="shrink-0 px-4 pb-2 pt-4">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {active ? (
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  ← Back
                </button>
              ) : tab === "games" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/30">
                  <GamepadIcon className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                  <WellnessIcon className="h-4 w-4" />
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {active ? itemLabel(active) : hubTitle(tab)}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  {active ? "Tap back to browse" : hubSubtitle(tab)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          {!active && (
            <div className="mt-3 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-slate-700/60">
              {(["games", "wellness"] as HubTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-all ${
                    tab === t
                      ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-600 dark:text-cyan-200"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {active ? (
            <HubContent item={active} />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActive(item.id)}
                  className="hub-card flex flex-col items-center gap-1.5 rounded-2xl border border-zinc-200/80 bg-white/80 p-3 transition-all hover:border-cyan-400/40 hover:shadow-md dark:border-slate-500/30 dark:bg-slate-700/55"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100">
                    {item.label}
                  </span>
                  <span className="text-[9px] text-zinc-400">{item.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
