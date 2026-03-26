import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchPreviousPeriodTotal,
  fetchUserContributions,
  resolveOrgId,
} from "./fetchContributions";
import { useToast } from "./ToastContext";
import type { UserResult } from "./types";

interface UseContributionsParams {
  pat: string;
  org: string;
  fromDate: string;
  toDate: string;
  users: string[];
  refreshInterval: number;
  hasInitialUrlState: boolean;
  openDrawer: () => void;
}

export interface UseContributionsReturn {
  results: Record<string, UserResult>;
  isFetching: boolean;
  sortedUsers: string[];
  fetchAll: (overrides?: { from?: string; to?: string }) => Promise<void>;
  fetchUser: (username: string) => Promise<void>;
}

export function useContributions({
  pat,
  org,
  fromDate,
  toDate,
  users,
  refreshInterval,
  hasInitialUrlState,
  openDrawer,
}: UseContributionsParams): UseContributionsReturn {
  const [results, setResults] = useState<Record<string, UserResult>>({});
  const [isFetching, setIsFetching] = useState(false);
  const { addToast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

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
    return [...users].sort((a, b) => {
      const totalA =
        results[a]?.data?.contributionsCollection.contributionCalendar.totalContributions ?? 0;
      const totalB =
        results[b]?.data?.contributionsCollection.contributionCalendar.totalContributions ?? 0;
      return totalB - totalA;
    });
  }, [users, results, allLoaded]);

  useEffect(() => {
    if (allLoaded) {
      localStorage.setItem("ghcd-sort-order", JSON.stringify(sortedUsers));
    }
  }, [allLoaded, sortedUsers]);

  const fetchAll = useCallback(
    async (overrides?: { from?: string; to?: string }) => {
      if (!pat) {
        addToast("error", "No Personal Access Token set. Open settings to add one.");
        openDrawer();
        return;
      }
      if (!users.length) {
        addToast("error", "No users configured. Open settings to add usernames.");
        openDrawer();
        return;
      }

      // Abort any in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;

      const fromMs = new Date(overrides?.from ?? fromDate).getTime();
      const toMs = new Date(overrides?.to ?? toDate).getTime();
      const from = new Date(fromMs).toISOString();
      const to = new Date(toMs).toISOString();

      // Previous period: equally-sized window ending where the current one starts
      const periodMs = toMs - fromMs;
      const periodDays = Math.round(periodMs / 86_400_000);
      const prevFrom = new Date(fromMs - periodMs).toISOString();
      const prevTo = new Date(fromMs).toISOString();

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
      if (org) {
        orgId = await resolveOrgId(pat, org, signal);
        if (signal.aborted) return;
        if (!orgId) {
          addToast("warning", `Could not resolve org "${org}". Fetching without org filter.`);
        }
      }

      // Fetch all users in parallel with progressive updates
      let errorCount = 0;
      await Promise.all(
        users.map(async (user) => {
          try {
            const [data, previousPeriodTotal] = await Promise.all([
              fetchUserContributions(pat, user, { orgId, from, to }, signal),
              fetchPreviousPeriodTotal(pat, user, { orgId, from: prevFrom, to: prevTo }, signal),
            ]);
            if (signal.aborted) return;
            setResults((r) => ({
              ...r,
              [user]: { data, previousPeriodTotal, periodDays },
            }));
          } catch (e) {
            if (signal.aborted) return;
            errorCount++;
            setResults((prev) => ({
              ...prev,
              [user]: { error: (e as Error).message },
            }));
          }
        }),
      );

      if (signal.aborted) return;
      setIsFetching(false);

      // Defer toast so the card transitions settle before triggering another render
      requestAnimationFrame(() => {
        if (signal.aborted) return;
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
    [addToast, fromDate, org, pat, toDate, users, openDrawer],
  );

  const fetchUser = useCallback(
    async (username: string) => {
      if (!pat) return;

      const from = new Date(fromDate).toISOString();
      const to = new Date(toDate).toISOString();

      setResults((prev) => ({ ...prev, [username]: { ...prev[username], loading: true } }));

      const orgId = org ? await resolveOrgId(pat, org) : null;

      try {
        const data = await fetchUserContributions(pat, username, { orgId, from, to });
        setResults((prev) => ({ ...prev, [username]: { data } }));
      } catch (e) {
        setResults((prev) => ({
          ...prev,
          [username]: { error: (e as Error).message },
        }));
      }
    },
    [pat, org, fromDate, toDate],
  );

  // Auto-fetch when page loads with state in URL (fire-once)
  const hasAutoFetched = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional fire-once on mount
  useEffect(() => {
    if (!hasAutoFetched.current && hasInitialUrlState) {
      hasAutoFetched.current = true;
      fetchAll();
    }
  }, []);

  // Auto-refresh on interval
  useEffect(() => {
    if (refreshInterval === 0 || !pat || !users.length) return;
    const id = setInterval(() => fetchAll(), refreshInterval * 1000);
    return () => clearInterval(id);
  }, [refreshInterval, pat, users, fetchAll]);

  return { results, isFetching, sortedUsers, fetchAll, fetchUser };
}
