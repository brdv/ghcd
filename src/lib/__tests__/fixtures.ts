import type {
  ContributionDay,
  ContributionsCollection,
  ContributionWeek,
  GitHubUser,
  UserResult,
} from "../types";

/** Create a contribution day with sensible defaults. */
export function day(date: string, contributionCount: number, weekday = 0): ContributionDay {
  let level: ContributionDay["contributionLevel"] = "NONE";
  if (contributionCount > 0) level = "FIRST_QUARTILE";
  if (contributionCount >= 5) level = "SECOND_QUARTILE";
  if (contributionCount >= 10) level = "THIRD_QUARTILE";
  if (contributionCount >= 20) level = "FOURTH_QUARTILE";
  return { date, contributionCount, contributionLevel: level, weekday };
}

/** Create a week from an array of [date, count] pairs. */
export function week(days: [string, number, number?][]): ContributionWeek {
  return {
    contributionDays: days.map(([date, count, wd]) => day(date, count, wd ?? 0)),
  };
}

/** Create a minimal ContributionsCollection. */
export function collection(
  weeks: ContributionWeek[],
  overrides: Partial<ContributionsCollection> = {},
): ContributionsCollection {
  const total = weeks.reduce(
    (sum, w) => sum + w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
    0,
  );
  return {
    totalCommitContributions: 0,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 0,
    totalIssueContributions: 0,
    totalRepositoryContributions: 0,
    commitContributionsByRepository: [],
    contributionCalendar: { totalContributions: total, weeks },
    ...overrides,
  };
}

/** Create a minimal GitHubUser with the given collection. */
export function user(col: ContributionsCollection): GitHubUser {
  return {
    avatarUrl: "https://example.com/avatar.png",
    bio: null,
    company: null,
    location: null,
    websiteUrl: null,
    createdAt: "2020-01-01T00:00:00Z",
    followers: { totalCount: 0 },
    following: { totalCount: 0 },
    repositories: { nodes: [] },
    contributionsCollection: col,
  };
}

/** Create a UserResult with data. */
export function result(col: ContributionsCollection): UserResult {
  return { data: user(col) };
}
