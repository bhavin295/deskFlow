"use client";

import { useTracker } from "@/context/TrackerContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import {
  AlertIcon,
  RunningIcon,
  ShieldIcon,
  WaitingIcon,
} from "@/components/svg/Icons";
import type { StatusLabel } from "@/types/tracker";
import type { ComponentType } from "react";
import StatusBuddy from "@/components/animations/StatusBuddy";
import { FashionCorner, SparkleBurst, StatusGlowRing } from "@/components/svg/FashionDecor";
import { getDeskqStatusHint } from "@/lib/deskqSyncMessage";

type IconProps = { className?: string };

function getStatusConfig(intervalMinutes: number, countdownStart: number): Record<
  StatusLabel,
  {
    Icon: ComponentType<IconProps>;
    hint: string;
    tone: string;
    iconTone: string;
  }
> {
  return {
    Running: {
      Icon: RunningIcon,
      tone: "status-tone-running",
      iconTone: "status-icon-running",
      hint: `Counting to ${intervalMinutes} min alert`,
    },
    Waiting: {
      Icon: WaitingIcon,
      tone: "status-tone-waiting",
      iconTone: "status-icon-waiting",
      hint: "Ready — DeskQ starts sessions",
    },
    "Awaiting DeskQ": {
      Icon: ShieldIcon,
      tone: "status-tone-deskq status-tone-awaiting-deskq",
      iconTone: "status-icon-deskq",
      hint: "Listening for DeskQ screenshot (12–18 min)",
    },
    "Alert Active": {
      Icon: AlertIcon,
      tone: "status-tone-alert",
      iconTone: "status-icon-alert",
      hint: `${countdownStart} second countdown`,
    },
  };
}

export default function StatusCard() {
  const { statusLabel, deskqStatus } = useTracker();
  const { settings } = useAppSettings();
  const deskqLinked = Boolean(deskqStatus?.running && deskqStatus?.agentDbPath);
  const deskqTracking = Boolean(deskqStatus?.deskqTrackingActive);
  const statusConfig = getStatusConfig(settings.alertIntervalMinutes, settings.countdownStart);
  const { Icon, hint, tone, iconTone } = statusConfig[statusLabel];
  const displayHint =
    statusLabel === "Waiting" ? getDeskqStatusHint(deskqLinked, deskqTracking) : hint;
  const isAwaitingDeskq = statusLabel === "Awaiting DeskQ";

  const isActiveStatus = statusLabel === "Running" || statusLabel === "Alert Active";

  return (
    <div className="status-section">
      <div
        key={statusLabel}
        className={`status-banner status-banner-animated status-banner-enter status-banner-funky relative shrink-0 ${tone}${isAwaitingDeskq ? " status-banner-awaiting-deskq" : ""}`}
      >
        <FashionCorner className="status-corner status-corner-tl" />
        <SparkleBurst className="status-sparkle-burst text-violet-500 dark:text-fuchsia-300" />
        <span className={`status-icon ${iconTone}${isActiveStatus ? " status-icon-funky" : ""}`}>
          <StatusGlowRing className="status-icon-ring" />
          <Icon className="relative z-[1] h-4 w-4" />
        </span>
        <span className="status-copy">
          <span className="status-eyebrow">Session status</span>
          <span className={`status-title${isActiveStatus ? " status-title-funky" : ""}`}>{statusLabel}</span>
          <span className="status-hint">{displayHint}</span>
        </span>
        {isAwaitingDeskq && (
          <div className="status-awaiting-progress" aria-hidden>
            <span className="status-awaiting-progress-bar" />
          </div>
        )}
        <StatusBuddy status={statusLabel} />
      </div>
    </div>
  );
}
