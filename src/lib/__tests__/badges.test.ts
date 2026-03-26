import { describe, expect, it } from "vitest";
import { computeBadges } from "../badges";
import type { UserResult } from "../types";
import { collection, result, week } from "./fixtures";

describe("computeBadges", () => {
  it("returns empty when fewer than 2 users have data", () => {
    const results: Record<string, UserResult> = {
      alice: result(collection([week([["2026-03-01", 10]])])),
    };
    expect(computeBadges(results)).toEqual({});
  });

  it("returns empty for zero-value results", () => {
    const results: Record<string, UserResult> = {
      alice: result(collection([week([["2026-03-01", 0]])])),
      bob: result(collection([week([["2026-03-01", 0]])])),
    };
    expect(computeBadges(results)).toEqual({});
  });

  it("awards badge to clear winner", () => {
    const results: Record<string, UserResult> = {
      alice: result(
        collection([week([["2026-03-01", 10]])], {
          totalCommitContributions: 50,
        }),
      ),
      bob: result(
        collection([week([["2026-03-01", 5]])], {
          totalCommitContributions: 20,
        }),
      ),
    };
    const badges = computeBadges(results);
    // Alice should win "Activity Ace" (10 vs 5 total contributions)
    // and "Commit Captain" (50 vs 20 commits)
    expect(badges.alice).toBeDefined();
    expect(badges.alice.some((b) => b.id === "most-active")).toBe(true);
    expect(badges.alice.some((b) => b.id === "top-committer")).toBe(true);
  });

  it("does not award badge on tie", () => {
    const results: Record<string, UserResult> = {
      alice: result(
        collection([week([["2026-03-01", 10]])], {
          totalCommitContributions: 30,
        }),
      ),
      bob: result(
        collection([week([["2026-03-01", 10]])], {
          totalCommitContributions: 30,
        }),
      ),
    };
    const badges = computeBadges(results);
    // Tied on everything — no badges awarded
    const allBadges = Object.values(badges).flat();
    expect(allBadges.find((b) => b.id === "top-committer")).toBeUndefined();
    expect(allBadges.find((b) => b.id === "most-active")).toBeUndefined();
  });

  it("skips users with only loading/error state", () => {
    const results: Record<string, UserResult> = {
      alice: result(
        collection([week([["2026-03-01", 10]])], {
          totalCommitContributions: 50,
        }),
      ),
      bob: { loading: true },
      charlie: { error: "not found" },
    };
    // Only 1 user with data → no badges
    expect(computeBadges(results)).toEqual({});
  });
});
