const inputClass =
  'px-3 py-2 rounded-lg border border-gh-border bg-gh-card text-gh-text-primary text-sm outline-none focus:border-gh-accent'

interface ToolbarProps {
  org: string
  setOrg: (v: string) => void
  fromDate: string
  setFromDate: (v: string) => void
  toDate: string
  setToDate: (v: string) => void
  onFetch: () => void
  isFetching: boolean
  userCount: number
  onOpenSettings: () => void
}

export default function Toolbar({
  org,
  setOrg,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  onFetch,
  isFetching,
  userCount,
  onOpenSettings,
}: ToolbarProps) {
  return (
    <div className="sticky top-0 z-10 bg-gh-card border-b border-gh-border px-6 py-3 -mx-6 -mt-6 mb-6 flex items-center gap-3 flex-wrap">
      <h1 className="text-lg font-bold mr-auto">GitHub Contributions</h1>

      <label className="text-xs text-gh-text-secondary">Org</label>
      <input
        value={org}
        onChange={(e) => setOrg(e.target.value)}
        placeholder="Optional"
        className={`${inputClass} w-[140px]`}
      />

      <label className="text-xs text-gh-text-secondary">From</label>
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className={`${inputClass} w-[140px]`}
      />
      <label className="text-xs text-gh-text-secondary">To</label>
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className={`${inputClass} w-[140px]`}
      />

      <button
        type="button"
        onClick={onFetch}
        disabled={isFetching}
        className={`px-4 py-2 rounded-lg border-none cursor-pointer font-semibold text-sm transition-opacity bg-gh-accent text-white ${
          isFetching ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-85'
        }`}
      >
        {isFetching ? 'Fetching...' : 'Fetch'}
      </button>

      {/* Settings gear */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="relative p-2 rounded-lg bg-gh-badge text-gh-text-secondary hover:text-gh-text-primary transition-colors cursor-pointer border-none"
        title="Settings"
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
    </div>
  )
}
