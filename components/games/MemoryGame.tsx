"use client";

import { useCallback, useState } from "react";

const PAIRS = ["🤖", "⚡", "🔋", "💻", "🎯", "⭐"];
const STORAGE_KEY = "tracker-memory-best";

type Card = { id: string; emoji: string; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(): Card[] {
  return shuffle(
    PAIRS.flatMap((emoji, i) => [
      { id: `${i}-a`, emoji, matched: false },
      { id: `${i}-b`, emoji, matched: false },
    ]),
  );
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(buildDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [best, setBest] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Number(saved) : null;
  });

  const reset = useCallback(() => {
    setCards(buildDeck());
    setFlipped([]);
    setMoves(0);
    setWon(false);
  }, []);

  const onFlip = (index: number) => {
    if (won || flipped.length >= 2 || flipped.includes(index) || cards[index].matched) return;

    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = next;

      if (cards[a].emoji === cards[b].emoji) {
        setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c, i) =>
              i === a || i === b ? { ...c, matched: true } : c,
            );
            if (updated.every((c) => c.matched)) {
              setWon(true);
              setBest((b) => {
                if (b === null || nextMoves < b) {
                  localStorage.setItem(STORAGE_KEY, String(nextMoves));
                  return nextMoves;
                }
                return b;
              });
            }
            return updated;
          });
          setFlipped([]);
        }, 400);
      } else {
        setTimeout(() => setFlipped([]), 700);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          Moves <span className="font-mono text-violet-600 dark:text-violet-400">{moves}</span>
          {best !== null && (
            <span className="ml-3 text-zinc-500">
              Best <span className="font-mono text-amber-600 dark:text-amber-400">{best}</span>
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300"
        >
          New Game
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-[280px] grid-cols-4 gap-2">
        {cards.map((card, i) => {
          const show = card.matched || flipped.includes(i);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onFlip(i)}
              className={`memory-card aspect-square rounded-xl text-2xl transition-all duration-300 ${
                show ? "memory-card-flipped" : ""
              } ${card.matched ? "opacity-60" : ""}`}
            >
              <span className="memory-card-front">?</span>
              <span className="memory-card-back">{card.emoji}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <p className="text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in-up">
          Cleared in {moves} moves!
        </p>
      )}
    </div>
  );
}
