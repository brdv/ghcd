import { useEffect, useMemo } from "react";
import type { UserResult } from "./types";
import { useLocalStorage } from "./useLocalStorage";

export function useSortedUsers(users: string[], results: Record<string, UserResult>): string[] {
  const allLoaded = users.length > 0 && users.every((u) => results[u]?.data || results[u]?.error);
  const [savedOrder, setSavedOrder] = useLocalStorage<string[]>("ghcd-sort-order", []);

  const sortedUsers = useMemo(() => {
    if (!allLoaded) {
      if (savedOrder.length > 0) {
        const savedSet = new Set(savedOrder);
        const known = savedOrder.filter((u) => users.includes(u));
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
  }, [users, results, allLoaded, savedOrder]);

  useEffect(() => {
    if (allLoaded) {
      setSavedOrder(sortedUsers);
    }
  }, [allLoaded, sortedUsers, setSavedOrder]);

  return sortedUsers;
}
