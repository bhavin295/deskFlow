"use client";

import { WellnessBlobCharacter } from "@/components/animations/CartoonCharacters";

type DockWellnessBuddyProps = {
  visible: boolean;
};

export default function DockWellnessBuddy({ visible }: DockWellnessBuddyProps) {
  if (!visible) return null;

  return (
    <span className="dock-wellness-buddy" aria-hidden>
      <WellnessBlobCharacter size={24} />
    </span>
  );
}
