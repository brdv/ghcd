import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContributionCard from "./components/ContributionCard";
import SettingsDrawer from "./components/SettingsDrawer";

import Toolbar from "./components/Toolbar";
import UserDetailModal from "./components/UserDetailModal";
import { computeBadges } from "./lib/badges";
import { getDatePresets } from "./lib/datePresets";
import {
  fetchPreviousPeriodTotal,
  fetchUserContributions,
  resolveOrgId,
} from "./lib/fetchContributions";
import { DEFAULT_VISIBLE_STATS } from "./lib/stats";
import { useToast } from "./lib/ToastContext";
import type { GitHubUser, UserResult } from "./lib/types";

interface UrlState {
  users?: string[];
  org?: string;
  from?: string;
  to?: string;
  stats?: string[];
}

function encodeState(state: UrlState): string {
  return btoa(JSON.stringify(state));
}

function decodeState(encoded: string): UrlState | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

function readStateFromUrl(): UrlState | null {
  const params = new URLSearchParams(window.location.search);
  const s = params.get("state");
  return s ? decodeState(s) : null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function defaultFromDate(): string {
  const year = new Date().getFullYear();
  return `${year}-01-01`;
}

function defaultToDate(): string {
  const year = new Date().getFullYear();
  return `${year}-12-31`;
}

export default function App() {
  const initial = readStateFromUrl();

  const [pat, setPat] = useState(() => localStorage.getItem("ghcd-pat") ?? "");
  const [org, setOrg] = useState(initial?.org ?? "");
  const [fromDate, setFromDate] = useState(initial?.from ?? defaultFromDate);
  const [toDate, setToDate] = useState(initial?.to ?? defaultToDate);
  const [users, setUsers] = useState<string[]>(initial?.users ?? []);
  const [results, setResults] = useState<Record<string, UserResult>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleStats, setVisibleStats] = useState<string[]>(
    initial?.stats ?? DEFAULT_VISIBLE_STATS,
  );
  const [refreshInterval, setRefreshInterval] = useState(
    () => Number(localStorage.getItem("ghcd-refresh-interval")) || 0,
  );
  const [selectedUser, setSelectedUser] = useState<{
    username: string;
    rect: DOMRect;
  } | null>(null);
  const { addToast } = useToast();

  const allLoaded = users.length > 0 && users.every((u) => results[u]?.data || results[u]?.error);
  const sortedUsers = useMemo(() => {
    if (!allLoaded) {
      const saved: string[] = JSON.parse(localStorage.getItem("ghcd-sort-order") ?? "[]");
      if (saved.length > 0) {
        const savedSet = new Set(saved);
        const known = saved.filter((u) => users.includes(u));
        const rest = users.filter((u) => !savedSet.has(u));
        return [...known, ...rest];
      }
      return users;
    }
    const sorted = [...users].sort((a, b) => {
      const totalA =
        results[a]?.data?.contributionsCollection.contributionCalendar.totalContributions ?? 0;
      const totalB =
        results[b]?.data?.contributionsCollection.contributionCalendar.totalContributions ?? 0;
      return totalB - totalA;
    });
    localStorage.setItem("ghcd-sort-order", JSON.stringify(sorted));
    return sorted;
  }, [users, results, allLoaded]);

  function handleSetPat(v: string) {
    setPat(v);
    localStorage.setItem("ghcd-pat", v);
  }

  // Auto-fetch when page loads with state in URL (fire-once, deps intentionally empty)
  const hasAutoFetched = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional fire-once on mount
  useEffect(() => {
    if (!hasAutoFetched.current && initial) {
      hasAutoFetched.current = true;
      fetchAll();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        fetchAll();
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setDrawerOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const fetchAll = useCallback(
    async (overrides?: { from?: string; to?: string }) => {
      const token = pat.trim();
      if (!token) {
        addToast("error", "No Personal Access Token set. Open settings to add one.");
        setDrawerOpen(true);
        return;
      }
      if (!users.length) {
        addToast("error", "No users configured. Open settings to add usernames.");
        setDrawerOpen(true);
        return;
      }

      const fromMs = new Date(overrides?.from ?? fromDate).getTime();
      const toMs = new Date(overrides?.to ?? toDate).getTime();
      const from = new Date(fromMs).toISOString();
      const to = new Date(toMs).toISOString();

      // Previous period: equally-sized window ending where the current one starts
      const periodMs = toMs - fromMs;
      const periodDays = Math.round(periodMs / 86_400_000);
      const prevFrom = new Date(fromMs - periodMs).toISOString();
      const prevTo = new Date(fromMs).toISOString();

      const orgName = org.trim();

      setIsFetching(true);

      // Set all users to loading, preserving previous data so cards don't flash
      setResults((prev) => {
        const next: Record<string, UserResult> = {};
        for (const u of users) {
          next[u] = { ...prev[u], loading: true };
        }
        return next;
      });

      // Resolve org ID
      let orgId: string | null = null;
      if (orgName) {
        orgId = await resolveOrgId(token, orgName);
        if (!orgId) {
          addToast("warning", `Could not resolve org "${orgName}". Fetching without org filter.`);
        }
      }

      // Fetch all users in parallel with progressive updates
      let errorCount = 0;
      await Promise.all(
        users.map(async (user) => {
          try {
            const [data, previousPeriodTotal] = await Promise.all([
              fetchUserContributions(token, user, { orgId, from, to }),
              fetchPreviousPeriodTotal(token, user, { orgId, from: prevFrom, to: prevTo }),
            ]);
            setResults((r) => ({
              ...r,
              [user]: { data, previousPeriodTotal, periodDays },
            }));
          } catch (e) {
            errorCount++;
            setResults((prev) => ({
              ...prev,
              [user]: { error: (e as Error).message },
            }));
          }
        }),
      );

      setIsFetching(false);

      // Defer toast so the card transitions settle before triggering another render
      requestAnimationFrame(() => {
        if (errorCount > 0) {
          addToast(
            "error",
            `Failed to fetch data for ${errorCount} user${errorCount > 1 ? "s" : ""}. Check the cards for details.`,
          );
        } else {
          addToast(
            "success",
            `Fetched contributions for ${users.length} user${users.length > 1 ? "s" : ""}.`,
          );
        }
      });
    },
    [addToast, fromDate, org.trim, pat.trim, toDate, users],
  );

  // Auto-refresh on interval
  useEffect(() => {
    if (refreshInterval === 0 || !pat.trim() || !users.length) return;
    const id = setInterval(() => fetchAll(), refreshInterval * 1000);
    return () => clearInterval(id);
  }, [refreshInterval, pat, users, fetchAll]);

  function handleSetRefreshInterval(v: number) {
    setRefreshInterval(v);
    localStorage.setItem("ghcd-refresh-interval", String(v));
  }

  // Sync state to URL
  useEffect(() => {
    const state: UrlState = {};
    if (users.length > 0) state.users = users;
    if (org.trim()) state.org = org.trim();
    if (fromDate !== defaultFromDate()) state.from = fromDate;
    if (toDate !== defaultToDate()) state.to = toDate;
    if (
      visibleStats.length !== DEFAULT_VISIBLE_STATS.length ||
      visibleStats.some((s, i) => s !== DEFAULT_VISIBLE_STATS[i])
    ) {
      state.stats = visibleStats;
    }

    const url = new URL(window.location.href);
    if (Object.keys(state).length > 0) {
      url.searchParams.set("state", encodeState(state));
    } else {
      url.searchParams.delete("state");
    }
    window.history.replaceState(null, "", url.toString());
  }, [users, org, fromDate, toDate, visibleStats]);

  async function fetchUser(username: string) {
    const token = pat.trim();
    if (!token) return;

    const from = new Date(fromDate).toISOString();
    const to = new Date(toDate).toISOString();

    setResults((prev) => ({ ...prev, [username]: { loading: true } }));

    const orgId = org.trim() ? await resolveOrgId(token, org.trim()) : null;

    try {
      const data = await fetchUserContributions(token, username, { orgId, from, to });
      setResults((prev) => ({ ...prev, [username]: { data } }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [username]: { error: (e as Error).message },
      }));
    }
  }

  const badges = useMemo(() => computeBadges(results), [results]);

  // Single column on mobile, up to 3 on desktop
  const gridCols = Math.min(users.length || 1, 3);

  return (
    <main className="min-h-screen bg-gh-bg text-gh-text-primary p-4 sm:p-6 font-sans flex flex-col">
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-gh-accent focus:text-white focus:rounded-lg focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Toolbar
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        onFetch={fetchAll}
        isFetching={isFetching}
        userCount={users.length}
        onOpenSettings={() => setDrawerOpen(true)}
      />

      <div id="dashboard">
        {users.length > 0 && (
          <p className="text-gh-text-secondary text-sm mb-4">
            Comparing{" "}
            <span className="text-gh-text-primary font-medium">
              {users.length} {users.length === 1 ? "user" : "users"}
            </span>
            {org.trim() && (
              <>
                {" "}
                in <span className="text-gh-text-primary font-medium">{org.trim()}</span>
              </>
            )}{" "}
            for{" "}
            <span className="text-gh-text-primary font-medium">
              {getDatePresets()
                .find((p) => p.from === fromDate && p.to === toDate)
                ?.label.toLowerCase() ?? `${formatDate(fromDate)} \u2013 ${formatDate(toDate)}`}
            </span>
          </p>
        )}

        {users.length === 0 ? (
          <div
            role="status"
            className="flex flex-col items-center justify-center py-24 text-gh-text-secondary"
          >
            <p className="text-base mb-2">No users configured</p>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="text-gh-accent hover:text-gh-accent-hover cursor-pointer bg-transparent border-none text-sm font-medium"
            >
              Open settings to add users
            </button>
          </div>
        ) : (
          <div
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={gridCols < 3 ? { maxWidth: gridCols === 1 ? "100%" : undefined } : undefined}
          >
            {sortedUsers.map((u) => (
              <ContributionCard
                key={u}
                username={u}
                result={results[u] ?? {}}
                badges={badges[u] ?? []}
                visibleStats={visibleStats}
                onSelect={(rect) => setSelectedUser({ username: u, rect })}
              />
            ))}
          </div>
        )}
      </div>

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pat={pat.trim()}
        setPat={handleSetPat}
        org={org.trim()}
        setOrg={setOrg}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        users={users}
        setUsers={setUsers}
        onUserAdded={fetchUser}
        visibleStats={visibleStats}
        setVisibleStats={setVisibleStats}
        refreshInterval={refreshInterval}
        setRefreshInterval={handleSetRefreshInterval}
      />

      {selectedUser && results[selectedUser.username]?.data && (
        <UserDetailModal
          username={selectedUser.username}
          data={results[selectedUser.username].data as GitHubUser}
          sourceRect={selectedUser.rect}
          previousPeriodTotal={results[selectedUser.username].previousPeriodTotal}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <footer className="mt-auto pt-12 py-6 text-center text-xs text-gh-text-secondary border-t border-gh-border">
        <a
          href="https://github.com/brdv/ghcd"
          target="_blank"
          rel="noreferrer"
          aria-label="GHCD project on GitHub"
          className="text-gh-accent hover:text-gh-accent-hover"
        >
          GHCD
        </a>{" "}
        — Created with{" "}
        <span role="img" aria-label="love">
          ❤️
        </span>{" "}
        by{" "}
        <a
          href="https://github.com/brdv"
          target="_blank"
          rel="noreferrer"
          aria-label="brdv on GitHub"
          className="text-gh-accent hover:text-gh-accent-hover"
        >
          brdv
        </a>
        {" & "}
        <a
          href="https://github.com/mathijsr94"
          target="_blank"
          rel="noreferrer"
          aria-label="mathijsr94 on GitHub"
          className="text-gh-accent hover:text-gh-accent-hover"
        >
          mathijsr94
        </a>
      </footer>
    </main>
  );
}
