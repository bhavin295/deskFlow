import timerConfig from "@/config/timer.json";

export type TeamPolicy = {
  alertIntervalMinutes: number;
  countdownStart: number;
  label: string;
  source: "default" | "team";
};

export function getTeamPolicy(): TeamPolicy {
  const envMinutes = process.env.NEXT_PUBLIC_TEAM_INTERVAL_MINUTES;
  const parsed = envMinutes ? Number.parseInt(envMinutes, 10) : NaN;

  if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 30) {
    return {
      alertIntervalMinutes: parsed,
      countdownStart: timerConfig.COUNTDOWN_START,
      label: process.env.NEXT_PUBLIC_TEAM_POLICY_LABEL ?? "Team policy",
      source: "team",
    };
  }

  return {
    alertIntervalMinutes: timerConfig.ALERT_INTERVAL_MINUTES,
    countdownStart: timerConfig.COUNTDOWN_START,
    label: "Default",
    source: "default",
  };
}

export function intervalMatchesPolicy(userMinutes: number): boolean {
  return userMinutes === getTeamPolicy().alertIntervalMinutes;
}
