import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOrgMembers } from "../lib/github";
import { ALL_STATS } from "../lib/stats";
import DatePresets from "./DatePresets";
import UserChip from "./UserChip";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

const inputClass =
  "px-3 py-2 rounded-lg border border-gh-border bg-gh-card text-gh-text-primary text-sm outline-none focus:border-gh-accent";

const sectionLabel = "text-xs text-gh-text-secondary font-medium uppercase tracking-wider";

const REFRESH_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 60, label: "1 min" },
  { value: 300, label: "5 min" },
  { value: 900, label: "15 min" },
  { value: 1800, label: "30 min" },
];

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  pat: string;
  setPat: (v: string) => void;
  org: string;
  setOrg: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  users: string[];
  setUsers: (v: string[]) => void;
  onUserAdded: (username: string) => void;
  visibleStats: string[];
  setVisibleStats: (v: string[]) => void;
  refreshInterval: number;
  setRefreshInterval: (v: number) => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  pat,
  setPat,
  org,
  setOrg,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  users,
  setUsers,
  onUserAdded,
  visibleStats,
  setVisibleStats,
  refreshInterval,
  setRefreshInterval,
}: SettingsDrawerProps) {
  const [userInput, setUserInput] = useState("");
  const [patVisible, setPatVisible] = useState(false);
  const [importingOrg, setImportingOrg] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<Element | null>(null);

  function addUser() {
    const u = userInput.trim().toLowerCase();
    if (u && !users.includes(u)) {
      setUsers([...users, u]);
      onUserAdded(u);
    }
    setUserInput("");
  }

  function removeUser(username: string) {
    setUsers(users.filter((x) => x !== username));
  }

  async function importOrgMembers() {
    if (!pat || !org) return;
    setImportingOrg(true);
    try {
      const members = await fetchOrgMembers(pat, org);
      const newUsers = members.filter((m) => !users.includes(m));
      if (newUsers.length > 0) {
        setUsers([...users, ...newUsers]);
        for (const u of newUsers) onUserAdded(u);
      }
    } catch {
      // Handled silently — org may not exist or PAT lacks scope
    } finally {
      setImportingOrg(false);
    }
  }

  // Focus the close button when the drawer opens, restore focus when it closes
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      const focusable = drawerRef.current ? getFocusableElements(drawerRef.current) : [];
      focusable[0]?.focus();
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // Lock background scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusable = getFocusableElements(drawerRef.current);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  return (
    <>
      {/* Backdrop */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-20 transition-opacity w-full h-full cursor-pointer border-none"
          tabIndex={-1}
          onClick={onClose}
          aria-label="Close settings"
        />
      )}

      {/* Drawer — full screen on mobile, 340px sidebar on sm+ */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        inert={!open}
        aria-label="Settings"
        onKeyDown={open ? handleKeyDown : undefined}
        className={`fixed top-0 right-0 h-full w-full sm:w-[340px] bg-gh-bg border-l border-gh-border z-30 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gh-border">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="bg-transparent border-none text-gh-text-secondary hover:text-gh-text-primary cursor-pointer text-xl leading-none p-1"
          >
            &times;
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto h-[calc(100%-57px)]">
          {/* PAT section */}
          <div className="flex flex-col gap-2">
            <label htmlFor="pat-input" className={sectionLabel}>
              Personal Access Token
            </label>
            <div className="relative flex-1 min-w-[200px]">
              <input
                id="pat-input"
                type={patVisible ? "text" : "password"}
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_..."
                aria-describedby="pat-help"
                className={`${inputClass} w-full pr-[50px]`}
              />
              <button
                type="button"
                onClick={() => setPatVisible(!patVisible)}
                aria-label={
                  patVisible ? "Hide personal access token" : "Show personal access token"
                }
                aria-pressed={patVisible}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gh-text-secondary cursor-pointer text-xs"
              >
                {patVisible ? "Hide" : "Show"}
              </button>
            </div>
            <p id="pat-help" className="text-[11px] text-gh-text-secondary">
              Requires{" "}
              <code className="bg-gh-badge px-1 py-0.5 rounded text-[11px]">read:user</code> and{" "}
              <code className="bg-gh-badge px-1 py-0.5 rounded text-[11px]">read:org</code> scopes.
              Stored in your browser only.
            </p>
          </div>

          {/* Org section */}
          <div className="flex flex-col gap-2">
            <label htmlFor="org-input" className={sectionLabel}>
              Organization
            </label>
            <input
              id="org-input"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Optional — filter by org"
              className={`${inputClass} w-full`}
            />
          </div>

          {/* Date range section */}
          <fieldset className="flex flex-col gap-2 border-none p-0 m-0">
            <legend className={sectionLabel}>Date Range</legend>
            <DatePresets
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
            />
            <div className="flex gap-2 items-center">
              <label htmlFor="from-date" className="sr-only">
                From date
              </label>
              <input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
                className={`${inputClass} flex-1`}
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
                className={`${inputClass} flex-1`}
              />
            </div>
          </fieldset>

          {/* Users section */}
          <div className="flex flex-col gap-2">
            <label htmlFor="user-input" className={sectionLabel}>
              Users
            </label>
            <div className="flex gap-2">
              <input
                id="user-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addUser();
                }}
                placeholder="Add username..."
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={addUser}
                className="px-3 py-2 rounded-lg border-none cursor-pointer font-semibold text-sm transition-opacity hover:opacity-85 bg-gh-badge text-gh-text-primary"
              >
                Add
              </button>
            </div>
            {org && pat && (
              <button
                type="button"
                onClick={importOrgMembers}
                disabled={importingOrg}
                className={`text-xs font-medium transition-colors cursor-pointer bg-transparent border-none p-0 ${
                  importingOrg
                    ? "text-gh-text-secondary opacity-50"
                    : "text-gh-accent hover:text-gh-accent-hover"
                }`}
              >
                {importingOrg ? "Importing..." : `Import members from ${org}`}
              </button>
            )}
            {users.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {users.map((u) => (
                  <UserChip key={u} username={u} onRemove={() => removeUser(u)} />
                ))}
              </div>
            )}
            {users.length === 0 && (
              <p className="text-[12px] text-gh-text-secondary">
                No users added yet. Add GitHub usernames above.
              </p>
            )}
          </div>

          {/* Visible stats section */}
          <div className="flex flex-col gap-2">
            <span className={sectionLabel}>Visible Stats</span>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_STATS.map((stat) => {
                const active = visibleStats.includes(stat.id);
                return (
                  <button
                    key={stat.id}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setVisibleStats(visibleStats.filter((s) => s !== stat.id));
                      } else {
                        setVisibleStats([...visibleStats, stat.id]);
                      }
                    }}
                    aria-pressed={active}
                    className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                      active
                        ? "bg-gh-accent/20 border-gh-accent text-gh-accent"
                        : "bg-transparent border-gh-border text-gh-text-secondary hover:border-gh-text-secondary"
                    }`}
                  >
                    {stat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-refresh section */}
          <div className="flex flex-col gap-2">
            <span className={sectionLabel}>Auto Refresh</span>
            <div className="flex gap-1.5 flex-wrap">
              {REFRESH_OPTIONS.map((opt) => {
                const active = refreshInterval === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRefreshInterval(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                      active
                        ? "bg-gh-accent/20 border-gh-accent text-gh-accent"
                        : "bg-transparent border-gh-border text-gh-text-secondary hover:border-gh-text-secondary"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
