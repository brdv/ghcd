export const QUERY_ORG = `query($org:String!){organization(login:$org){id name}}`;

export const QUERY_USER = `query($user:String!,$orgId:ID,$from:DateTime!,$to:DateTime!){
  user(login:$user){
    avatarUrl bio company location websiteUrl createdAt
    followers{totalCount} following{totalCount}
    repositories(first:20,ownerAffiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER],orderBy:{field:PUSHED_AT,direction:DESC}){
      nodes{languages(first:5,orderBy:{field:SIZE,direction:DESC}){edges{size node{name color}}}}
    }
    contributionsCollection(organizationID:$orgId,from:$from,to:$to){
      totalCommitContributions totalPullRequestContributions totalPullRequestReviewContributions
      totalIssueContributions totalRepositoryContributions
      commitContributionsByRepository(maxRepositories:5){repository{name nameWithOwner url} contributions{totalCount}}
      contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}
    }
  }
}`;

const QUERY_ORG_MEMBERS = `query($org:String!,$cursor:String){
  organization(login:$org){
    membersWithRole(first:100,after:$cursor){
      pageInfo{hasNextPage endCursor}
      nodes{login}
    }
  }
}`;

export const QUERY_USER_TOTAL = `query($user:String!,$orgId:ID,$from:DateTime!,$to:DateTime!){
  user(login:$user){
    contributionsCollection(organizationID:$orgId,from:$from,to:$to){
      contributionCalendar{totalContributions}
    }
  }
}`;

export async function gql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join(", "));
  }
  return json.data as T;
}

interface OrgMembersResponse {
  organization: {
    membersWithRole: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: { login: string }[];
    };
  };
}

export async function fetchOrgMembers(token: string, org: string): Promise<string[]> {
  const members: string[] = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data: OrgMembersResponse = await gql(token, QUERY_ORG_MEMBERS, { org, cursor });
    for (const node of data.organization.membersWithRole.nodes) {
      members.push(node.login.toLowerCase());
    }
    const pageInfo: OrgMembersResponse["organization"]["membersWithRole"]["pageInfo"] =
      data.organization.membersWithRole.pageInfo;
    hasNext = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  return members;
}
