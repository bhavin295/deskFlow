"use client";

import { BlueBirdCharacter, ChickCharacter } from "@/components/animations/CartoonCharacters";

type TimerBuddyProps = {
  running: boolean;
};

export default function TimerBuddy({ running }: TimerBuddyProps) {
  if (running) {
    return (
      <div className="timer-orbit-character" aria-hidden>
        <div className="timer-orbit-character-arm">
          <div className="timer-orbit-character-upright">
            <BlueBirdCharacter size={30} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-idle-chick" aria-hidden>
      <ChickCharacter size={28} />
    </div>
  );
}
