import { useMemo } from "react";
import { computeInsights } from "../lib/insights";
import type { GitHubUser } from "../lib/types";
import { computeVelocity } from "../lib/velocity";
import DayOfWeekChart from "./DayOfWeekChart";
import Heatmap from "./Heatmap";
import StatsBar from "./StatsBar";

interface UserProfileProps {
  username: string;
  data: GitHubUser;
  previousPeriodTotal?: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InsightCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-2.5 rounded-lg bg-gh-badge">
      <dd className="text-lg font-bold m-0">{value}</dd>
      {sub && <span className="text-[10px] text-gh-text-secondary">{sub}</span>}
      <dt className="text-[11px] text-gh-text-secondary mt-0.5">{label}</dt>
    </div>
  );
}

export default function UserProfile({ username, data, previousPeriodTotal }: UserProfileProps) {
  const collection = data.contributionsCollection;
  const calendar = collection.contributionCalendar;
  const insights = useMemo(() => computeInsights(calendar.weeks), [calendar.weeks]);
  const velocity = useMemo(
    () => computeVelocity(collection, previousPeriodTotal),
    [collection, previousPeriodTotal],
  );
  const topRepos = collection.commitContributionsByRepository;

  const meta: { icon: string; text: string }[] = [];
  if (data.location) meta.push({ icon: "\u{1F4CD}", text: data.location });
  if (data.company) meta.push({ icon: "\u{1F3E2}", text: data.company });
  if (data.websiteUrl) meta.push({ icon: "\u{1F517}", text: data.websiteUrl });

  return (
    <>
      {/* Profile meta */}
      {meta.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gh-text-secondary">
          {meta.map((m) => (
            <span key={m.text} className="flex items-center gap-1">
              <span className="text-xs">{m.icon}</span> {m.text}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="text-xs">{"\u{1F465}"}</span>
            {data.followers.totalCount} followers &middot; {data.following.totalCount} following
          </span>
        </div>
      )}

      {/* Stats bar */}
      <StatsBar collection={collection} />

      {/* Insights grid */}
      <div>
        <h3 className="text-sm font-medium text-gh-text-secondary mb-2">Insights</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 m-0">
          <InsightCard label="Current Streak" value={`${insights.currentStreak}d`} />
          <InsightCard label="Longest Streak" value={`${insights.longestStreak}d`} />
          <InsightCard label="Daily Average" value={`${insights.dailyAverage}`} />
          <InsightCard label="Active Days" value={`${insights.activeDays}/${insights.totalDays}`} />
          <InsightCard
            label="Peak Day"
            value={`${insights.peakDay.count}`}
            sub={insights.peakDay.date ? formatDate(insights.peakDay.date) : undefined}
          />
          <InsightCard
            label="Busiest Day"
            value={insights.busiestDayOfWeek.day}
            sub={`~${insights.busiestDayOfWeek.avgCount}/day`}
          />
          {velocity && (
            <InsightCard
              label="Velocity"
              value={`${velocity.percentage > 0 ? "+" : ""}${Math.round(velocity.percentage)}%`}
              sub={
                velocity.percentage > 0
                  ? "trending up"
                  : velocity.percentage < 0
                    ? "trending down"
                    : "steady"
              }
            />
          )}
        </dl>
      </div>

      {/* Top repositories */}
      {topRepos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gh-text-secondary mb-2">Top Repositories</h3>
          <div className="flex flex-col gap-1.5">
            {topRepos.map((r) => (
              <a
                key={r.repository.url}
                href={r.repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gh-badge hover:bg-gh-border transition-colors text-sm no-underline"
              >
                <span className="text-gh-text-primary font-medium truncate mr-2">
                  {r.repository.name}
                </span>
                <span className="text-gh-text-secondary text-xs shrink-0">
                  {r.contributions.totalCount} commits
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div>
        <h3 className="text-sm font-medium text-gh-text-secondary mb-2">Contribution Activity</h3>
        <Heatmap weeks={calendar.weeks} />
      </div>

      {/* Day of week breakdown */}
      <div>
        <h3 className="text-sm font-medium text-gh-text-secondary mb-2">Activity by Day</h3>
        <DayOfWeekChart weeks={calendar.weeks} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gh-accent hover:text-gh-accent-hover font-medium"
        >
          View on GitHub &rarr;
        </a>
        <span className="text-gh-text-secondary text-xs">
          Member since {formatDate(data.createdAt)}
        </span>
      </div>
    </>
  );
}
