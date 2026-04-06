import { gql, QUERY_ORG, QUERY_USER, QUERY_USER_TOTAL } from "./githubGraphQL";
import type { GitHubUser } from "./types";

export async function resolveOrgId(
  token: string,
  orgName: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const d = await gql<{ organization?: { id: string } }>(
      token,
      QUERY_ORG,
      { org: orgName },
      signal,
    );
    return d.organization?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchUserContributions(
  token: string,
  username: string,
  opts: { orgId: string | null; from: string; to: string },
  signal?: AbortSignal,
): Promise<GitHubUser> {
  const d = await gql<{ user: GitHubUser | null }>(
    token,
    QUERY_USER,
    {
      user: username,
      orgId: opts.orgId,
      from: opts.from,
      to: opts.to,
    },
    signal,
  );
  if (!d.user) {
    throw new Error(`User "${username}" not found`);
  }
  return d.user;
}

export async function fetchPreviousPeriodTotal(
  token: string,
  username: string,
  opts: { orgId: string | null; from: string; to: string },
  signal?: AbortSignal,
): Promise<number | undefined> {
  try {
    const d = await gql<{
      user: {
        contributionsCollection: {
          contributionCalendar: { totalContributions: number };
        };
      } | null;
    }>(
      token,
      QUERY_USER_TOTAL,
      {
        user: username,
        orgId: opts.orgId,
        from: opts.from,
        to: opts.to,
      },
      signal,
    );
    return d.user?.contributionsCollection.contributionCalendar.totalContributions;
  } catch {
    return undefined;
  }
}
