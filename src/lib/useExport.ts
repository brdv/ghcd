import { usePostHog } from "@posthog/react";
import { useCallback } from "react";
import { analyticsEvents, captureAnalyticsEvent } from "./analytics";
import { useToast } from "./ToastContext";

export function useExport(elementSelector: string, userCount: number) {
  const { addToast } = useToast();
  const posthog = usePostHog();

  const handleExport = useCallback(async () => {
    const element = document.querySelector(elementSelector);
    if (!element) return;

    try {
      const isLight = document.documentElement.classList.contains("light");
      const styles = getComputedStyle(document.documentElement);
      const bg = styles.getPropertyValue("--gh-bg").trim();
      const borderColor = styles.getPropertyValue("--gh-border").trim();

      // Measure actual content width from the cards so the export fits tightly
      const el = element as HTMLElement;
      const cards = el.querySelectorAll<HTMLElement>(".grid > *");
      let contentRight = 0;
      const elRect = el.getBoundingClientRect();
      for (const card of cards) {
        const r = card.getBoundingClientRect();
        contentRight = Math.max(contentRight, r.right - elRect.left);
      }
      const snugWidth = contentRight > 0 ? Math.ceil(contentRight) : undefined;

      let contentDataUrl: string;
      try {
        // 1. Capture the visible dashboard at the measured width
        const { toPng } = await import("html-to-image");
        contentDataUrl = await toPng(el, {
          pixelRatio: 2,
          backgroundColor: bg,
          width: snugWidth,
          filter: (node) =>
            !(node instanceof HTMLElement && node.hasAttribute("data-export-hidden")),
        });
      } finally {
        // no DOM cleanup needed — we only read measurements
      }

      // 2. Load it as an image
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = contentDataUrl;
      });

      // 3. Draw the fancy window frame on a canvas
      const scale = 2;
      const padding = 48 * scale;
      const titleBarH = 44 * scale;
      const contentPadX = 24 * scale;
      const contentPadY = 20 * scale;
      const radius = 12 * scale;
      const dotR = 6 * scale;
      const dotGap = 20 * scale;
      const dotOffsetX = 18 * scale;

      const frameW = img.width + contentPadX * 2;
      const frameH = img.height + titleBarH + contentPadY * 2;
      const footerH = 32 * scale;
      const canvasW = frameW + padding * 2;
      const canvasH = frameH + padding * 2 + footerH;

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
      if (isLight) {
        grad.addColorStop(0, "#e0e7ef");
        grad.addColorStop(0.5, "#f5f0ff");
        grad.addColorStop(1, "#dbeafe");
      } else {
        grad.addColorStop(0, "#1a1333");
        grad.addColorStop(0.5, "#1e293b");
        grad.addColorStop(1, "#0f172a");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Shadow
      ctx.save();
      ctx.shadowColor = isLight ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 60 * scale;
      ctx.shadowOffsetY = 20 * scale;
      ctx.beginPath();
      ctx.roundRect(padding, padding, frameW, frameH, radius);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();

      // Frame border
      ctx.beginPath();
      ctx.roundRect(padding, padding, frameW, frameH, radius);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      // Title bar background
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(padding, padding, frameW, titleBarH, [radius, radius, 0, 0]);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();

      // Title bar bottom border
      ctx.beginPath();
      ctx.moveTo(padding, padding + titleBarH);
      ctx.lineTo(padding + frameW, padding + titleBarH);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      // Traffic light dots
      const dotY = padding + titleBarH / 2;
      for (const [i, color] of (["#ff5f57", "#febc2e", "#28c840"] as const).entries()) {
        ctx.beginPath();
        ctx.arc(padding + dotOffsetX + i * dotGap, dotY, dotR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Content area background
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(padding, padding + titleBarH, frameW, frameH - titleBarH, [
        0,
        0,
        radius,
        radius,
      ]);
      ctx.fill();

      // Paste the captured dashboard image
      ctx.drawImage(img, padding + contentPadX, padding + titleBarH + contentPadY);

      // Footer: date + branding
      const footerY = padding + frameH + footerH - 4 * scale;
      const fontSize = 12 * scale;
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;
      ctx.fillStyle = isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.35)";
      const date = new Date().toLocaleDateString("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      ctx.textAlign = "left";
      ctx.fillText(date, padding, footerY);
      ctx.textAlign = "right";
      ctx.fillText(
        "Created with GHCD.io \u00B7 github.com/knutselio/ghcd",
        padding + frameW,
        footerY,
      );

      // 4. Download
      const link = document.createElement("a");
      link.download = `ghcd-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      captureAnalyticsEvent(posthog, analyticsEvents.dashboardExported, {
        user_count: userCount,
      });
      addToast("success", "Dashboard exported as PNG.");
    } catch {
      addToast("error", "Failed to export dashboard. Try again.");
    }
  }, [elementSelector, addToast, posthog, userCount]);

  return handleExport;
}
