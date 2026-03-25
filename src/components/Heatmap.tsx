import type { ContributionLevel, ContributionWeek } from "../lib/types";

const CELL_SIZE = 13;
const GAP = 3;
const LABEL_WIDTH = 28;

const LEVEL_COLORS: Record<ContributionLevel, string> = {
  NONE: "var(--contrib-none)",
  FIRST_QUARTILE: "var(--contrib-q1)",
  SECOND_QUARTILE: "var(--contrib-q2)",
  THIRD_QUARTILE: "var(--contrib-q3)",
  FOURTH_QUARTILE: "var(--contrib-q4)",
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface HeatmapProps {
  weeks: ContributionWeek[];
}

export default function Heatmap({ weeks }: HeatmapProps) {
  const width = LABEL_WIDTH + weeks.length * (CELL_SIZE + GAP);
  const height = 7 * (CELL_SIZE + GAP) + 20;

  // Pre-compute month labels with their x positions
  const monthLabels: { month: string; x: number; key: string }[] = [];
  let lastMonth = "";
  for (let wi = 0; wi < weeks.length; wi++) {
    const date = weeks[wi].contributionDays[0].date;
    const month = new Date(date).toLocaleString("en", { month: "short" });
    if (month !== lastMonth) {
      lastMonth = month;
      monthLabels.push({
        month,
        x: LABEL_WIDTH + wi * (CELL_SIZE + GAP),
        key: `month-${date}`,
      });
    }
  }

  return (
    <div className="overflow-x-auto mb-3.5 bg-gh-badge rounded-lg p-3">
      <svg
        width={width}
        className="max-w-full"
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Contribution heatmap"
      >
        {/* Month labels */}
        {monthLabels.map((m) => (
          <text key={m.key} x={m.x} y={10} fontSize={10} fill="var(--text-secondary)">
            {m.month}
          </text>
        ))}

        {/* Day labels */}
        {DAY_LABELS.map(
          (label, i) =>
            label && (
              <text
                key={label}
                x={0}
                y={18 + i * (CELL_SIZE + GAP) + CELL_SIZE - 2}
                fontSize={9}
                fill="var(--text-secondary)"
              >
                {label}
              </text>
            ),
        )}

        {/* Contribution cells */}
        {weeks.map((week, wi) =>
          week.contributionDays.map((day) => (
            <rect
              key={day.date}
              x={LABEL_WIDTH + wi * (CELL_SIZE + GAP)}
              y={16 + day.weekday * (CELL_SIZE + GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={LEVEL_COLORS[day.contributionLevel] ?? LEVEL_COLORS.NONE}
            >
              <title>
                {day.date}: {day.contributionCount} contributions
              </title>
            </rect>
          )),
        )}
      </svg>
    </div>
  );
}
