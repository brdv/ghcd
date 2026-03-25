import type { ContributionsCollection } from "./types";

export interface VelocityInfo {
  /** Percentage change: positive = trending up, negative = trending down */
  percentage: number;
  /** Total contributions in the current period */
  currentTotal: number;
  /** Total contributions in the previous period */
  previousTotal: number;
}

/**
 * Compute contribution velocity by comparing the current period's total
 * against an equally-sized previous period.
 *
 * Returns null when previous period data is unavailable.
 */
export function computeVelocity(
  collection: ContributionsCollection,
  previousPeriodTotal: number | undefined,
): VelocityInfo | null {
  if (previousPeriodTotal == null) return null;

  const currentTotal = collection.contributionCalendar.totalContributions;

  let percentage: number;
  if (previousPeriodTotal === 0) {
    percentage = currentTotal > 0 ? 100 : 0;
  } else {
    percentage = ((currentTotal - previousPeriodTotal) / previousPeriodTotal) * 100;
  }

  return { percentage, currentTotal, previousTotal: previousPeriodTotal };
}
