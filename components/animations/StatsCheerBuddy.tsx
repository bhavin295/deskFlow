"use client";

import { CheerBlobCharacter } from "@/components/animations/CartoonCharacters";

type StatsCheerBuddyProps = {
  visible: boolean;
};

export default function StatsCheerBuddy({ visible }: StatsCheerBuddyProps) {
  if (!visible) return null;

  return (
    <div className="stats-cheer-buddy" aria-hidden>
      <CheerBlobCharacter size={26} />
    </div>
  );
}
