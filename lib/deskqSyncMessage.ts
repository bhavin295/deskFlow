export function getDeskqSyncMessage(deskqLinked: boolean, deskqTracking: boolean): {
  title: string;
  detail: string;
} {
  if (!deskqLinked) {
    return {
      title: "DeskQ Agent not linked",
      detail: "Install DeskQ Agent to sync sessions",
    };
  }
  if (deskqTracking) {
    return {
      title: "DeskQ is tracking",
      detail: "Syncing your session…",
    };
  }
  return {
    title: "Waiting for DeskQ Agent",
    detail: "Start the tracker in DeskQ to begin",
  };
}

/** Short hint for status card. */
export function getDeskqStatusHint(deskqLinked: boolean, deskqTracking: boolean): string {
  if (!deskqLinked) return "Install DeskQ Agent to connect";
  if (deskqTracking) return "Session syncing with DeskQ";
  return "Start tracker in DeskQ to begin";
}
