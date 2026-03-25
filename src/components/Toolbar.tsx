import { useTheme } from "../lib/useTheme";
import DatePresets from "./DatePresets";
import ExportButton from "./ExportButton";

interface ToolbarProps {
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  onFetch: (overrides?: { from?: string; to?: string }) => void;
  isFetching: boolean;
  userCount: number;
  onOpenSettings: () => void;
}

export default function Toolbar({
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onFetch,
  isFetching,
  userCount,
  onOpenSettings,
}: ToolbarProps) {
  const { theme, cycleTheme } = useTheme();
  return (
    <nav
      aria-label="Toolbar"
      className="sticky top-0 z-10 bg-gh-card border-b border-gh-border px-4 sm:px-6 py-3 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-6 flex items-center gap-3"
    >
      <h1 className="text-base sm:text-lg font-bold mr-auto truncate">GitHub Contributions</h1>

      {/* Date presets — desktop only */}
      <div className="hidden md:flex">
        <DatePresets
          fromDate={fromDate}
          toDate={toDate}
          setFromDate={setFromDate}
          setToDate={setToDate}
          onSelect={(from, to) => onFetch({ from, to })}
        />
      </div>

      <button
        type="button"
        onClick={() => onFetch()}
        disabled={isFetching}
        aria-busy={isFetching}
        className={`px-4 py-2 rounded-lg border-none cursor-pointer font-semibold text-sm transition-opacity bg-gh-accent text-white shrink-0 ${
          isFetching ? "opacity-40 cursor-not-allowed" : "hover:opacity-85"
        }`}
      >
        {isFetching ? "Fetching..." : "Fetch"}
        <kbd className="sr-only">R</kbd>
      </button>

      <ExportButton elementSelector="#dashboard" />

      {/* Theme toggle: system → light → dark → system */}
      <button
        type="button"
        onClick={cycleTheme}
        className="p-2 rounded-lg bg-gh-badge text-gh-text-secondary hover:text-gh-text-primary transition-colors cursor-pointer border-none shrink-0"
        aria-label={`Change theme (currently ${theme})`}
      >
        <ThemeIcon theme={theme} />
      </button>

      {/* Settings gear */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="relative p-2 rounded-lg bg-gh-badge text-gh-text-secondary hover:text-gh-text-primary transition-colors cursor-pointer border-none shrink-0"
        aria-label={
          userCount > 0
            ? `Settings (${userCount} user${userCount === 1 ? "" : "s"} configured), press S`
            : "Settings, press S"
        }
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        {/* User count badge */}
        {userCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gh-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {userCount}
          </span>
        )}
      </button>
    </nav>
  );
}

const svgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ThemeIcon({ theme }: { theme: "light" | "dark" | "system" }) {
  if (theme === "light") {
    return (
      <svg {...svgProps} aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg {...svgProps} aria-hidden="true">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    );
  }
  return (
    <svg {...svgProps} aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
