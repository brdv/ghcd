import { useEffect, useMemo, useRef, useState } from "react";
import ContributionCard from "./components/ContributionCard";
import SettingsDrawer from "./components/SettingsDrawer";
import ToastContainer from "./components/Toast";
import Toolbar from "./components/Toolbar";
import { computeBadges } from "./lib/badges";
import { gql, QUERY_ORG, QUERY_USER } from "./lib/github";
import { DEFAULT_VISIBLE_STATS } from "./lib/stats";
import type { GitHubUser, UserResult } from "./lib/types";
import { useToasts } from "./lib/useToasts";

interface UrlState {
  users?: string[];
  org?: string;
  from?: string;
  to?: string;
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
  const [visibleStats, setVisibleStats] = useState<string[]>(DEFAULT_VISIBLE_STATS);
  const { toasts, addToast, dismissToast } = useToasts();

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

  // Sync state to URL
  useEffect(() => {
    const state: UrlState = {};
    if (users.length > 0) state.users = users;
    if (org.trim()) state.org = org.trim();
    if (fromDate !== defaultFromDate()) state.from = fromDate;
    if (toDate !== defaultToDate()) state.to = toDate;

    const url = new URL(window.location.href);
    if (Object.keys(state).length > 0) {
      url.searchParams.set("state", encodeState(state));
    } else {
      url.searchParams.delete("state");
    }
    window.history.replaceState(null, "", url.toString());
  }, [users, org, fromDate, toDate]);

  async function fetchAll(overrides?: { from?: string; to?: string }) {
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

    const from = new Date(overrides?.from ?? fromDate).toISOString();
    const to = new Date(overrides?.to ?? toDate).toISOString();
    const orgName = org.trim();

    setIsFetching(true);

    // Set all users to loading
    const initial: Record<string, UserResult> = {};
    users.forEach((u) => {
      initial[u] = { loading: true };
    });
    setResults(initial);

    // Resolve org ID
    let orgId: string | null = null;
    if (orgName) {
      try {
        const d = await gql<{ organization?: { id: string } }>(token, QUERY_ORG, { org: orgName });
        orgId = d.organization?.id ?? null;
      } catch (e) {
        addToast(
          "warning",
          `Could not resolve org "${orgName}": ${(e as Error).message}. Fetching without org filter.`,
        );
        orgId = null;
      }
    }

    // Fetch all users in parallel with progressive updates
    let errorCount = 0;
    await Promise.all(
      users.map(async (user) => {
        try {
          const d = await gql<{ user: GitHubUser }>(token, QUERY_USER, {
            user,
            orgId,
            from,
            to,
          });
          setResults((prev) => ({ ...prev, [user]: { data: d.user } }));
        } catch (e) {
          errorCount++;
          setResults((prev) => ({
            ...prev,
            [user]: { error: (e as Error).message },
          }));
        }
      }),
    );

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

    setIsFetching(false);
  }

  const badges = useMemo(() => computeBadges(results), [results]);

  // Single column on mobile, up to 3 on desktop
  const gridCols = Math.min(users.length || 1, 3);

  return (
    <div className="min-h-screen bg-gh-bg text-gh-text-primary p-4 sm:p-6 font-sans">
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

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gh-text-secondary">
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
          {users.map((u) => (
            <ContributionCard
              key={u}
              username={u}
              result={results[u] ?? {}}
              badges={badges[u] ?? []}
              visibleStats={visibleStats}
            />
          ))}
        </div>
      )}

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pat={pat}
        setPat={handleSetPat}
        org={org}
        setOrg={setOrg}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        users={users}
        setUsers={setUsers}
        visibleStats={visibleStats}
        setVisibleStats={setVisibleStats}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
