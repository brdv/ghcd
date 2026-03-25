import { gql, QUERY_ORG, QUERY_USER } from "./github";
import type { GitHubUser } from "./types";

export async function resolveOrgId(token: string, orgName: string): Promise<string | null> {
  try {
    const d = await gql<{ organization?: { id: string } }>(token, QUERY_ORG, { org: orgName });
    return d.organization?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchUserContributions(
  token: string,
  username: string,
  opts: { orgId: string | null; from: string; to: string },
): Promise<GitHubUser> {
  const d = await gql<{ user: GitHubUser }>(token, QUERY_USER, {
    user: username,
    orgId: opts.orgId,
    from: opts.from,
    to: opts.to,
  });
  return d.user;
}
