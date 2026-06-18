"use client";

import { useEffect } from "react";
import { useAppSettings } from "@/context/AppSettingsContext";

export default function VisualModeEffect() {
  const { settings, hydrated } = useAppSettings();

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("visual-focus-mode", !settings.playfulMode);
  }, [hydrated, settings.playfulMode]);

  return null;
}
