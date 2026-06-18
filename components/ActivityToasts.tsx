"use client";

import { useEffect, useState } from "react";
import { recordSessionEvent } from "@/lib/sessionHistory";

type ToastItem = {
  id: string;
  message: string;
  tone: "ok" | "warn" | "error";
};

export default function ActivityToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onKeepAliveActivity) return;

    return api.onKeepAliveActivity((payload) => {
      const message =
        payload.message ??
        (payload.ok || payload.effective
          ? `${payload.method ?? "Nudge"} · idle reset OK`
          : "Keep-alive nudge failed");
      const tone = payload.ok || payload.effective ? "ok" : "error";
      const id = `ka-${Date.now()}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      recordSessionEvent("keep_alive_nudge", message, {
        ok: Boolean(payload.ok ?? payload.effective),
      });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="activity-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`activity-toast activity-toast-${toast.tone}`} role="status">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
