import { usePostHog } from "@posthog/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyticsEvents, captureAnalyticsEvent } from "./analytics";
import {
  fetchPreviousPeriodTotal,
  fetchUserContributions,
  resolveOrgId,
} from "./fetchContributions";
import { useToast } from "./ToastContext";
import type { UserResult } from "./types";
import { useSortedUsers } from "./useSortedUsers";

interface UseContributionsParams {
  pat: string;
  org: string;
  fromDate: string;
  toDate: string;
  users: string[];
  refreshInterval: number;
  hasInitialUrlState: boolean;
}

export type FetchValidationError = "missing-pat" | "missing-users";
export type FetchTrigger = "auto-refresh" | "date-preset" | "initial-url" | "manual" | "shortcut";

export interface FetchAllOptions {
  from?: string;
  to?: string;
  trigger?: FetchTrigger;
}

export interface UseContributionsReturn {
  results: Record<string, UserResult>;
  isFetching: boolean;
  sortedUsers: string[];
  fetchAll: (options?: FetchAllOptions) => Promise<FetchValidationError | undefined>;
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
}: UseContributionsParams): UseContributionsReturn {
  const [results, setResults] = useState<Record<string, UserResult>>({});
  const [isFetching, setIsFetching] = useState(false);
  const { addToast } = useToast();
  const abortRef = useRef<AbortController | null>(null);
  const posthog = usePostHog();

  const sortedUsers = useSortedUsers(users, results);

  const fetchAll = useCallback(
    async (options?: FetchAllOptions) => {
      if (!pat) {
        addToast(
          "error",
          "No authentication configured. Sign in with GitHub or add a Personal Access Token in settings.",
        );
        return "missing-pat" as const;
      }
      if (!users.length) {
        addToast("error", "No users configured. Open settings to add usernames.");
        return "missing-users" as const;
      }

      // Abort any in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const { signal } = controller;
      const trigger = options?.trigger ?? "manual";

      const fromMs = new Date(options?.from ?? fromDate).getTime();
      const toMs = new Date(options?.to ?? toDate).getTime();
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

      // Fetch all users in parallel, then apply results in a single batch
      // so cards and badges transition from skeleton to data simultaneously
      let errorCount = 0;
      const settled = await Promise.allSettled(
        users.map(async (user) => {
          const [data, previousPeriodTotal] = await Promise.all([
            fetchUserContributions(pat, user, { orgId, from, to }, signal),
            fetchPreviousPeriodTotal(pat, user, { orgId, from: prevFrom, to: prevTo }, signal),
          ]);
          return { user, data, previousPeriodTotal };
        }),
      );

      if (signal.aborted) return;

      const batch: Record<string, UserResult> = {};
      for (let i = 0; i < users.length; i++) {
        const result = settled[i];
        if (result.status === "fulfilled") {
          const { data, previousPeriodTotal } = result.value;
          batch[users[i]] = { data, previousPeriodTotal, periodDays };
        } else {
          errorCount++;
          batch[users[i]] = { error: result.reason?.message ?? String(result.reason) };
        }
      }
      setResults((prev) => ({ ...prev, ...batch }));
      setIsFetching(false);

      // Defer toast so the card transitions settle before triggering another render
      requestAnimationFrame(() => {
        if (signal.aborted) return;
        if (errorCount > 0) {
          captureAnalyticsEvent(posthog, analyticsEvents.dashboardFetchFailed, {
            error_count: errorCount,
            has_org: Boolean(org),
            period_days: periodDays,
            success_count: users.length - errorCount,
            trigger,
            user_count: users.length,
          });
          addToast(
            "error",
            `Failed to fetch data for ${errorCount} user${errorCount > 1 ? "s" : ""}. Check the cards for details.`,
          );
        } else {
          captureAnalyticsEvent(posthog, analyticsEvents.dashboardFetchSucceeded, {
            has_org: Boolean(org),
            period_days: periodDays,
            trigger,
            user_count: users.length,
          });
          addToast(
            "success",
            `Fetched contributions for ${users.length} user${users.length > 1 ? "s" : ""}.`,
          );
        }
      });
    },
    [addToast, fromDate, org, pat, posthog, toDate, users],
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
      fetchAll({ trigger: "initial-url" });
    }
  }, []);

  // Auto-refresh on interval
  useEffect(() => {
    if (refreshInterval === 0 || !pat || !users.length) return;
    const id = setInterval(() => fetchAll({ trigger: "auto-refresh" }), refreshInterval * 1000);
    return () => clearInterval(id);
  }, [refreshInterval, pat, users, fetchAll]);

  return { results, isFetching, sortedUsers, fetchAll, fetchUser };
}
