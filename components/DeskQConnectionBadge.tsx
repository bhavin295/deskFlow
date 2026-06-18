"use client";

import { DESKQ_CONNECTION_LABELS, getDeskqConnectionState } from "@/lib/deskqConnection";
import { useTracker } from "@/context/TrackerContext";

export default function DeskQConnectionBadge() {
  const { deskqStatus } = useTracker();
  const connection = getDeskqConnectionState(deskqStatus);
  const label = DESKQ_CONNECTION_LABELS[connection];

  return (
    <span className={`deskq-connection-badge deskq-connection-${connection}`} title={`DeskQ: ${label}`}>
      <span className="deskq-connection-dot" aria-hidden />
      {label}
    </span>
  );
}
