export interface RestUserProfile {
  login: string;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  created_at: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
}

export async function fetchUserRest(
  username: string,
  token?: string,
  signal?: AbortSignal,
): Promise<RestUserProfile> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers,
    signal,
  });
  if (res.status === 404) {
    throw new Error(`User "${username}" not found`);
  }
  if (res.status === 403) {
    throw new Error("Rate limited. Sign in for higher limits.");
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

export interface GitHubEvent {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    size?: number;
    action?: string;
    ref_type?: string;
  };
}

export async function fetchPublicEvents(
  username: string,
  token?: string,
  signal?: AbortSignal,
): Promise<GitHubEvent[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const allEvents: GitHubEvent[] = [];
  // Fetch up to 3 pages (300 events max — GitHub's hard limit)
  for (let page = 1; page <= 3; page++) {
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}`,
      { headers, signal },
    );
    if (!res.ok) break;
    const events: GitHubEvent[] = await res.json();
    if (events.length === 0) break;
    allEvents.push(...events);
    if (events.length < 100) break;
  }
  return allEvents;
}
