import { describe, expect, it } from "vitest";
import { computeStreak } from "../streaks";
import { week } from "./fixtures";

describe("computeStreak", () => {
  it("returns zero for empty weeks", () => {
    const result = computeStreak([]);
    expect(result).toEqual({ longest: 0, current: 0 });
  });

  it("computes longest streak across days", () => {
    const weeks = [
      week([
        ["2026-03-01", 1],
        ["2026-03-02", 5],
        ["2026-03-03", 3],
        ["2026-03-04", 0],
        ["2026-03-05", 2],
        ["2026-03-06", 1],
      ]),
    ];
    const result = computeStreak(weeks);
    expect(result.longest).toBe(3); // Mar 1-3
  });

  it("computes current streak scanning backward from today", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().split("T")[0];

    const weeks = [
      week([
        [twoDaysAgo, 3],
        [yesterday, 5],
        [today, 2],
      ]),
    ];
    const result = computeStreak(weeks);
    expect(result.current).toBe(3);
  });

  it("current streak stops at a zero-contribution day", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().split("T")[0];

    const weeks = [
      week([
        [twoDaysAgo, 0],
        [yesterday, 5],
        [today, 2],
      ]),
    ];
    const result = computeStreak(weeks);
    expect(result.current).toBe(2);
  });

  it("skips future dates when computing current streak", () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];
    const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString().split("T")[0];

    const weeks = [
      week([
        [today, 3],
        [tomorrow, 0], // future zero — should be skipped
        [dayAfter, 0], // future zero — should be skipped
      ]),
    ];
    const result = computeStreak(weeks);
    expect(result.current).toBe(1); // only today counts
  });

  it("current streak is zero when today has no contributions", () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

    const weeks = [
      week([
        [yesterday, 5],
        [today, 0],
      ]),
    ];
    const result = computeStreak(weeks);
    expect(result.current).toBe(0);
  });
});
