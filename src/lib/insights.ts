import { computeStreak } from "./streaks";
import type { ContributionDay, ContributionWeek } from "./types";

export interface ContributionInsights {
  currentStreak: number;
  longestStreak: number;
  peakDay: { date: string; count: number };
  busiestDayOfWeek: { day: string; avgCount: number };
  dailyAverage: number;
  totalDays: number;
  activeDays: number;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function computeInsights(weeks: ContributionWeek[]): ContributionInsights {
  const days: ContributionDay[] = weeks.flatMap((w) => w.contributionDays);

  // Peak day
  let peakDay = { date: "", count: 0 };
  for (const d of days) {
    if (d.contributionCount > peakDay.count) {
      peakDay = { date: d.date, count: d.contributionCount };
    }
  }

  // Streaks — single source of truth from streaks.ts (correctly skips future dates)
  const { current: currentStreak, longest: longestStreak } = computeStreak(weeks);

  // Busiest day of week
  const dayTotals = Array(7).fill(0);
  const dayCounts = Array(7).fill(0);
  for (const d of days) {
    dayTotals[d.weekday] += d.contributionCount;
    dayCounts[d.weekday]++;
  }
  let busiestIdx = 0;
  let busiestAvg = 0;
  for (let i = 0; i < 7; i++) {
    const avg = dayCounts[i] > 0 ? dayTotals[i] / dayCounts[i] : 0;
    if (avg > busiestAvg) {
      busiestAvg = avg;
      busiestIdx = i;
    }
  }

  // Daily average & active days
  const totalDays = days.length;
  const activeDays = days.filter((d) => d.contributionCount > 0).length;
  const totalContributions = days.reduce((sum, d) => sum + d.contributionCount, 0);

  return {
    currentStreak,
    longestStreak,
    peakDay,
    busiestDayOfWeek: { day: DAY_NAMES[busiestIdx], avgCount: Math.round(busiestAvg * 10) / 10 },
    dailyAverage: totalDays > 0 ? Math.round((totalContributions / totalDays) * 10) / 10 : 0,
    totalDays,
    activeDays,
  };
}
