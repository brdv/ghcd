import type { ContributionsCollection } from "./types";

export interface StreakInfo {
  longest: number;
  current: number;
}

/**
 * Compute the longest and current contribution streaks from calendar data.
 * Days are ordered chronologically across weeks.
 */
export function computeStreak(collection: ContributionsCollection): StreakInfo {
  const days = collection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

  let longest = 0;
  let current = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }

  return { longest, current };
}
