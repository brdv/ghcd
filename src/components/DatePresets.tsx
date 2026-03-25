import { getDatePresets } from "../lib/datePresets";

interface DatePresetsProps {
  fromDate: string;
  toDate: string;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  onSelect?: (from: string, to: string) => void;
}

export default function DatePresets({
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  onSelect,
}: DatePresetsProps) {
  const presets = getDatePresets();

  return (
    <div className="flex gap-1.5 flex-wrap">
      {presets.map((p) => {
        const active = fromDate === p.from && toDate === p.to;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setFromDate(p.from);
              setToDate(p.to);
              onSelect?.(p.from, p.to);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
              active
                ? "bg-gh-accent/20 border-gh-accent text-gh-accent"
                : "bg-transparent border-gh-border text-gh-text-secondary hover:border-gh-text-secondary"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
