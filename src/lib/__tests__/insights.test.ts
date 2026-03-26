import { describe, expect, it } from "vitest";
import { computeInsights } from "../insights";
import { week } from "./fixtures";

describe("computeInsights", () => {
  it("computes peak day correctly", () => {
    const weeks = [
      week([
        ["2026-03-01", 1, 0],
        ["2026-03-02", 10, 1],
        ["2026-03-03", 3, 2],
      ]),
    ];
    const insights = computeInsights(weeks);
    expect(insights.peakDay).toEqual({ date: "2026-03-02", count: 10 });
  });

  it("computes active days and total days", () => {
    const weeks = [
      week([
        ["2026-03-01", 1, 0],
        ["2026-03-02", 0, 1],
        ["2026-03-03", 3, 2],
        ["2026-03-04", 0, 3],
      ]),
    ];
    const insights = computeInsights(weeks);
    expect(insights.activeDays).toBe(2);
    expect(insights.totalDays).toBe(4);
  });

  it("computes daily average", () => {
    const weeks = [
      week([
        ["2026-03-01", 4, 0],
        ["2026-03-02", 6, 1],
      ]),
    ];
    const insights = computeInsights(weeks);
    expect(insights.dailyAverage).toBe(5); // (4+6)/2
  });

  it("uses computeStreak for streak values (skips future dates)", () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];
    const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString().split("T")[0];

    const weeks = [
      week([
        [today, 3],
        [tomorrow, 0],
        [dayAfter, 0],
      ]),
    ];
    const insights = computeInsights(weeks);
    // Should use computeStreak which skips future dates
    expect(insights.currentStreak).toBe(1);
  });

  it("computes busiest day of week", () => {
    // weekday 1 = Monday in GitHub's schema
    const weeks = [
      week([
        ["2026-03-02", 10, 1], // Monday
        ["2026-03-03", 2, 2], // Tuesday
        ["2026-03-09", 8, 1], // Monday
        ["2026-03-10", 4, 2], // Tuesday
      ]),
    ];
    const insights = computeInsights(weeks);
    expect(insights.busiestDayOfWeek.day).toBe("Mon"); // avg 9 vs avg 3
  });

  it("handles empty weeks", () => {
    const insights = computeInsights([]);
    expect(insights.totalDays).toBe(0);
    expect(insights.activeDays).toBe(0);
    expect(insights.dailyAverage).toBe(0);
    expect(insights.currentStreak).toBe(0);
    expect(insights.longestStreak).toBe(0);
  });
});
