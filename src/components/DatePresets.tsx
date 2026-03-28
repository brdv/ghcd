import { useState } from "react";
import { getDatePresets } from "../lib/datePresets";
import PillButton from "./PillButton";

const inputClass =
  "px-3 py-2 rounded-lg border border-gh-border bg-gh-card text-gh-text-primary text-base outline-none focus:border-gh-accent focus-visible:ring-2 focus-visible:ring-gh-accent focus-visible:ring-offset-1 focus-visible:ring-offset-gh-bg";

interface DatePresetsProps {
  fromDate: string;
  toDate: string;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  onSelect?: (from: string, to: string) => void;
}

export type DatePresetId = "7d" | "30d" | "90d" | "ytd" | "year" | "1y" | "custom";

export default function DatePresets({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  onSelect,
}: DatePresetsProps) {
  const presets = getDatePresets();
  const initialPreset = presets.find((p) => fromDate === p.from && toDate === p.to);
  const [active, setActive] = useState<DatePresetId>(
    (initialPreset?.id as DatePresetId) ?? "custom",
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        {presets.map((p) => (
          <PillButton
            key={p.id}
            active={active === p.id}
            onClick={() => {
              setActive(p.id);
              setFromDate(p.from);
              setToDate(p.to);
              onSelect?.(p.from, p.to);
            }}
          >
            {p.label}
          </PillButton>
        ))}
        <PillButton active={active === "custom"} onClick={() => setActive("custom")}>
          Custom
        </PillButton>
      </div>
      {active === "custom" && (
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <label htmlFor="from-date" className="sr-only">
            From date
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="From date"
            className={`${inputClass} w-full min-w-0`}
          />
          <span className="text-gh-text-secondary text-xs" aria-hidden="true">
            to
          </span>
          <label htmlFor="to-date" className="sr-only">
            To date
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To date"
            className={`${inputClass} w-full min-w-0`}
          />
        </div>
      )}
    </div>
  );
}
