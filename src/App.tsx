import { usePostHog } from "@posthog/react";
import { useCallback, useState } from "react";
import ContributionCard from "./components/ContributionCard";
import InstallPrompt from "./components/InstallPrompt";
import SettingsDrawer from "./components/SettingsDrawer";
import Toolbar from "./components/Toolbar";
import UserDetailModal from "./components/UserDetailModal";
import { analyticsEvents, captureAnalyticsEvent } from "./lib/analytics";
import type { GitHubUser } from "./lib/types";
import { useAuth } from "./lib/useAuth";
import { type FetchAllOptions, useContributions } from "./lib/useContributions";
import { useDerivedData } from "./lib/useDerivedData";
import { useKeyboardShortcuts } from "./lib/useKeyboardShortcuts";
import { useSettings } from "./lib/useSettings";

type SettingsOpenSource = "empty-state" | "fetch-validation" | "shortcut" | "toolbar";

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    username: string;
    rect: DOMRect;
  } | null>(null);
  const posthog = usePostHog();

  const settings = useSettings();
  const auth = useAuth(settings.pat);

  const { results, isFetching, sortedUsers, fetchAll, fetchUser } = useContributions({
    pat: auth.token,
    org: settings.org,
    fromDate: settings.fromDate,
    toDate: settings.toDate,
    users: settings.users,
    refreshInterval: settings.refreshInterval,
    hasInitialUrlState: settings.hasInitialUrlState,
  });

  const fetchAndOpenOnError = useCallback(
    async (options?: FetchAllOptions) => {
      const error = await fetchAll(options);
      if (error) {
        setDrawerOpen(true);
        captureAnalyticsEvent(posthog, analyticsEvents.settingsOpened, {
          source: "fetch-validation",
          has_org: Boolean(settings.org),
          has_pat: Boolean(settings.pat),
          user_count: settings.users.length,
        });
      }
    },
    [fetchAll, posthog, settings.org, settings.pat, settings.users.length],
  );

  const openSettings = useCallback(
    (source: SettingsOpenSource) => {
      if (!drawerOpen) {
        captureAnalyticsEvent(posthog, analyticsEvents.settingsOpened, {
          source,
          has_org: Boolean(settings.org),
          has_pat: Boolean(settings.pat),
          user_count: settings.users.length,
        });
      }

      setDrawerOpen(true);
    },
    [drawerOpen, posthog, settings.org, settings.pat, settings.users.length],
  );

  const toggleSettings = useCallback(() => {
    if (drawerOpen) {
      setDrawerOpen(false);
      return;
    }

    openSettings("shortcut");
  }, [drawerOpen, openSettings]);

  const handleSelectUser = useCallback(
    (username: string, rect: DOMRect) => {
      captureAnalyticsEvent(posthog, analyticsEvents.userDetailOpened, {
        has_org: Boolean(settings.org),
        user_count: settings.users.length,
      });
      setSelectedUser({ username, rect });
    },
    [posthog, settings.org, settings.users.length],
  );

  const handleRepoLinkClick = useCallback(() => {
    captureAnalyticsEvent(posthog, analyticsEvents.repoLinkClicked, {
      source: "footer",
    });
  }, [posthog]);

  useKeyboardShortcuts([
    { key: "r", action: () => fetchAndOpenOnError({ trigger: "shortcut" }) },
    { key: "s", action: toggleSettings },
  ]);

  const { badges, dateLabel, gridCols } = useDerivedData({
    results,
    fromDate: settings.fromDate,
    toDate: settings.toDate,
    users: settings.users,
  });

  return (
    <main className="min-h-screen bg-gh-bg text-gh-text-primary p-4 sm:p-6 font-sans flex flex-col">
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-gh-accent focus:text-white focus:rounded-lg focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <Toolbar
        fromDate={settings.fromDate}
        setFromDate={settings.setFromDate}
        toDate={settings.toDate}
        setToDate={settings.setToDate}
        onFetch={fetchAndOpenOnError}
        isFetching={isFetching}
        userCount={settings.users.length}
        onOpenSettings={() => openSettings("toolbar")}
      />

      <div id="dashboard">
        {settings.users.length > 0 && (
          <p className="text-gh-text-secondary text-sm mb-4">
            Comparing{" "}
            <span className="text-gh-text-primary font-medium">
              {settings.users.length} {settings.users.length === 1 ? "user" : "users"}
            </span>
            {settings.org && (
              <>
                {" "}
                in <span className="text-gh-text-primary font-medium">{settings.org}</span>
              </>
            )}{" "}
            for <span className="text-gh-text-primary font-medium">{dateLabel}</span>
          </p>
        )}

        {settings.users.length === 0 ? (
          <div
            role="status"
            className="flex flex-col items-center justify-center py-24 text-gh-text-secondary"
          >
            <p className="text-base mb-2">No users configured</p>
            <button
              type="button"
              onClick={() => openSettings("empty-state")}
              className="text-gh-accent hover:text-gh-accent-hover cursor-pointer bg-transparent border-none text-sm font-medium"
            >
              Open settings to add users
            </button>
          </div>
        ) : (
          <div
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={gridCols < 3 ? { maxWidth: gridCols === 1 ? "100%" : undefined } : undefined}
          >
            {sortedUsers.map((u) => (
              <ContributionCard
                key={u}
                username={u}
                result={results[u] ?? {}}
                badges={badges[u] ?? []}
                visibleStats={settings.visibleStats}
                onSelect={(rect) => handleSelectUser(u, rect)}
                onSignIn={auth.method === "none" ? auth.signIn : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={settings}
        token={auth.token}
        authMethod={auth.method}
        isAuthenticating={auth.isAuthenticating}
        authError={auth.authError}
        onSignIn={auth.signIn}
        onSignOut={auth.signOut}
        onUserAdded={fetchUser}
        onFetch={fetchAndOpenOnError}
      />

      {selectedUser && results[selectedUser.username]?.data && (
        <UserDetailModal
          username={selectedUser.username}
          data={results[selectedUser.username].data as GitHubUser}
          sourceRect={selectedUser.rect}
          previousPeriodTotal={results[selectedUser.username].previousPeriodTotal}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <InstallPrompt />

      <footer className="mt-auto pt-12 py-6 text-center text-xs text-gh-text-secondary border-t border-gh-border">
        <a
          href="https://github.com/knutselio/ghcd"
          target="_blank"
          rel="noreferrer"
          onClick={handleRepoLinkClick}
          aria-label="GHCD project on GitHub"
          className="text-gh-accent hover:text-gh-accent-hover"
        >
          GHCD
        </a>{" "}
        — Created with{" "}
        <span role="img" aria-label="love">
          ❤️
        </span>{" "}
        by{" "}
        <a
          href="https://github.com/brdv"
          target="_blank"
          rel="noreferrer"
          aria-label="brdv on GitHub"
          className="text-gh-accent hover:text-gh-accent-hover"
        >
          brdv
        </a>
        {" & "}
        <a
          href="https://github.com/mathijsr94"
          target="_blank"
          rel="noreferrer"
          aria-label="mathijsr94 on GitHub"
          className="text-gh-accent hover:text-gh-accent-hover"
        >
          mathijsr94
        </a>
        <span className="block mt-2 text-[10px] text-gh-text-secondary/30">{__COMMIT_HASH__}</span>
      </footer>
    </main>
  );
}
