export type ContributionLevel =
  | 'NONE'
  | 'FIRST_QUARTILE'
  | 'SECOND_QUARTILE'
  | 'THIRD_QUARTILE'
  | 'FOURTH_QUARTILE'

export interface ContributionDay {
  date: string
  contributionCount: number
  contributionLevel: ContributionLevel
  weekday: number
}

export interface ContributionWeek {
  contributionDays: ContributionDay[]
}

export interface ContributionCalendar {
  totalContributions: number
  weeks: ContributionWeek[]
}

export interface ContributionsCollection {
  totalCommitContributions: number
  totalPullRequestContributions: number
  totalPullRequestReviewContributions: number
  totalIssueContributions: number
  totalRepositoryContributions: number
  contributionCalendar: ContributionCalendar
}

export interface GitHubUser {
  avatarUrl: string
  contributionsCollection: ContributionsCollection
}

export interface UserResult {
  loading?: boolean
  error?: string
  data?: GitHubUser
}
