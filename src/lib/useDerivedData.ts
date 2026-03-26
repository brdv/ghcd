import { useMemo } from "react";
import type { Badge } from "./badges";
import { computeBadges } from "./badges";
import { getDatePresets } from "./datePresets";
import type { UserResult } from "./types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface UseDerivedDataParams {
  results: Record<string, UserResult>;
  fromDate: string;
  toDate: string;
  users: string[];
}

interface UseDerivedDataReturn {
  badges: Record<string, Badge[]>;
  dateLabel: string;
  gridCols: number;
}

export function useDerivedData({
  results,
  fromDate,
  toDate,
  users,
}: UseDerivedDataParams): UseDerivedDataReturn {
  const badges = useMemo(() => computeBadges(results), [results]);

  const dateLabel = useMemo(() => {
    const preset = getDatePresets().find((p) => p.from === fromDate && p.to === toDate);
    return preset?.label.toLowerCase() ?? `${formatDate(fromDate)} \u2013 ${formatDate(toDate)}`;
  }, [fromDate, toDate]);

  const gridCols = Math.min(users.length || 1, 3);

  return { badges, dateLabel, gridCols };
}
