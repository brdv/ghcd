import { usePostHog } from "@posthog/react";
import { useCallback, useEffect, useState } from "react";
import { analyticsEvents, captureAnalyticsEvent } from "./analytics";
import {
  clearOAuthTokens,
  exchangeCodeForToken,
  isOAuthConfigured,
  loadOAuthTokens,
  SESSION_CALLBACK_CODE,
  SESSION_CALLBACK_STATE,
  saveOAuthTokens,
  startOAuthFlow,
} from "./oauth";
import { useToast } from "./ToastContext";

type AuthMethod = "oauth" | "pat" | "none";

export interface UseAuthReturn {
  token: string;
  method: AuthMethod;
  isAuthenticating: boolean;
  authError: string | null;
  signIn: () => void;
  signOut: () => void;
}

export function useAuth(pat: string): UseAuthReturn {
  const { addToast } = useToast();
  const posthog = usePostHog();
  const [method, setMethod] = useState<AuthMethod>(() => {
    const stored = loadOAuthTokens();
    if (stored) return "oauth";
    if (pat) return "pat";
    return "none";
  });
  const [oauthToken, setOauthToken] = useState(() => {
    const stored = loadOAuthTokens();
    return stored?.accessToken ?? "";
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Derive the active token
  const token = method === "oauth" ? oauthToken : method === "pat" ? pat : "";

  // Handle OAuth callback on mount (code stashed by main.tsx)
  useEffect(() => {
    const code = sessionStorage.getItem(SESSION_CALLBACK_CODE);
    const state = sessionStorage.getItem(SESSION_CALLBACK_STATE);
    if (!code || state === null) return;

    setIsAuthenticating(true);
    setAuthError(null);

    exchangeCodeForToken(code, state)
      .then((tokens) => {
        const stored = saveOAuthTokens(tokens);
        setOauthToken(stored.accessToken);
        setMethod("oauth");
        setAuthError(null);
        captureAnalyticsEvent(posthog, analyticsEvents.oauthSignInCompleted);
        addToast("success", "Signed in with GitHub.");
      })
      .catch((err) => {
        setAuthError((err as Error).message);
        captureAnalyticsEvent(posthog, analyticsEvents.oauthSignInFailed);
        addToast("error", `Sign in failed: ${(err as Error).message}`);
      })
      .finally(() => {
        sessionStorage.removeItem(SESSION_CALLBACK_CODE);
        sessionStorage.removeItem(SESSION_CALLBACK_STATE);
        setIsAuthenticating(false);
      });
  }, [addToast, posthog]);

  // Update method when pat changes (and not using oauth)
  useEffect(() => {
    if (method !== "oauth") {
      setMethod(pat ? "pat" : "none");
    }
  }, [pat, method]);

  const signIn = useCallback(() => {
    if (!isOAuthConfigured()) {
      addToast("error", "GitHub OAuth is not configured.");
      return;
    }
    setAuthError(null);
    captureAnalyticsEvent(posthog, analyticsEvents.oauthSignInStarted);
    startOAuthFlow();
  }, [addToast, posthog]);

  const signOut = useCallback(() => {
    clearOAuthTokens();
    setOauthToken("");
    setMethod(pat ? "pat" : "none");
    setAuthError(null);
    captureAnalyticsEvent(posthog, analyticsEvents.oauthSignedOut);
    addToast("success", "Signed out.");
  }, [addToast, pat, posthog]);

  return { token, method, isAuthenticating, authError, signIn, signOut };
}
