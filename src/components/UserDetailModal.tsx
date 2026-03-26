import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { GitHubUser } from "../lib/types";
import { useDialogBehavior } from "../lib/useDialogBehavior";
import UserProfile from "./UserProfile";

const MORPH_DURATION_MS = 350;

type Phase = "morph-in" | "open" | "morph-out" | "closed";

interface UserDetailModalProps {
  username: string;
  data: GitHubUser;
  sourceRect: DOMRect;
  previousPeriodTotal?: number;
  onClose: () => void;
}

export default function UserDetailModal({
  username,
  data,
  sourceRect,
  previousPeriodTotal,
  onClose,
}: UserDetailModalProps) {
  const [phase, setPhase] = useState<Phase>("morph-in");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const handleClose = useCallback(() => {
    setPhase("morph-out");
    setTimeout(() => {
      setPhase("closed");
      onClose();
    }, MORPH_DURATION_MS);
  }, [onClose]);

  const { containerRef, handleKeyDown } = useDialogBehavior({
    open: phase !== "closed",
    onClose: handleClose,
  });

  // Morph in: double rAF ensures the browser has painted the initial (card-sized)
  // frame before we transition to the expanded state, so the CSS transition animates.
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
  }, []);

  useEffect(() => {
    if (phase === "open") {
      const timer = setTimeout(() => closeButtonRef.current?.focus(), MORPH_DURATION_MS + 10);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Card-position style (morph start/end)
  const cardStyle: React.CSSProperties = {
    position: "fixed",
    top: sourceRect.top,
    left: sourceRect.left,
    width: sourceRect.width,
    height: sourceRect.height,
    borderRadius: 12,
    opacity: 1,
    overflow: "hidden",
  };

  // Modal-position style (centered)
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const modalWidth = Math.min(672, vw - 32);
  const modalHeight = Math.min(vh * 0.9, vh - 32);
  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: (vh - modalHeight) / 2,
    left: (vw - modalWidth) / 2,
    width: modalWidth,
    height: modalHeight,
    borderRadius: 16,
    opacity: 1,
    overflow: "hidden",
  };

  const isExpanded = phase === "open";
  const targetStyle = isExpanded ? modalStyle : cardStyle;

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-[background-color,backdrop-filter] duration-300"
        style={{
          backgroundColor: isExpanded ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
          backdropFilter: isExpanded ? "blur(4px)" : "blur(0px)",
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="bg-gh-card border border-gh-border shadow-2xl"
        style={{
          ...targetStyle,
          transition: `all ${MORPH_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: 41,
        }}
      >
        {/* Content fades in once expanded */}
        <div
          className="h-full flex flex-col"
          style={{
            opacity: isExpanded ? 1 : 0,
            transition: `opacity ${isExpanded ? "250ms 150ms" : "100ms"} ease`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gh-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={data.avatarUrl}
                alt={`${username}'s avatar`}
                className="w-12 h-12 rounded-full shrink-0"
              />
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold truncate">
                  {username}
                </h2>
                {data.bio && <p className="text-gh-text-secondary text-sm truncate">{data.bio}</p>}
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              aria-label="Close dialog"
              className="bg-transparent border-none text-gh-text-secondary hover:text-gh-text-primary cursor-pointer text-2xl leading-none p-1 shrink-0 ml-2"
            >
              &times;
            </button>
          </div>

          {/* Scrollable content */}
          <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-1 min-h-0">
            <UserProfile
              username={username}
              data={data}
              previousPeriodTotal={previousPeriodTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
