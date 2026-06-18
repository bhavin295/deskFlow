"use client";

import DeskFlowLogo from "@/components/svg/DeskFlowLogo";
import BrandMascot from "@/components/animations/BrandMascot";
import DeskQHealthBadge from "@/components/DeskQHealthBadge";
import { useAppSettings } from "@/context/AppSettingsContext";

export default function AppBrand() {
  const { settings } = useAppSettings();

  return (
    <div className="app-brand app-brand-funky">
      <div className="app-brand-copy">
        <div className="app-brand-title-row">
          <DeskFlowLogo className="app-brand-icon" />
          <h1 className="app-brand-title">DeskFlow</h1>
          <DeskQHealthBadge />
        </div>
        <p className="app-brand-tagline">{settings.alertIntervalMinutes}-min focus cycles</p>
      </div>
      <div className="app-brand-playful">
        <BrandMascot />
      </div>
    </div>
  );
}
