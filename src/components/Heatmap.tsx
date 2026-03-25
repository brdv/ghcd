import type { ContributionLevel, ContributionWeek } from '../lib/types'

const CELL_SIZE = 13
const GAP = 3
const LABEL_WIDTH = 28

const LEVEL_COLORS: Record<ContributionLevel, string> = {
  NONE: 'var(--contrib-none)',
  FIRST_QUARTILE: 'var(--contrib-q1)',
  SECOND_QUARTILE: 'var(--contrib-q2)',
  THIRD_QUARTILE: 'var(--contrib-q3)',
  FOURTH_QUARTILE: 'var(--contrib-q4)',
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

interface HeatmapProps {
  weeks: ContributionWeek[]
}

export default function Heatmap({ weeks }: HeatmapProps) {
  const width = LABEL_WIDTH + weeks.length * (CELL_SIZE + GAP)
  const height = 7 * (CELL_SIZE + GAP) + 20

  // Track month labels to only show on first week of each month
  let lastMonth = ''

  return (
    <div className="overflow-x-auto mb-3.5">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        {/* Month labels */}
        {weeks.map((week, wi) => {
          const d = new Date(week.contributionDays[0].date)
          const month = d.toLocaleString('en', { month: 'short' })
          if (month === lastMonth) return null
          lastMonth = month
          return (
            <text
              key={`month-${wi}`}
              x={LABEL_WIDTH + wi * (CELL_SIZE + GAP)}
              y={10}
              fontSize={10}
              fill="var(--text-secondary)"
            >
              {month}
            </text>
          )
        })}

        {/* Day labels */}
        {DAY_LABELS.map((label, i) =>
          label ? (
            <text
              key={`day-${i}`}
              x={0}
              y={18 + i * (CELL_SIZE + GAP) + CELL_SIZE - 2}
              fontSize={9}
              fill="var(--text-secondary)"
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Contribution cells */}
        {weeks.map((week, wi) =>
          week.contributionDays.map((day, di) => (
            <rect
              key={`${wi}-${di}`}
              x={LABEL_WIDTH + wi * (CELL_SIZE + GAP)}
              y={16 + di * (CELL_SIZE + GAP)}
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
  )
}
