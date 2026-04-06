import { usePostHog } from "@posthog/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { analyticsEvents, captureAnalyticsEvent } from "./analytics";
import {
  fetchPreviousPeriodTotal,
  fetchUserContributions,
  resolveOrgId,
} from "./fetchContributionsGraphQL";
import { fetchUserPublic } from "./fetchContributionsPublic";
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

export type FetchValidationError = "missing-users";
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
      interface FetchContext {
        users: string[];
        from: string;
        to: string;
        periodDays: number;
        prevFrom: string;
        prevTo: string;
        signal: AbortSignal;
        trigger: FetchTrigger;
      }

      async function fetchAllUnauthenticated(ctx: FetchContext) {
        let errorCount = 0;
        await Promise.all(
          ctx.users.map(async (user) => {
            try {
              const data = await fetchUserPublic(user, { from: ctx.from, to: ctx.to }, ctx.signal);
              if (ctx.signal.aborted) return;
              setResults((r) => ({
                ...r,
                [user]: { data, needsAuth: true, periodDays: ctx.periodDays },
              }));
            } catch (e) {
              if (ctx.signal.aborted) return;
              errorCount++;
              setResults((prev) => ({
                ...prev,
                [user]: { error: (e as Error).message },
              }));
            }
          }),
        );

        if (ctx.signal.aborted) return;
        setIsFetching(false);

        requestAnimationFrame(() => {
          if (ctx.signal.aborted) return;
          if (errorCount > 0) {
            captureAnalyticsEvent(posthog, analyticsEvents.dashboardFetchFailed, {
              authenticated: false,
              error_count: errorCount,
              period_days: ctx.periodDays,
              success_count: ctx.users.length - errorCount,
              trigger: ctx.trigger,
              user_count: ctx.users.length,
            });
            addToast(
              "error",
              `Failed to fetch data for ${errorCount} user${errorCount > 1 ? "s" : ""}. Check the cards for details.`,
            );
          } else {
            captureAnalyticsEvent(posthog, analyticsEvents.dashboardFetchSucceeded, {
              authenticated: false,
              period_days: ctx.periodDays,
              trigger: ctx.trigger,
              user_count: ctx.users.length,
            });
            addToast(
              "success",
              `Showing public activity for ${ctx.users.length} user${ctx.users.length > 1 ? "s" : ""}. Sign in for full data.`,
            );
          }
        });
      }

      async function fetchAllAuthenticated(ctx: FetchContext) {
        // Resolve org ID
        let orgId: string | null = null;
        if (org) {
          orgId = await resolveOrgId(pat, org, ctx.signal);
          if (ctx.signal.aborted) return;
          if (!orgId) {
            addToast("warning", `Could not resolve org "${org}". Fetching without org filter.`);
          }
        }

        // Fetch all users in parallel, then apply results in a single batch
        // so cards and badges transition from skeleton to data simultaneously
        let errorCount = 0;
        const settled = await Promise.allSettled(
          ctx.users.map(async (user) => {
            const [data, previousPeriodTotal] = await Promise.all([
              fetchUserContributions(pat, user, { orgId, from: ctx.from, to: ctx.to }, ctx.signal),
              fetchPreviousPeriodTotal(
                pat,
                user,
                { orgId, from: ctx.prevFrom, to: ctx.prevTo },
                ctx.signal,
              ),
            ]);
            return { user, data, previousPeriodTotal };
          }),
        );

        if (ctx.signal.aborted) return;

        const batch: Record<string, UserResult> = {};
        for (let i = 0; i < ctx.users.length; i++) {
          const result = settled[i];
          if (result.status === "fulfilled") {
            const { data, previousPeriodTotal } = result.value;
            batch[ctx.users[i]] = { data, previousPeriodTotal, periodDays: ctx.periodDays };
          } else {
            errorCount++;
            batch[ctx.users[i]] = { error: result.reason?.message ?? String(result.reason) };
          }
        }
        setResults((prev) => ({ ...prev, ...batch }));
        setIsFetching(false);

        // Defer toast so the card transitions settle before triggering another render
        requestAnimationFrame(() => {
          if (ctx.signal.aborted) return;
          if (errorCount > 0) {
            captureAnalyticsEvent(posthog, analyticsEvents.dashboardFetchFailed, {
              authenticated: true,
              error_count: errorCount,
              has_org: Boolean(org),
              period_days: ctx.periodDays,
              success_count: ctx.users.length - errorCount,
              trigger: ctx.trigger,
              user_count: ctx.users.length,
            });
            addToast(
              "error",
              `Failed to fetch data for ${errorCount} user${errorCount > 1 ? "s" : ""}. Check the cards for details.`,
            );
          } else {
            captureAnalyticsEvent(posthog, analyticsEvents.dashboardFetchSucceeded, {
              authenticated: true,
              has_org: Boolean(org),
              period_days: ctx.periodDays,
              trigger: ctx.trigger,
              user_count: ctx.users.length,
            });
            addToast(
              "success",
              `Fetched contributions for ${ctx.users.length} user${ctx.users.length > 1 ? "s" : ""}.`,
            );
          }
        });
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

      const ctx: FetchContext = {
        users,
        from,
        to,
        periodDays,
        prevFrom,
        prevTo,
        signal,
        trigger,
      };

      if (pat) {
        await fetchAllAuthenticated(ctx);
      } else {
        await fetchAllUnauthenticated(ctx);
      }
    },
    [addToast, fromDate, org, pat, posthog, toDate, users],
  );

  const fetchUser = useCallback(
    async (username: string) => {
      setResults((prev) => ({ ...prev, [username]: { ...prev[username], loading: true } }));

      if (!pat) {
        // Unauthenticated: fetch public profile + events via REST
        try {
          const from = new Date(fromDate).toISOString();
          const to = new Date(toDate).toISOString();
          const data = await fetchUserPublic(username, { from, to });
          setResults((prev) => ({ ...prev, [username]: { data, needsAuth: true } }));
        } catch (e) {
          setResults((prev) => ({
            ...prev,
            [username]: { error: (e as Error).message },
          }));
        }
        return;
      }

      const from = new Date(fromDate).toISOString();
      const to = new Date(toDate).toISOString();

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
