import { fetchPublicEvents, fetchUserRest, type GitHubEvent } from "./githubRest";
import type {
  ContributionDay,
  ContributionLevel,
  ContributionsCollection,
  ContributionWeek,
  GitHubUser,
  RepoContribution,
} from "./types";

/** Format a Date as YYYY-MM-DD in local timezone (matching the heatmap's date parsing). */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert a UTC ISO timestamp to a local-timezone YYYY-MM-DD string. */
function utcToLocalDateStr(iso: string): string {
  return toLocalDateStr(new Date(iso));
}

function assignLevel(count: number, thresholds: number[]): ContributionLevel {
  if (count === 0) return "NONE";
  if (count <= thresholds[0]) return "FIRST_QUARTILE";
  if (count <= thresholds[1]) return "SECOND_QUARTILE";
  if (count <= thresholds[2]) return "THIRD_QUARTILE";
  return "FOURTH_QUARTILE";
}

function buildContributions(
  events: GitHubEvent[],
  from: string,
  to: string,
): {
  calendar: ContributionsCollection["contributionCalendar"];
  stats: Pick<
    ContributionsCollection,
    | "totalCommitContributions"
    | "totalPullRequestContributions"
    | "totalPullRequestReviewContributions"
    | "totalIssueContributions"
    | "totalRepositoryContributions"
  >;
  commitContributionsByRepository: RepoContribution[];
} {
  // Count contributions per day and by type
  const dayCounts = new Map<string, number>();
  // Track commits per repo (owner/name → count)
  const repoCommits = new Map<string, number>();
  let commits = 0;
  let prs = 0;
  let reviews = 0;
  let issues = 0;
  let repos = 0;

  for (const event of events) {
    const date = utcToLocalDateStr(event.created_at);
    switch (event.type) {
      case "PushEvent": {
        const size = event.payload.size ?? 1;
        dayCounts.set(date, (dayCounts.get(date) ?? 0) + size);
        commits += size;
        repoCommits.set(event.repo.name, (repoCommits.get(event.repo.name) ?? 0) + size);
        break;
      }
      case "PullRequestEvent":
        if (event.payload.action === "opened") {
          dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
          prs++;
        }
        break;
      case "PullRequestReviewEvent":
        dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
        reviews++;
        break;
      case "IssuesEvent":
        if (event.payload.action === "opened") {
          dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
          issues++;
        }
        break;
      case "CreateEvent":
        if (event.payload.ref_type === "repository") {
          dayCounts.set(date, (dayCounts.get(date) ?? 0) + 1);
          repos++;
        }
        break;
    }
  }

  // Build top repos sorted by commit count (top 5, matching GraphQL maxRepositories)
  const commitContributionsByRepository: RepoContribution[] = [...repoCommits.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nameWithOwner, count]) => ({
      repository: {
        name: nameWithOwner.split("/")[1] ?? nameWithOwner,
        nameWithOwner,
        url: `https://github.com/${nameWithOwner}`,
      },
      contributions: { totalCount: count },
    }));

  // Compute quartile thresholds from non-zero days
  const nonZero = [...dayCounts.values()].sort((a, b) => a - b);
  const thresholds =
    nonZero.length > 0
      ? [
          nonZero[Math.floor(nonZero.length * 0.25)] ?? 1,
          nonZero[Math.floor(nonZero.length * 0.5)] ?? 2,
          nonZero[Math.floor(nonZero.length * 0.75)] ?? 4,
        ]
      : [1, 2, 4];

  // Build the calendar for the date range, aligned to weeks (Sunday start).
  // Use local-timezone dates so they match the heatmap's `new Date("YYYY-MM-DDT00:00:00")`.
  const fromDate = new Date(`${from.slice(0, 10)}T00:00:00`);
  const toDate = new Date(`${to.slice(0, 10)}T00:00:00`);

  // Align to Sunday of the first week
  const startDay = new Date(fromDate);
  startDay.setDate(startDay.getDate() - startDay.getDay());

  const weeks: ContributionWeek[] = [];
  let totalContributions = 0;
  const current = new Date(startDay);

  while (current <= toDate) {
    const days: ContributionDay[] = [];
    for (let wd = 0; wd < 7; wd++) {
      const dateStr = toLocalDateStr(current);
      const count = dayCounts.get(dateStr) ?? 0;
      const inRange = current >= fromDate && current <= toDate;
      const effectiveCount = inRange ? count : 0;
      totalContributions += effectiveCount;
      days.push({
        date: dateStr,
        contributionCount: effectiveCount,
        contributionLevel: inRange ? assignLevel(effectiveCount, thresholds) : "NONE",
        weekday: wd,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push({ contributionDays: days });
  }

  return {
    calendar: { totalContributions, weeks },
    stats: {
      totalCommitContributions: commits,
      totalPullRequestContributions: prs,
      totalPullRequestReviewContributions: reviews,
      totalIssueContributions: issues,
      totalRepositoryContributions: repos,
    },
    commitContributionsByRepository,
  };
}

export async function fetchUserPublic(
  username: string,
  opts: { from: string; to: string },
  signal?: AbortSignal,
): Promise<GitHubUser> {
  const [rest, events] = await Promise.all([
    fetchUserRest(username, undefined, signal),
    fetchPublicEvents(username, undefined, signal),
  ]);

  const { calendar, stats, commitContributionsByRepository } = buildContributions(
    events,
    opts.from,
    opts.to,
  );

  return {
    avatarUrl: rest.avatar_url,
    bio: rest.bio,
    company: rest.company,
    location: rest.location,
    websiteUrl: rest.blog || null,
    createdAt: rest.created_at,
    followers: { totalCount: rest.followers },
    following: { totalCount: rest.following },
    repositories: { nodes: [] },
    contributionsCollection: {
      ...stats,
      commitContributionsByRepository,
      contributionCalendar: calendar,
    },
  };
}
