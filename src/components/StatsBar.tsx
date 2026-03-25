import type { ContributionsCollection } from "../lib/types";

interface StatsBarProps {
  collection: ContributionsCollection;
}

export default function StatsBar({ collection }: StatsBarProps) {
  const stats = [
    { value: collection.totalCommitContributions, label: "Commits" },
    { value: collection.totalPullRequestContributions, label: "PRs" },
    { value: collection.totalPullRequestReviewContributions, label: "Reviews" },
    { value: collection.totalIssueContributions, label: "Issues" },
    { value: collection.commitContributionsByRepository.length, label: "Repos" },
  ];

  return (
    <div className="flex gap-2 justify-center">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col items-center px-2 sm:px-3.5 py-2 rounded-lg bg-gh-badge flex-1 min-w-0"
        >
          <span className="text-xl font-bold">{s.value}</span>
          <span className="text-[11px] text-gh-text-secondary mt-0.5">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
