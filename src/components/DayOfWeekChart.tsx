import type { ContributionWeek } from "../lib/types";

// Monday-first order: map GitHub weekday (0=Sun) to display index
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayOfWeekChartProps {
  weeks: ContributionWeek[];
}

export default function DayOfWeekChart({ weeks }: DayOfWeekChartProps) {
  // Sum contributions per day of week (0=Sun, 6=Sat)
  const totals = [0, 0, 0, 0, 0, 0, 0];
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      totals[day.weekday] += day.contributionCount;
    }
  }

  const max = Math.max(...totals, 1);

  return (
    <div className="flex items-end gap-1 justify-between mb-3 px-1">
      {DISPLAY_ORDER.map((i) => (
        <div key={DAY_LABELS[i]} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] text-gh-text-secondary font-medium">{totals[i]}</span>
          <div
            className="w-full rounded-sm bg-gh-badge overflow-hidden flex flex-col justify-end"
            style={{ height: 32 }}
          >
            <div
              className="w-full rounded-sm transition-all duration-300"
              style={{
                height: `${(totals[i] / max) * 100}%`,
                background:
                  totals[i] === max
                    ? "var(--contrib-q4)"
                    : totals[i] > max * 0.5
                      ? "var(--contrib-q3)"
                      : totals[i] > 0
                        ? "var(--contrib-q2)"
                        : "transparent",
              }}
            />
          </div>
          <span className="text-[9px] text-gh-text-secondary">{DAY_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}
