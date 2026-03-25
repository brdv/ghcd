export type ContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export interface ContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel: ContributionLevel;
  weekday: number;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface RepoContribution {
  repository: { name: string; nameWithOwner: string; url: string };
  contributions: { totalCount: number };
}

export interface ContributionsCollection {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalIssueContributions: number;
  totalRepositoryContributions: number;
  commitContributionsByRepository: RepoContribution[];
  contributionCalendar: ContributionCalendar;
}

export interface GitHubUser {
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  createdAt: string;
  followers: { totalCount: number };
  following: { totalCount: number };
  contributionsCollection: ContributionsCollection;
}

export interface UserResult {
  loading?: boolean;
  error?: string;
  data?: GitHubUser;
  /** Total contributions in the equally-sized period before the selected range. */
  previousPeriodTotal?: number;
  /** Length of the selected period in days. */
  periodDays?: number;
}
