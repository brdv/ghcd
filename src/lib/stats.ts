import { computeStreak } from "./streaks";
import type { ContributionsCollection } from "./types";

export interface StatDefinition {
  id: string;
  label: string;
  getValue: (c: ContributionsCollection) => number;
}

export const ALL_STATS: StatDefinition[] = [
  { id: "commits", label: "Commits", getValue: (c) => c.totalCommitContributions },
  { id: "prs", label: "PRs", getValue: (c) => c.totalPullRequestContributions },
  { id: "reviews", label: "Reviews", getValue: (c) => c.totalPullRequestReviewContributions },
  { id: "issues", label: "Issues", getValue: (c) => c.totalIssueContributions },
  { id: "repos", label: "Repos", getValue: (c) => c.commitContributionsByRepository.length },
  { id: "streak", label: "Streak", getValue: (c) => computeStreak(c).longest },
];

export const DEFAULT_VISIBLE_STATS = ALL_STATS.map((s) => s.id);
