import { usePostHog } from "@posthog/react";
import { useState } from "react";
import { analyticsEvents, captureAnalyticsEvent } from "../lib/analytics";
import { fetchOrgMembers } from "../lib/github";
import { ALL_STATS } from "../lib/stats";
import { useToast } from "../lib/ToastContext";
import type { FetchAllOptions } from "../lib/useContributions";
import { useDialogBehavior } from "../lib/useDialogBehavior";
import type { UseSettingsReturn } from "../lib/useSettings";
import AuthSection from "./AuthSection";
import DatePresets from "./DatePresets";
import PillButton from "./PillButton";
import UserChip from "./UserChip";

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
  settings: UseSettingsReturn;
  token: string;
  authMethod: "oauth" | "pat" | "none";
  isAuthenticating: boolean;
  authError: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onUserAdded: (username: string) => void;
  onFetch: (options?: FetchAllOptions) => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  settings,
  token,
  authMethod,
  isAuthenticating,
  authError,
  onSignIn,
  onSignOut,
  onUserAdded,
  onFetch,
}: SettingsDrawerProps) {
  const {
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
    visibleStats,
    setVisibleStats,
    refreshInterval,
    setRefreshInterval,
  } = settings;
  const { addToast } = useToast();
  const posthog = usePostHog();
  const [userInput, setUserInput] = useState("");
  const [importingOrg, setImportingOrg] = useState(false);
  const { containerRef, handleKeyDown } = useDialogBehavior({ open, onClose });

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
    if (!token || !org) return;
    setImportingOrg(true);
    try {
      const members = await fetchOrgMembers(token, org);
      const newUsers = members.filter((m) => !users.includes(m));
      if (newUsers.length > 0) {
        setUsers([...users, ...newUsers]);
        for (const u of newUsers) onUserAdded(u);
      }
      captureAnalyticsEvent(posthog, analyticsEvents.orgImportCompleted, {
        imported_count: newUsers.length,
        total_user_count: users.length + newUsers.length,
      });
    } catch (e) {
      addToast("error", `Failed to import org members: ${(e as Error).message}`);
    } finally {
      setImportingOrg(false);
    }
  }

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
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        inert={!open}
        aria-label="Settings"
        onKeyDown={open ? handleKeyDown : undefined}
        className={`ph-no-capture fixed top-0 right-0 h-full w-full sm:w-[340px] bg-gh-bg border-l border-gh-border z-30 transform transition-transform duration-200 ${
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
          {/* Authentication section */}
          <div className="flex flex-col gap-2">
            <span className={sectionLabel}>Authentication</span>
            <AuthSection
              authMethod={authMethod}
              isAuthenticating={isAuthenticating}
              authError={authError}
              pat={pat}
              setPat={setPat}
              onSignIn={onSignIn}
              onSignOut={onSignOut}
            />
          </div>

          {!token && (
            <p className="text-[12px] text-gh-text-secondary text-center">
              Sign in to configure your dashboard.
            </p>
          )}

          {token && (
            <>
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
                  onSelect={(from, to) => onFetch({ from, to, trigger: "date-preset" })}
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
                {org && token && (
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
                      <PillButton
                        key={stat.id}
                        active={active}
                        onClick={() => {
                          if (active) {
                            setVisibleStats(visibleStats.filter((s) => s !== stat.id));
                          } else {
                            setVisibleStats([...visibleStats, stat.id]);
                          }
                        }}
                      >
                        {stat.label}
                      </PillButton>
                    );
                  })}
                </div>
              </div>

              {/* Auto-refresh section */}
              <div className="flex flex-col gap-2">
                <span className={sectionLabel}>Auto Refresh</span>
                <div className="flex gap-1.5 flex-wrap">
                  {REFRESH_OPTIONS.map((opt) => (
                    <PillButton
                      key={opt.value}
                      active={refreshInterval === opt.value}
                      onClick={() => setRefreshInterval(opt.value)}
                    >
                      {opt.label}
                    </PillButton>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
