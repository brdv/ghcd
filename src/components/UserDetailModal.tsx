import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { computeInsights } from "../lib/insights";
import type { GitHubUser } from "../lib/types";
import Heatmap from "./Heatmap";
import StatsBar from "./StatsBar";

type Phase = "morph-in" | "open" | "morph-out" | "closed";

interface UserDetailModalProps {
  username: string;
  data: GitHubUser;
  sourceRect: DOMRect;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Return all focusable elements inside a container. */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export default function UserDetailModal({
  username,
  data,
  sourceRect,
  onClose,
}: UserDetailModalProps) {
  const [phase, setPhase] = useState<Phase>("morph-in");
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const titleId = useId();

  // Capture the element that opened the dialog so we can restore focus later
  useEffect(() => {
    triggerRef.current = document.activeElement;
  }, []);

  // Morph in, then focus the close button once expanded
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
  }, []);

  useEffect(() => {
    if (phase === "open") {
      // Wait for the morph transition to settle before focusing
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 360);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleClose = useCallback(() => {
    setPhase("morph-out");
    setTimeout(() => {
      setPhase("closed");
      // Restore focus to the element that triggered the dialog
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
      onClose();
    }, 350);
  }, [onClose]);

  // Focus trap: cycle Tab / Shift+Tab within the dialog
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      handleClose();
      return;
    }

    if (e.key === "Tab" && panelRef.current) {
      const focusable = getFocusableElements(panelRef.current);
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
  }

  // Prevent background scrolling while dialog is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const collection = data.contributionsCollection;
  const calendar = collection.contributionCalendar;
  const insights = useMemo(() => computeInsights(calendar.weeks), [calendar.weeks]);
  const topRepos = collection.commitContributionsByRepository;

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

  // Profile meta items
  const meta: { icon: string; text: string }[] = [];
  if (data.location) meta.push({ icon: "\u{1F4CD}", text: data.location });
  if (data.company) meta.push({ icon: "\u{1F3E2}", text: data.company });
  if (data.websiteUrl) meta.push({ icon: "\u{1F517}", text: data.websiteUrl });

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop — click to close */}
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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="bg-gh-card border border-gh-border shadow-2xl"
        style={{
          ...targetStyle,
          transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
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
            {/* Profile meta */}
            {meta.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gh-text-secondary">
                {meta.map((m) => (
                  <span key={m.text} className="flex items-center gap-1">
                    <span className="text-xs">{m.icon}</span> {m.text}
                  </span>
                ))}
                <span className="flex items-center gap-1">
                  <span className="text-xs">{"\u{1F465}"}</span>
                  {data.followers.totalCount} followers &middot; {data.following.totalCount}{" "}
                  following
                </span>
              </div>
            )}

            {/* Stats bar */}
            <StatsBar collection={collection} />

            {/* Insights grid */}
            <div>
              <h3 className="text-sm font-medium text-gh-text-secondary mb-2">Insights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <InsightCard label="Current Streak" value={`${insights.currentStreak}d`} />
                <InsightCard label="Longest Streak" value={`${insights.longestStreak}d`} />
                <InsightCard label="Daily Average" value={`${insights.dailyAverage}`} />
                <InsightCard
                  label="Active Days"
                  value={`${insights.activeDays}/${insights.totalDays}`}
                />
                <InsightCard
                  label="Peak Day"
                  value={`${insights.peakDay.count}`}
                  sub={insights.peakDay.date ? formatDate(insights.peakDay.date) : undefined}
                />
                <InsightCard
                  label="Busiest Day"
                  value={insights.busiestDayOfWeek.day}
                  sub={`~${insights.busiestDayOfWeek.avgCount}/day`}
                />
              </div>
            </div>

            {/* Top repositories */}
            {topRepos.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gh-text-secondary mb-2">
                  Top Repositories
                </h3>
                <div className="flex flex-col gap-1.5">
                  {topRepos.map((r) => (
                    <a
                      key={r.repository.url}
                      href={r.repository.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-gh-badge hover:bg-gh-border transition-colors text-sm no-underline"
                    >
                      <span className="text-gh-text-primary font-medium truncate mr-2">
                        {r.repository.name}
                      </span>
                      <span className="text-gh-text-secondary text-xs shrink-0">
                        {r.contributions.totalCount} commits
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Heatmap */}
            <div>
              <h3 className="text-sm font-medium text-gh-text-secondary mb-2">
                Contribution Activity
              </h3>
              <Heatmap weeks={calendar.weeks} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm">
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gh-accent hover:text-gh-accent-hover font-medium"
              >
                View on GitHub &rarr;
              </a>
              <span className="text-gh-text-secondary text-xs">
                Member since {formatDate(data.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center px-2 py-2.5 rounded-lg bg-gh-badge">
      <span className="text-lg font-bold">{value}</span>
      {sub && <span className="text-[10px] text-gh-text-secondary">{sub}</span>}
      <span className="text-[11px] text-gh-text-secondary mt-0.5">{label}</span>
    </div>
  );
}
