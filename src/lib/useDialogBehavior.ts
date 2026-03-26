import { useCallback, useEffect, useRef } from "react";

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

interface UseDialogBehaviorOptions {
  open: boolean;
  onClose: () => void;
}

export function useDialogBehavior({ open, onClose }: UseDialogBehaviorOptions) {
  const containerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Focus management: save trigger, focus first element on open, restore on close
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      const focusable = containerRef.current ? getFocusableElements(containerRef.current) : [];
      focusable[0]?.focus();
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // Lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap + Escape to close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && containerRef.current) {
        const focusable = getFocusableElements(containerRef.current);
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

  return { containerRef, handleKeyDown };
}
