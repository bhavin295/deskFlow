"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRID = 14;
const TICK_MS = 140;
const STORAGE_KEY = "tracker-snake-highscore";

type Point = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";

const DIR_DELTA: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  let spot: Point;
  do {
    spot = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (occupied.has(`${spot.x},${spot.y}`));
  return spot;
}

function loadHighScore(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(STORAGE_KEY) ?? 0);
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>([{ x: 7, y: 7 }]);
  const [food, setFood] = useState<Point>({ x: 10, y: 7 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(loadHighScore);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const dirRef = useRef<Dir>("right");
  const pendingDir = useRef<Dir | null>(null);

  const reset = useCallback(() => {
    const start = [{ x: 7, y: 7 }];
    setSnake(start);
    setFood(randomFood(start));
    dirRef.current = "right";
    pendingDir.current = null;
    setScore(0);
    setGameOver(false);
    setPaused(false);
  }, []);

  const queueDirection = useCallback((next: Dir) => {
    const current = pendingDir.current ?? dirRef.current;
    const opposite =
      (current === "up" && next === "down") ||
      (current === "down" && next === "up") ||
      (current === "left" && next === "right") ||
      (current === "right" && next === "left");
    if (!opposite) pendingDir.current = next;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const next = map[e.key];
      if (next) {
        e.preventDefault();
        queueDirection(next);
      }
      if (e.key === " ") {
        e.preventDefault();
        if (gameOver) reset();
        else setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameOver, queueDirection, reset]);

  useEffect(() => {
    if (gameOver || paused) return;

    const id = window.setInterval(() => {
      if (pendingDir.current) {
        dirRef.current = pendingDir.current;
        pendingDir.current = null;
      }

      const delta = DIR_DELTA[dirRef.current];
      setSnake((prev) => {
        const head = prev[0];
        const nextHead = { x: head.x + delta.x, y: head.y + delta.y };

        if (
          nextHead.x < 0 ||
          nextHead.x >= GRID ||
          nextHead.y < 0 ||
          nextHead.y >= GRID ||
          prev.some((p) => p.x === nextHead.x && p.y === nextHead.y)
        ) {
          setGameOver(true);
          return prev;
        }

        const ate = nextHead.x === food.x && nextHead.y === food.y;
        const grown = [nextHead, ...prev];
        const nextSnake = ate ? grown : [nextHead, ...prev.slice(0, -1)];

        if (ate) {
          setScore((s) => {
            const next = s + 10;
            setHighScore((h) => {
              if (next > h) {
                localStorage.setItem(STORAGE_KEY, String(next));
                return next;
              }
              return h;
            });
            return next;
          });
          setFood(randomFood(nextSnake));
        }

        return nextSnake;
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [food, gameOver, paused]);

  const snakeSet = new Set(snake.map((p) => `${p.x},${p.y}`));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-4">
          <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Score <span className="font-mono text-cyan-600 dark:text-cyan-400">{score}</span>
          </p>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Best <span className="font-mono text-amber-600 dark:text-amber-400">{highScore}</span>
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={gameOver}
            className="rounded-lg bg-zinc-200/80 px-2.5 py-1 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-cyan-500/15 px-2.5 py-1 text-[10px] font-bold text-cyan-700 dark:text-cyan-300"
          >
            New Game
          </button>
        </div>
      </div>

      <div
        className="snake-board relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-800/70 shadow-[inset_0_0_30px_rgba(34,211,238,0.08)]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${GRID}, 1fr)`,
          gridTemplateRows: `repeat(${GRID}, 1fr)`,
        }}
      >
        {Array.from({ length: GRID * GRID }).map((_, i) => {
          const x = i % GRID;
          const y = Math.floor(i / GRID);
          const key = `${x},${y}`;
          const isHead = snake[0]?.x === x && snake[0]?.y === y;
          const isBody = snakeSet.has(key) && !isHead;
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={key}
              className={[
                "border border-white/[0.03]",
                isHead && "snake-head animate-snake-pulse",
                isBody && "snake-body",
                isFood && "snake-food animate-food-glow",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          );
        })}

        {(gameOver || paused) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <p className="text-sm font-bold text-white">
              {gameOver ? "Game Over!" : "Paused"}
            </p>
            {gameOver && (
              <button
                type="button"
                onClick={reset}
                className="mt-2 rounded-full bg-cyan-500 px-4 py-1.5 text-xs font-bold text-white"
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto grid w-full max-w-[200px] grid-cols-3 gap-1.5">
        <div />
        <button
          type="button"
          aria-label="Up"
          onClick={() => queueDirection("up")}
          className="arcade-pad-btn rounded-xl py-2.5 text-lg"
        >
          ▲
        </button>
        <div />
        <button
          type="button"
          aria-label="Left"
          onClick={() => queueDirection("left")}
          className="arcade-pad-btn rounded-xl py-2.5 text-lg"
        >
          ◀
        </button>
        <button
          type="button"
          aria-label="Down"
          onClick={() => queueDirection("down")}
          className="arcade-pad-btn rounded-xl py-2.5 text-lg"
        >
          ▼
        </button>
        <button
          type="button"
          aria-label="Right"
          onClick={() => queueDirection("right")}
          className="arcade-pad-btn rounded-xl py-2.5 text-lg"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
