import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { formatTooltipDate } from "../lib/dates";
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

/** Tooltip state including content and container-relative position. */
interface TooltipData {
  date: string;
  count: number;
  dayName: string;
  formatted: string;
  /** Horizontal offset (px) from the container's left edge. */
  x: number;
  /** Vertical offset (px) from the container's top edge. */
  y: number;
}

interface HeatmapProps {
  weeks: ContributionWeek[];
}

/**
 * Cached SVG layout measurements used to convert SVG coordinates
 * to container-relative pixel positions for tooltip placement.
 */
interface ILayout {
  /** Ratio of rendered SVG width to its viewBox width. */
  scale: number;
  /** SVG element's left offset relative to the container. */
  svgOffsetX: number;
  /** SVG element's top offset relative to the container. */
  svgOffsetY: number;
}

/**
 * GitHub-style contribution heatmap rendered as an SVG grid.
 *
 * Weeks that are entirely in the future are trimmed. Cells are colored
 * by contribution quartile using CSS custom properties for theme support.
 * Supports mouse hover, touch tap (toggle), click, and keyboard interaction
 * for tooltip display.
 */
export default function Heatmap({ weeks: allWeeks }: HeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const isTouchRef = useRef(false); // Guards against mouse events firing after touch events on hybrid devices.
  const layoutRef = useRef<ILayout | null>(null);
  const descId = useId();

  const weeks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    let lastIdx = allWeeks.length;
    while (lastIdx > 0) {
      const week = allWeeks[lastIdx - 1];
      if (week.contributionDays.some((d) => d.date <= today)) break;
      lastIdx--;
    }
    return allWeeks.slice(0, lastIdx);
  }, [allWeeks]);

  const width = LABEL_WIDTH + weeks.length * (CELL_SIZE + GAP);
  const height = 7 * (CELL_SIZE + GAP) + 20;

  const totalContributions = useMemo(
    () =>
      weeks.reduce(
        (sum, w) => sum + w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
        0,
      ),
    [weeks],
  );

  const monthLabels = useMemo(() => {
    const labels: { month: string; x: number; key: string }[] = [];
    let prev = "";
    for (let wi = 0; wi < weeks.length; wi++) {
      const date = weeks[wi].contributionDays[0].date;
      const month = new Date(date).toLocaleString(undefined, { month: "short" });
      if (month !== prev) {
        prev = month;
        labels.push({ month, x: LABEL_WIDTH + wi * (CELL_SIZE + GAP), key: `month-${date}` });
      }
    }
    return labels;
  }, [weeks]);

  const cells = useMemo(
    () =>
      weeks.map((week, wi) =>
        week.contributionDays.map((day) => (
          <rect
            key={day.date}
            data-date={day.date}
            data-count={day.contributionCount}
            data-wi={wi}
            data-wd={day.weekday}
            x={LABEL_WIDTH + wi * (CELL_SIZE + GAP)}
            y={24 + day.weekday * (CELL_SIZE + GAP)}
            width={CELL_SIZE}
            height={CELL_SIZE}
            rx={2}
            fill={LEVEL_COLORS[day.contributionLevel] ?? LEVEL_COLORS.NONE}
          />
        )),
      ),
    [weeks],
  );

  /** Snapshot the SVG's position and scale so tooltip coordinates can be computed without repeated DOM reads. */
  const updateLayout = useCallback(() => {
    const container = containerRef.current;
    const svg = container?.querySelector("svg");
    if (!container || !svg) return;
    const containerRect = container.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    layoutRef.current = {
      scale: svgRect.width / width,
      svgOffsetX: svgRect.left - containerRect.left,
      svgOffsetY: svgRect.top - containerRect.top,
    };
  }, [width]);

  /** Read data-* attributes from a heatmap cell and return tooltip content + position. */
  const computeTooltip = useCallback((target: Element): TooltipData | null => {
    const dateVal = target.getAttribute("data-date");
    const countVal = target.getAttribute("data-count");
    const wiVal = target.getAttribute("data-wi");
    const wdVal = target.getAttribute("data-wd");
    if (!dateVal || countVal == null || !wiVal || !wdVal || !layoutRef.current) return null;

    const wi = Number(wiVal);
    const wd = Number(wdVal);
    const { scale, svgOffsetX, svgOffsetY } = layoutRef.current;
    const { dayName, formatted } = formatTooltipDate(dateVal);

    return {
      date: dateVal,
      count: Number(countVal),
      dayName,
      formatted,
      x: svgOffsetX + (LABEL_WIDTH + wi * (CELL_SIZE + GAP) + CELL_SIZE / 2) * scale,
      y: svgOffsetY + (24 + wd * (CELL_SIZE + GAP)) * scale - 6,
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    isTouchRef.current = false;
    updateLayout();
  }, [updateLayout]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isTouchRef.current) return;
      setTooltip(computeTooltip(e.target as Element));
    },
    [computeTooltip],
  );

  const handleMouseLeave = useCallback(() => {
    if (isTouchRef.current) return;
    setTooltip(null);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      isTouchRef.current = true;
      updateLayout();
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!target) return;
      e.preventDefault();
      const dateVal = target.getAttribute("data-date");
      if (!dateVal) {
        setTooltip(null);
        return;
      }
      setTooltip((prev) => (prev?.date === dateVal ? null : computeTooltip(target)));
    },
    [computeTooltip, updateLayout],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isTouchRef.current) {
        isTouchRef.current = false;
        return;
      }
      const target = e.target as Element;
      const dateVal = target.getAttribute("data-date");
      if (!dateVal) {
        setTooltip(null);
        return;
      }
      setTooltip((prev) => (prev?.date === dateVal ? null : computeTooltip(target)));
    },
    [computeTooltip],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        const target = e.target as Element;
        const dateVal = target.getAttribute("data-date");
        if (!dateVal) {
          setTooltip(null);
          return;
        }
        setTooltip((prev) => (prev?.date === dateVal ? null : computeTooltip(target)));
      }
    },
    [computeTooltip],
  );

  /**
   * Dismiss tooltip on outside tap/click
   */
  useEffect(() => {
    if (!tooltip) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [tooltip]);

  return (
    <div ref={containerRef} className="relative mb-3.5 bg-gh-badge rounded-lg p-3">
      <div id={descId} className="sr-only">
        {totalContributions} total contributions across {weeks.length} weeks. Colors range from no
        contributions (empty) to highest activity (bright green). Hover or tap a cell to see
        details.
      </div>
      <div className="overflow-x-auto">
        <svg
          width={width}
          className="max-w-full"
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Contribution heatmap"
          aria-describedby={descId}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          {monthLabels.map((m) => (
            <text key={m.key} x={m.x} y={10} fontSize={9} fill="var(--text-secondary)">
              {m.month}
            </text>
          ))}

          {DAY_LABELS.map(
            (label, i) =>
              label && (
                <text
                  key={label}
                  x={0}
                  y={26 + i * (CELL_SIZE + GAP) + CELL_SIZE - 2}
                  fontSize={9}
                  fill="var(--text-secondary)"
                >
                  {label}
                </text>
              ),
          )}

          {cells}
        </svg>
      </div>

      {tooltip && (
        <div
          role="tooltip"
          aria-live="polite"
          aria-atomic="true"
          className="absolute z-50 pointer-events-none px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-nowrap bg-gh-badge text-gh-text-primary border border-gh-border shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <span className="font-semibold">
            {tooltip.count} {tooltip.count === 1 ? "contribution" : "contributions"}
          </span>
          <br />
          <span className="opacity-70">
            {tooltip.dayName}, {tooltip.formatted}
          </span>
        </div>
      )}
    </div>
  );
}
