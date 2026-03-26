import { useCallback, useEffect, useState } from "react";
import { DEFAULT_VISIBLE_STATS } from "./stats";
import { useLocalStorage } from "./useLocalStorage";

interface UrlState {
  users?: string[];
  org?: string;
  from?: string;
  to?: string;
  stats?: string[];
}

const DEFAULT_FROM_DATE = `${new Date().getFullYear()}-01-01`;
const DEFAULT_TO_DATE = `${new Date().getFullYear()}-12-31`;

function encodeState(state: UrlState): string {
  return btoa(JSON.stringify(state));
}

function decodeState(encoded: string): UrlState | null {
  try {
    const raw = JSON.parse(atob(encoded));
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
    const state: UrlState = {};
    if (Array.isArray(raw.users) && raw.users.every((u: unknown) => typeof u === "string")) {
      state.users = raw.users;
    }
    if (typeof raw.org === "string") state.org = raw.org;
    if (typeof raw.from === "string") state.from = raw.from;
    if (typeof raw.to === "string") state.to = raw.to;
    if (Array.isArray(raw.stats) && raw.stats.every((s: unknown) => typeof s === "string")) {
      state.stats = raw.stats;
    }
    return Object.keys(state).length > 0 ? state : null;
  } catch {
    return null;
  }
}

function readStateFromUrl(): UrlState | null {
  const params = new URLSearchParams(window.location.search);
  const s = params.get("state");
  return s ? decodeState(s) : null;
}

export interface UseSettingsReturn {
  pat: string;
  org: string;
  fromDate: string;
  toDate: string;
  users: string[];
  visibleStats: string[];
  refreshInterval: number;
  setPat: (v: string) => void;
  setOrg: (v: string) => void;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  setUsers: (v: string[]) => void;
  setVisibleStats: (v: string[]) => void;
  setRefreshInterval: (v: number) => void;
  hasInitialUrlState: boolean;
}

export function useSettings(): UseSettingsReturn {
  const [initial] = useState(() => readStateFromUrl());

  const [rawPat, setRawPat] = useState(() => localStorage.getItem("ghcd-pat") ?? "");
  const [rawOrg, setRawOrg] = useState(() => initial?.org ?? "");
  const [fromDate, setFromDate] = useState(() => initial?.from ?? DEFAULT_FROM_DATE);
  const [toDate, setToDate] = useState(() => initial?.to ?? DEFAULT_TO_DATE);
  const [users, setUsers] = useState<string[]>(() => initial?.users ?? []);
  const [visibleStats, setVisibleStats] = useState<string[]>(
    () => initial?.stats ?? DEFAULT_VISIBLE_STATS,
  );
  const [refreshInterval, setRefreshInterval] = useLocalStorage("ghcd-refresh-interval", 0);

  const pat = rawPat.trim();
  const org = rawOrg.trim();

  const setPat = useCallback((v: string) => {
    setRawPat(v);
    localStorage.setItem("ghcd-pat", v);
  }, []);

  // Sync state to URL
  useEffect(() => {
    const state: UrlState = {};
    if (users.length > 0) state.users = users;
    if (org) state.org = org;
    if (fromDate !== DEFAULT_FROM_DATE) state.from = fromDate;
    if (toDate !== DEFAULT_TO_DATE) state.to = toDate;
    const defaultSet = new Set(DEFAULT_VISIBLE_STATS);
    if (visibleStats.length !== defaultSet.size || visibleStats.some((s) => !defaultSet.has(s))) {
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

  return {
    pat,
    org,
    fromDate,
    toDate,
    users,
    visibleStats,
    refreshInterval,
    setPat,
    setOrg: setRawOrg,
    setFromDate,
    setToDate,
    setUsers,
    setVisibleStats,
    setRefreshInterval,
    hasInitialUrlState: initial !== null,
  };
}
