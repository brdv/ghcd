import { useRef } from "react";
import type { Badge } from "../lib/badges";
import type { UserResult } from "../lib/types";
import Heatmap from "./Heatmap";
import StatsBar from "./StatsBar";

interface ContributionCardProps {
  username: string;
  result: UserResult;
  badges: Badge[];
  visibleStats: string[];
  onSelect?: (rect: DOMRect) => void;
}

export default function ContributionCard({
  username,
  result,
  badges,
  visibleStats,
  onSelect,
}: ContributionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const collection = result.data?.contributionsCollection;
  const totalContributions = collection?.contributionCalendar.totalContributions;
  const isClickable = !!result.data;

  function handleSelect() {
    if (cardRef.current && onSelect) {
      onSelect(cardRef.current.getBoundingClientRect());
    }
  }

  return (
    <div
      ref={cardRef}
      className={`bg-gh-card rounded-xl px-5 py-4 border border-gh-border transition-colors duration-150 ${
        isClickable ? "cursor-pointer hover:border-gh-accent/50" : ""
      }`}
      onClick={isClickable ? handleSelect : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter") handleSelect();
            }
          : undefined
      }
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        {result.data ? (
          <img src={result.data.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gh-badge animate-pulse" />
        )}
        <div className="flex items-center justify-between w-full">
          <span className="font-semibold text-[15px]">{username}</span>
          {totalContributions != null && (
            <span className="text-gh-text-secondary text-xs ml-2 font-bold">
              {totalContributions} contributions
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {badges.map((b) => (
            <span
              key={b.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gh-badge text-[11px] text-gh-text-secondary border border-gh-border"
              title={b.tooltip}
            >
              <BadgeIcon icon={b.icon} />
              {b.label}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      {result.loading && (
        <div className="animate-pulse">
          <div className="flex gap-1.5 mb-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 w-16 bg-gh-badge/50 rounded-full" />
            ))}
          </div>
          <div className="h-[100px] bg-gh-badge/50 rounded-md mb-3" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[52px] bg-gh-badge/50 rounded-lg flex-1" />
            ))}
          </div>
        </div>
      )}
      {result.error && <div className="text-gh-danger text-[13px] py-3">{result.error}</div>}
      {collection && (
        <>
          <Heatmap weeks={collection.contributionCalendar.weeks} />
          <StatsBar collection={collection} visibleStats={visibleStats} />
        </>
      )}
    </div>
  );
}

/** Placeholder icons — swap these for images later */
function BadgeIcon({ icon }: { icon: string }) {
  const icons: Record<string, string> = {
    commit: "\u{1F4BB}", // laptop
    pr: "\u{1F500}", // shuffle arrows
    review: "\u{1F50D}", // magnifying glass
    issue: "\u{1F41B}", // bug
    repo: "\u{1F5C2}", // folder
    active: "\u{1F525}", // fire
  };
  return <span className="text-[13px] leading-none">{icons[icon] ?? "\u{1F3C6}"}</span>;
}
