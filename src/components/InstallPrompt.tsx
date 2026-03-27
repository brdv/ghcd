import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptMode = "native" | "safari-ios" | "safari-mac" | null;

function getPromptMode(): PromptMode {
  // Already running as installed PWA
  if (window.matchMedia("(display-mode: standalone)").matches) return null;

  const ua = navigator.userAgent;
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|Chromium|Edg/.test(ua);

  if (isSafari) {
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return isIOS ? "safari-ios" : "safari-mac";
  }

  // Chromium browsers — will use beforeinstallprompt
  return "native";
}

const DISMISSED_KEY = "ghcd-install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === "1");
  const [mode] = useState<PromptMode>(getPromptMode);

  useEffect(() => {
    if (mode !== "native") return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [mode]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  }, []);

  if (dismissed) return null;

  // Native prompt: wait for beforeinstallprompt event
  if (mode === "native" && !deferredPrompt) return null;

  // Not Safari, not native-capable — don't show anything
  if (mode === null) return null;

  const safariInstructionsByMode: Record<string, string> = {
    "safari-ios": 'To install: tap the Share button, then "Add to Home Screen".',
    "safari-mac": "To install: use File \u2192 Add to Dock in Safari.",
  };
  const safariInstructions = mode ? (safariInstructionsByMode[mode] ?? null) : null;

  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-xs rounded-lg border border-gh-border bg-gh-card p-4 shadow-lg animate-slide-in">
      {safariInstructions ? (
        <p className="text-sm text-gh-text-primary">{safariInstructions}</p>
      ) : (
        <>
          <p className="text-sm text-gh-text-primary mb-3">
            Install GHCD for quick access from your home screen.
          </p>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded bg-gh-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-gh-accent-hover cursor-pointer border-none"
          >
            Install
          </button>
        </>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install prompt"
        className="absolute top-2 right-2 bg-transparent border-none text-gh-text-secondary hover:text-gh-text-primary cursor-pointer text-base leading-none p-1"
      >
        &times;
      </button>
    </div>
  );
}
