"use client";

import {
  AlarmBellCharacter,
  CameraBotCharacter,
  FoxCharacter,
  OwlCharacter,
} from "@/components/animations/CartoonCharacters";
import type { StatusLabel } from "@/types/tracker";

const statusBubbles: Partial<Record<StatusLabel, string>> = {
  Waiting: "Hey!",
  Running: "Go!",
  "Awaiting DeskQ": "Snap",
  "Alert Active": "Now!",
};

type StatusBuddyProps = {
  status: StatusLabel;
};

export default function StatusBuddy({ status }: StatusBuddyProps) {
  const bubble = statusBubbles[status];

  return (
    <div className={`status-mascot status-mascot-${status.toLowerCase().replace(/\s+/g, "-")}`} aria-hidden>
      {status === "Waiting" && <OwlCharacter size={38} />}
      {status === "Running" && <FoxCharacter size={36} />}
      {status === "Awaiting DeskQ" && <CameraBotCharacter size={36} />}
      {status === "Alert Active" && <AlarmBellCharacter size={38} />}
      {bubble && <span className="status-mascot-bubble">{bubble}</span>}
    </div>
  );
}
