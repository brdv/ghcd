import type { ContributionWeek } from "./types";

export interface StreakInfo {
  longest: number;
  current: number;
}

/**
 * Compute the longest and current contribution streaks from calendar data.
 * Days are ordered chronologically across weeks.
 */
export function computeStreak(weeks: ContributionWeek[]): StreakInfo {
  const days = weeks.flatMap((w) => w.contributionDays);

  // Longest streak: scan forward through all days
  let longest = 0;
  let run = 0;
  for (const day of days) {
    if (day.contributionCount > 0) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  // Current streak: scan backward from today (skip future days)
  const today = new Date().toISOString().split("T")[0];
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date > today) continue; // skip future dates
    if (days[i].contributionCount > 0) {
      current++;
    } else {
      break;
    }
  }

  return { longest, current };
}
