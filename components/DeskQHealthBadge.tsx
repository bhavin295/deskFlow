"use client";

import { getDeskqConnectionState } from "@/lib/deskqConnection";
import { useTracker } from "@/context/TrackerContext";

export default function DeskQHealthBadge() {
  const { deskqStatus } = useTracker();
  const connection = getDeskqConnectionState(deskqStatus);

  return (
    <span
      className={`deskq-health-badge deskq-health-badge-${connection}`}
      title={`DeskQ: ${connection}`}
      aria-label={`DeskQ connection: ${connection}`}
    >
      <span className="deskq-health-badge-dot" aria-hidden />
    </span>
  );
}
