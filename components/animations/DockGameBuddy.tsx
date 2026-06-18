"use client";

import { GameCritterCharacter } from "@/components/animations/CartoonCharacters";

type DockGameBuddyProps = {
  visible: boolean;
};

export default function DockGameBuddy({ visible }: DockGameBuddyProps) {
  if (!visible) return null;

  return (
    <span className="dock-game-buddy" aria-hidden>
      <GameCritterCharacter size={24} />
    </span>
  );
}
