import type { DesqStatus } from "@/types/electron";

export type DeskqConnectionState = "disconnected" | "linked" | "tracking";

export function getDeskqConnectionState(deskqStatus: DesqStatus | null): DeskqConnectionState {
  if (!deskqStatus?.running || !deskqStatus?.agentDbPath) return "disconnected";
  if (deskqStatus.deskqTrackingActive) return "tracking";
  return "linked";
}

export const DESKQ_CONNECTION_LABELS: Record<DeskqConnectionState, string> = {
  disconnected: "Not linked",
  linked: "Linked",
  tracking: "Tracking",
};
