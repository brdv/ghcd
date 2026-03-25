import { useState } from "react";
import ContributionCard from "./components/ContributionCard";
import SettingsDrawer from "./components/SettingsDrawer";
import Toolbar from "./components/Toolbar";
import { gql, QUERY_ORG, QUERY_USER } from "./lib/github";
import type { GitHubUser, UserResult } from "./lib/types";

function defaultFromDate(): string {
  const year = new Date().getFullYear();
  return `${year}-01-01`;
}

function defaultToDate(): string {
  const year = new Date().getFullYear();
  return `${year}-12-31`;
}

export default function App() {
  const [pat, setPat] = useState(() => localStorage.getItem("ghcd-pat") ?? "");
  const [org, setOrg] = useState("");
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [users, setUsers] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, UserResult>>({});
  const [isFetching, setIsFetching] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSetPat(v: string) {
    setPat(v);
    localStorage.setItem("ghcd-pat", v);
  }

  async function fetchAll() {
    const token = pat.trim();
    if (!token || !users.length) return;

    const from = new Date(fromDate).toISOString();
    const to = new Date(toDate).toISOString();
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
        const d = await gql<{ organization?: { id: string } }>(
          token,
          QUERY_ORG,
          { org: orgName },
        );
        orgId = d.organization?.id ?? null;
      } catch {
        orgId = null;
      }
    }

    // Fetch all users in parallel with progressive updates
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
          setResults((prev) => ({
            ...prev,
            [user]: { error: (e as Error).message },
          }));
        }
      }),
    );

    setIsFetching(false);
  }

  const gridCols = Math.min(users.length || 1, 3);

  return (
    <div className="min-h-screen bg-gh-bg text-gh-text-primary p-6 font-sans">
      <Toolbar
        org={org}
        setOrg={setOrg}
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
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {users.map((u) => (
            <ContributionCard
              key={u}
              username={u}
              result={results[u] ?? {}}
            />
          ))}
        </div>
      )}

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pat={pat}
        setPat={handleSetPat}
        users={users}
        setUsers={setUsers}
      />
    </div>
  );
}
