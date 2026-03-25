import { ALL_STATS } from "../lib/stats";
import type { ContributionsCollection } from "../lib/types";

interface StatsBarProps {
  collection: ContributionsCollection;
  visibleStats?: string[];
}

export default function StatsBar({ collection, visibleStats }: StatsBarProps) {
  const stats = visibleStats ? ALL_STATS.filter((s) => visibleStats.includes(s.id)) : ALL_STATS;

  if (stats.length === 0) return null;

  return (
    <div className="flex gap-2 justify-center">
      {stats.map((s) => (
        <div
          key={s.id}
          className="flex flex-col items-center px-2 sm:px-3.5 py-2 rounded-lg bg-gh-badge flex-1 min-w-0"
        >
          <span className="text-xl font-bold">
            {s.getValue(collection)}
            {s.id === "streak" && (
              <span className="text-[11px] font-normal text-gh-text-secondary">d</span>
            )}
          </span>
          <span className="text-[11px] text-gh-text-secondary mt-0.5">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
