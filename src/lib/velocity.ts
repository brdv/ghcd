import type { ContributionsCollection } from "./types";

export interface VelocityInfo {
  /** Percentage change: positive = trending up, negative = trending down */
  percentage: number;
  /** Total contributions in the more recent half */
  recentTotal: number;
  /** Total contributions in the earlier half */
  previousTotal: number;
}

/**
 * Compute week-over-week contribution velocity by splitting the date range
 * into two equal halves and comparing their totals.
 *
 * Returns null if there are fewer than 2 days of data.
 */
export function computeVelocity(collection: ContributionsCollection): VelocityInfo | null {
  const days = collection.contributionCalendar.weeks.flatMap((w) => w.contributionDays);

  if (days.length < 2) return null;

  const mid = Math.floor(days.length / 2);
  const previousDays = days.slice(0, mid);
  const recentDays = days.slice(mid);

  const previousTotal = previousDays.reduce((sum, d) => sum + d.contributionCount, 0);
  const recentTotal = recentDays.reduce((sum, d) => sum + d.contributionCount, 0);

  // Normalise to daily averages so uneven splits don't skew the result
  const previousAvg = previousTotal / previousDays.length;
  const recentAvg = recentTotal / recentDays.length;

  let percentage: number;
  if (previousAvg === 0) {
    percentage = recentAvg > 0 ? 100 : 0;
  } else {
    percentage = ((recentAvg - previousAvg) / previousAvg) * 100;
  }

  return { percentage, recentTotal, previousTotal };
}
