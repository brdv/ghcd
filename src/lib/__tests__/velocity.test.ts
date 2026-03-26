import { describe, expect, it } from "vitest";
import { computeVelocity } from "../velocity";
import { collection, week } from "./fixtures";

describe("computeVelocity", () => {
  it("returns null when previousPeriodTotal is undefined", () => {
    const col = collection([week([["2026-03-01", 10]])]);
    expect(computeVelocity(col, undefined)).toBeNull();
  });

  it("computes positive velocity", () => {
    const col = collection([week([["2026-03-01", 10]])]); // total = 10
    const result = computeVelocity(col, 5);
    expect(result).not.toBeNull();
    expect(result?.percentage).toBe(100); // (10-5)/5 * 100
    expect(result?.currentTotal).toBe(10);
    expect(result?.previousTotal).toBe(5);
  });

  it("computes negative velocity", () => {
    const col = collection([week([["2026-03-01", 3]])]); // total = 3
    const result = computeVelocity(col, 10);
    expect(result?.percentage).toBe(-70); // (3-10)/10 * 100
  });

  it("returns 0% when both periods are zero", () => {
    const col = collection([week([["2026-03-01", 0]])]); // total = 0
    const result = computeVelocity(col, 0);
    expect(result?.percentage).toBe(0);
  });

  it("returns 100% when previous was zero but current is positive", () => {
    const col = collection([week([["2026-03-01", 5]])]); // total = 5
    const result = computeVelocity(col, 0);
    expect(result?.percentage).toBe(100);
  });

  it("returns 0% when current equals previous", () => {
    const col = collection([week([["2026-03-01", 8]])]); // total = 8
    const result = computeVelocity(col, 8);
    expect(result?.percentage).toBe(0);
  });
});
