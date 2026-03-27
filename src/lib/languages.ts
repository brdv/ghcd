import type { LanguageEdge } from "./types";

export interface AggregatedLanguage {
  name: string;
  color: string;
  /** Normalized share (sum of per-repo fractions). */
  share: number;
  /** Final percentage across all repos (0–100). */
  percentage: number;
}

/**
 * Aggregate language data across multiple repositories.
 *
 * GitHub reports language sizes in raw bytes, which lets a single large repo
 * (or a verbose language like CSS) dominate the breakdown. To compensate, each
 * repo's languages are first normalized to percentages so every repo
 * contributes equally, then the per-repo percentages are summed and
 * re-normalized into final overall percentages.
 */
export function aggregateLanguages(
  repositories: { languages: { edges: LanguageEdge[] } }[],
): AggregatedLanguage[] {
  const totals = new Map<string, { share: number; color: string }>();

  for (const repo of repositories) {
    // Total bytes in this repo — used to turn absolute sizes into fractions.
    const repoTotal = repo.languages.edges.reduce((sum, e) => sum + e.size, 0);
    if (repoTotal === 0) continue;

    for (const edge of repo.languages.edges) {
      // Per-repo fraction (0–1) so every repo is weighted equally.
      const share = edge.size / repoTotal;
      const existing = totals.get(edge.node.name);
      if (existing) {
        existing.share += share;
      } else {
        totals.set(edge.node.name, {
          share,
          color: edge.node.color ?? "#8b8b8b",
        });
      }
    }
  }

  const entries = [...totals.entries()].sort((a, b) => b[1].share - a[1].share);
  const totalShare = entries.reduce((sum, [, v]) => sum + v.share, 0);
  if (totalShare === 0) return [];

  return entries.map(([name, { share, color }]) => ({
    name,
    color,
    share,
    percentage: (share / totalShare) * 100,
  }));
}
