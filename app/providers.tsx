"use client";

import { TrackerProvider } from "@/context/TrackerContext";
import { AppSettingsProvider } from "@/context/AppSettingsContext";
import VisualModeEffect from "@/components/VisualModeEffect";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppSettingsProvider>
      <TrackerProvider>
        <VisualModeEffect />
        <div className="h-full w-full">{children}</div>
      </TrackerProvider>
    </AppSettingsProvider>
  );
}
