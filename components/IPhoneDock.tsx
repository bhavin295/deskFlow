"use client";

import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";
import KeepAliveToggle from "@/components/KeepAliveToggle";
import { PreviewCountdownDockSlot } from "@/components/PreviewCountdown";
import DockGameBuddy from "@/components/animations/DockGameBuddy";
import DockWellnessBuddy from "@/components/animations/DockWellnessBuddy";
import { GamepadIcon, SettingsIcon, WellnessIcon } from "@/components/svg/Icons";

export type HubTab = "games" | "wellness";

type IPhoneDockProps = {
  canPlay: boolean;
  onOpenHub: (tab: HubTab) => void;
  onOpenSettings?: () => void;
};

export default function IPhoneDock({ canPlay, onOpenHub, onOpenSettings }: IPhoneDockProps) {
  return (
    <div className="iphone-dock iphone-no-drag">
      <div className="dock-panel dock-panel-funky dock-panel-compact">
        <StatsBar embedded />

        <div className="dock-tray">
          <span className="dock-tray-shine" aria-hidden />
          <button
            type="button"
            onClick={() => canPlay && onOpenHub("games")}
            disabled={!canPlay}
            title={canPlay ? "Open arcade games" : "Unavailable during alert"}
            className="dock-slot dock-slot-games"
          >
            <span className="dock-slot-playful">
              <DockGameBuddy visible={canPlay} />
            </span>
            <span className="dock-btn-bubble dock-btn-bubble-games">
              <GamepadIcon className="h-5 w-5" />
            </span>
            <span className="dock-slot-copy">
              <span className="dock-btn-label">Games</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => canPlay && onOpenHub("wellness")}
            disabled={!canPlay}
            title={canPlay ? "Open wellness tools" : "Unavailable during alert"}
            className="dock-slot dock-slot-wellness"
          >
            <span className="dock-slot-playful">
              <DockWellnessBuddy visible={canPlay} />
            </span>
            <span className="dock-btn-bubble dock-btn-bubble-wellness">
              <WellnessIcon className="h-5 w-5" />
            </span>
            <span className="dock-slot-copy">
              <span className="dock-btn-label">Wellness</span>
            </span>
          </button>

          <ThemeToggle />
        </div>

        <div className="dock-util-row">
          {onOpenSettings && (
            <button
              type="button"
              className="dock-util-slot dock-util-slot-settings"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              <span className="dock-util-icon dock-util-icon-settings" aria-hidden>
                <SettingsIcon className="h-4 w-4" />
              </span>
              <span className="dock-util-label">Settings</span>
            </button>
          )}
          <PreviewCountdownDockSlot />
        </div>

        <KeepAliveToggle />
      </div>

      <div className="iphone-home-indicator" aria-hidden />
    </div>
  );
}
