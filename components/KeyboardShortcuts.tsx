"use client";

import { useEffect } from "react";

type KeyboardShortcutsProps = {
  onOpenSettings: () => void;
};

export default function KeyboardShortcuts({ onOpenSettings }: KeyboardShortcutsProps) {
  useEffect(() => {
    const api = window.electronAPI;
    const unsubSettings = api?.onOpenSettings?.(() => onOpenSettings());

    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || !event.shiftKey) return;

      if (event.key === ",") {
        event.preventDefault();
        onOpenSettings();
        return;
      }

      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        void api?.minimizeToTray?.();
        return;
      }

      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        void api?.testAlert?.();
        return;
      }

      if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        void api?.syncDeskq?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unsubSettings?.();
    };
  }, [onOpenSettings]);

  return null;
}
