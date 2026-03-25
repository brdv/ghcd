export const QUERY_ORG = `query($org:String!){organization(login:$org){id name}}`;

export const QUERY_USER = `query($user:String!,$orgId:ID,$from:DateTime!,$to:DateTime!){
  user(login:$user){avatarUrl contributionsCollection(organizationID:$orgId,from:$from,to:$to){
    totalCommitContributions totalPullRequestContributions totalPullRequestReviewContributions
    totalIssueContributions totalRepositoryContributions
    commitContributionsByRepository{repository{nameWithOwner}}
    contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel weekday}}}
  }}
}`;

export async function gql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
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
