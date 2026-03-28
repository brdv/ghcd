import { useState } from "react";

const inputClass =
  "px-3 py-2 rounded-lg border border-gh-border bg-gh-card text-gh-text-primary text-base outline-none focus:border-gh-accent focus-visible:ring-2 focus-visible:ring-gh-accent focus-visible:ring-offset-1 focus-visible:ring-offset-gh-bg";

const GITHUB_ICON = (
  <svg
    role="img"
    aria-label="GitHub logo"
    width="18"
    height="18"
    viewBox="0 0 16 16"
    fill="currentColor"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

interface AuthSectionProps {
  authMethod: "oauth" | "pat" | "none";
  isAuthenticating: boolean;
  authError: string | null;
  pat: string;
  setPat: (v: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function AuthSection({
  authMethod,
  isAuthenticating,
  authError,
  pat,
  setPat,
  onSignIn,
  onSignOut,
}: AuthSectionProps) {
  const [patVisible, setPatVisible] = useState(false);
  const [showPatInput, setShowPatInput] = useState(Boolean(pat));

  if (authMethod === "oauth") {
    return (
      <>
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
          <span className="text-gh-text-primary">Signed in with GitHub</span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="text-xs font-medium text-gh-accent hover:text-gh-accent-hover cursor-pointer bg-transparent border-none p-0 self-start rounded focus-visible:ring-2 focus-visible:ring-gh-accent"
        >
          Sign out
        </button>
      </>
    );
  }

  if (showPatInput) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowPatInput(false)}
          className="text-xs font-medium text-gh-accent hover:text-gh-accent-hover cursor-pointer bg-transparent border-none p-0 self-start rounded focus-visible:ring-2 focus-visible:ring-gh-accent"
        >
          Change authentication method
        </button>
        <label htmlFor="pat-input" className="text-xs text-gh-text-secondary">
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
            aria-label={patVisible ? "Hide personal access token" : "Show personal access token"}
            aria-pressed={patVisible}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-gh-text-secondary cursor-pointer text-xs rounded focus-visible:ring-2 focus-visible:ring-gh-accent"
          >
            {patVisible ? "Hide" : "Show"}
          </button>
        </div>
        <p id="pat-help" className="text-[11px] text-gh-text-secondary">
          Requires <code className="bg-gh-badge px-1 py-0.5 rounded text-[11px]">read:user</code>{" "}
          and <code className="bg-gh-badge px-1 py-0.5 rounded text-[11px]">read:org</code> scopes.
          Stored in your browser only.
        </p>
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onSignIn}
        disabled={isAuthenticating}
        aria-busy={isAuthenticating}
        aria-label="Sign in with GitHub"
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-none font-semibold text-sm transition-opacity focus-visible:ring-2 focus-visible:ring-gh-accent focus-visible:ring-offset-1 focus-visible:ring-offset-gh-bg ${
          isAuthenticating ? "opacity-50 cursor-default" : "cursor-pointer hover:opacity-85"
        } bg-gh-accent text-white`}
      >
        {GITHUB_ICON}
        {isAuthenticating ? "Signing in..." : "Sign in with GitHub"}
      </button>
      {authError && <p className="text-[11px] text-gh-danger">{authError}</p>}
      <button
        type="button"
        onClick={() => setShowPatInput(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gh-border font-semibold text-sm transition-opacity cursor-pointer hover:opacity-85 bg-transparent text-gh-text-primary focus-visible:ring-2 focus-visible:ring-gh-accent focus-visible:ring-offset-1 focus-visible:ring-offset-gh-bg"
      >
        Use a Personal Access Token
      </button>
    </>
  );
}
