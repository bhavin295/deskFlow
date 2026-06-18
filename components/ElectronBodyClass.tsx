"use client";

import { useEffect } from "react";

export default function ElectronBodyClass() {
  useEffect(() => {
    if (window.electronAPI?.isElectron) {
      document.documentElement.classList.add("electron-app");
    }
  }, []);

  return null;
}
