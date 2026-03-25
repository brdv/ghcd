import { useRef, useState } from "react";
import type { Badge } from "../lib/badges";
import { ALL_STATS } from "../lib/stats";
import { computeStreak } from "../lib/streaks";
import type { UserResult } from "../lib/types";
import { computeVelocity } from "../lib/velocity";
import Heatmap from "./Heatmap";
import StatsBar from "./StatsBar";
import "./ContributionCard.css";

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
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const collection = result.data?.contributionsCollection;
  const totalContributions = collection?.contributionCalendar.totalContributions;
  const velocity = collection ? computeVelocity(collection, result.previousPeriodTotal) : null;
  const isClickable = !!result.data;
  const currentStreak = collection ? computeStreak(collection).current : 0;
  const hasStreak = currentStreak > 2;

  function handleSelect() {
    if (cardRef.current && onSelect) {
      onSelect(cardRef.current.getBoundingClientRect());
    }
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set to "button" when clickable
    <div
      ref={cardRef}
      className={`bg-gh-card rounded-xl px-5 py-4 transition-colors duration-150 ${
        hasStreak ? "streak-glow border border-transparent" : "border border-gh-border"
      } ${isClickable ? "cursor-pointer hover:border-gh-accent/50" : ""}`}
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
        <div className="relative w-8 h-8 shrink-0">
          {(!result.data || !avatarLoaded) && (
            <div className="absolute inset-0 rounded-full bg-gh-badge animate-pulse" />
          )}
          {result.data && (
            <img
              src={result.data.avatarUrl}
              alt=""
              className={`w-8 h-8 rounded-full transition-opacity duration-150 ${avatarLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setAvatarLoaded(true)}
            />
          )}
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="font-semibold text-[15px]">
            {username}
            {hasStreak && (
              <span className="ml-1 text-[13px]" title={`${currentStreak}d streak`}>
                🔥
              </span>
            )}
          </span>
          {totalContributions != null ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-gh-text-secondary text-xs font-bold">
                {totalContributions} contributions
              </span>
              {velocity && velocity.percentage !== 0 && <VelocityBadge velocity={velocity} />}
            </div>
          ) : result.loading ? (
            <div className="h-3 w-24 bg-gh-badge/50 rounded animate-pulse ml-2" />
          ) : null}
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide min-h-[22px]">
        {badges.length > 0
          ? badges.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gh-badge text-[11px] text-gh-text-secondary border border-gh-border shrink-0"
                title={b.tooltip}
              >
                <BadgeIcon icon={b.icon} />
                {b.label}
              </span>
            ))
          : result.loading
            ? ["badge-sk-1", "badge-sk-2", "badge-sk-3"].map((key) => (
                <div
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gh-badge/50 border border-gh-border/50 h-[22px] w-16"
                />
              ))
            : null}
      </div>

      {/* Body */}
      {result.loading && !collection && (
        <div className="animate-pulse">
          {/* Heatmap skeleton — matches SVG aspect ratio (7 rows × 16px + 20px top) */}
          <div className="overflow-hidden mb-3.5">
            <div className="w-full" style={{ aspectRatio: "880 / 132" }}>
              <div className="w-full h-full bg-gh-badge/50 rounded-md" />
            </div>
          </div>
          {/* Stats skeleton */}
          <div className="flex gap-2 justify-center">
            {Array.from(
              { length: visibleStats.length || ALL_STATS.length },
              (_, i) => `stat-sk-${i}`,
            ).map((key) => (
              <div
                key={key}
                className="flex flex-col items-center px-2 sm:px-3.5 py-2 rounded-lg bg-gh-badge/50 flex-1 min-w-0"
              >
                <div className="h-7 w-8 bg-gh-badge rounded mb-0.5" />
                <div className="h-3 w-12 bg-gh-badge rounded" />
              </div>
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

function VelocityBadge({ velocity }: { velocity: { percentage: number } }) {
  const isUp = velocity.percentage > 0;
  const arrow = isUp ? "\u2191" : "\u2193";
  const color = isUp ? "text-green-400" : "text-red-400";
  const bg = isUp ? "bg-green-400/10" : "bg-red-400/10";
  const display = `${Math.abs(Math.round(velocity.percentage))}%`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${color} ${bg}`}
      title={`${isUp ? "Up" : "Down"} ${display} compared to the previous period`}
    >
      {arrow} {display}
    </span>
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
    streak: "\u{26A1}", // lightning
  };
  return <span className="text-[13px] leading-none">{icons[icon] ?? "\u{1F3C6}"}</span>;
}
