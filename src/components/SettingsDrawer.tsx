import { usePostHog } from "@posthog/react";
import { useState } from "react";
import { analyticsEvents, captureAnalyticsEvent } from "../lib/analytics";
import { fetchOrgMembers } from "../lib/githubGraphQL";
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
  "px-3 py-2 rounded-lg border border-gh-border bg-gh-card text-gh-text-primary text-base outline-none focus:border-gh-accent focus-visible:ring-2 focus-visible:ring-gh-accent focus-visible:ring-offset-1 focus-visible:ring-offset-gh-bg";

const sectionLabel = "text-xs text-gh-text-secondary font-medium uppercase tracking-wider";
const sectionDivider = "border-t border-gh-border";

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

  function toggleStat(id: string) {
    setVisibleStats(
      visibleStats.includes(id) ? visibleStats.filter((s) => s !== id) : [...visibleStats, id],
    );
  }

  function handleDatePresetSelect(from: string, to: string) {
    onFetch({ from, to, trigger: "date-preset" });
  }

  function handleUserInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUserInput(e.target.value);
  }

  function handleUserInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addUser();
  }

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className={`fixed inset-0 z-20 transition-opacity duration-200 w-full h-full border-none ${
          open
            ? "bg-black/50 cursor-pointer pointer-events-auto"
            : "bg-transparent pointer-events-none"
        }`}
        tabIndex={-1}
        onClick={onClose}
        aria-label="Close settings"
      />

      {/* Drawer — full screen on mobile, 340px sidebar on sm+ */}
      <aside
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        inert={!open}
        aria-label="Settings"
        onKeyDown={open ? handleKeyDown : undefined}
        className={`ph-no-capture fixed top-0 right-0 h-full w-full sm:w-[340px] bg-gh-bg border-l border-gh-border z-30 transform transition-transform duration-200 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gh-border shrink-0">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="bg-transparent border-none text-gh-text-secondary hover:text-gh-text-primary cursor-pointer leading-none p-1 focus-visible:ring-2 focus-visible:ring-gh-accent rounded"
          >
            <svg
              role="img"
              aria-label="Close"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col overflow-y-auto flex-1">
          <div className="px-5 pt-5 pb-4 flex flex-col gap-2">
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

          <div className={`${sectionDivider} px-5 pt-5 pb-5 flex flex-col gap-3`}>
            <label htmlFor="user-input" className="text-sm text-gh-text-primary font-semibold">
              Users
            </label>
            <div className="flex gap-2">
              <input
                id="user-input"
                value={userInput}
                onChange={handleUserInputChange}
                onKeyDown={handleUserInputKeyDown}
                placeholder="Add username..."
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={addUser}
                className="px-3 py-2 rounded-lg border-none cursor-pointer font-semibold text-sm transition-colors hover:opacity-90 bg-gh-accent text-white focus-visible:ring-2 focus-visible:ring-gh-accent focus-visible:ring-offset-1 focus-visible:ring-offset-gh-bg"
              >
                Add
              </button>
            </div>

            {users.length > 0 && (
              <div className="flex gap-2 flex-wrap pt-1">
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

            <div className="flex flex-col gap-2">
              <label htmlFor="org-input" className={sectionLabel}>
                Organization
              </label>
              <input
                id="org-input"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder={token ? "Optional — filter by org" : "Sign in to filter by org"}
                disabled={!token}
                className={`${inputClass} w-full ${!token ? "opacity-50" : ""}`}
              />
            </div>

            {org && token && (
              <button
                type="button"
                onClick={importOrgMembers}
                disabled={importingOrg}
                className={`text-xs font-medium transition-colors cursor-pointer bg-transparent border-none p-0 rounded focus-visible:ring-2 focus-visible:ring-gh-accent ${
                  importingOrg
                    ? "text-gh-text-secondary opacity-50"
                    : "text-gh-accent hover:text-gh-accent-hover"
                }`}
              >
                {importingOrg ? "Importing..." : `Import members from ${org}`}
              </button>
            )}
          </div>

          <div className={`${sectionDivider} px-5 pt-5 pb-5 flex flex-col gap-3`}>
            <span className="text-sm text-gh-text-primary font-semibold">Date Range</span>
            <DatePresets
              fromDate={fromDate}
              toDate={toDate}
              setFromDate={setFromDate}
              setToDate={setToDate}
              onSelect={handleDatePresetSelect}
            />
          </div>

          <div className={`${sectionDivider} px-5 pt-5 pb-5 flex flex-col gap-4`}>
            <span className="text-sm text-gh-text-primary font-semibold">Display</span>
            <div className="flex flex-col gap-2">
              <span className={sectionLabel}>Visible Stats</span>
              <div className="flex gap-1.5 flex-wrap">
                {ALL_STATS.map((stat) => (
                  <PillButton
                    key={stat.id}
                    active={visibleStats.includes(stat.id)}
                    onClick={() => toggleStat(stat.id)}
                  >
                    {stat.label}
                  </PillButton>
                ))}
              </div>
            </div>

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
          </div>
        </div>
      </aside>
    </>
  );
}
