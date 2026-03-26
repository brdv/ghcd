import { describe, expect, it } from "vitest";
import type { DatePreset } from "../datePresets";
import { getDatePresets } from "../datePresets";

function findPreset(id: string): DatePreset {
  const preset = getDatePresets().find((p) => p.id === id);
  if (!preset) throw new Error(`Preset "${id}" not found`);
  return preset;
}

describe("getDatePresets", () => {
  it("returns 6 presets", () => {
    const presets = getDatePresets();
    expect(presets).toHaveLength(6);
  });

  it("all presets have required fields", () => {
    for (const p of getDatePresets()) {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("from date is before to date for all presets", () => {
    for (const p of getDatePresets()) {
      expect(new Date(p.from).getTime()).toBeLessThanOrEqual(new Date(p.to).getTime());
    }
  });

  it("7d preset is exactly 7 days back", () => {
    const p = findPreset("7d");
    const diffDays = Math.round(
      (new Date(p.to).getTime() - new Date(p.from).getTime()) / 86_400_000,
    );
    expect(diffDays).toBe(7);
  });

  it("30d preset is exactly 30 days back", () => {
    const p = findPreset("30d");
    const diffDays = Math.round(
      (new Date(p.to).getTime() - new Date(p.from).getTime()) / 86_400_000,
    );
    expect(diffDays).toBe(30);
  });

  it("90d preset is exactly 90 days back", () => {
    const p = findPreset("90d");
    const diffDays = Math.round(
      (new Date(p.to).getTime() - new Date(p.from).getTime()) / 86_400_000,
    );
    expect(diffDays).toBe(90);
  });

  it("YTD starts on Jan 1 of current year", () => {
    const p = findPreset("ytd");
    const year = new Date().getFullYear();
    expect(p.from).toBe(`${year}-01-01`);
  });

  it("This year covers full current year", () => {
    const p = findPreset("year");
    const year = new Date().getFullYear();
    expect(p.from).toBe(`${year}-01-01`);
    expect(p.to).toBe(`${year}-12-31`);
  });
});
