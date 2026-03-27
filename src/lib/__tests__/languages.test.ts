import { describe, expect, it } from "vitest";
import { aggregateLanguages } from "../languages";

function repo(...langs: [string, number, string | null][]) {
  return {
    languages: {
      edges: langs.map(([name, size, color]) => ({ size, node: { name, color } })),
    },
  };
}

describe("aggregateLanguages", () => {
  it("returns empty array for no repositories", () => {
    expect(aggregateLanguages([])).toEqual([]);
  });

  it("returns empty array when all repos have zero-byte languages", () => {
    expect(aggregateLanguages([repo(["TypeScript", 0, "#3178c6"])])).toEqual([]);
  });

  it("computes percentages for a single repo", () => {
    const result = aggregateLanguages([
      repo(["TypeScript", 800, "#3178c6"], ["CSS", 200, "#563d7c"]),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("TypeScript");
    expect(result[0].percentage).toBeCloseTo(80);
    expect(result[1].name).toBe("CSS");
    expect(result[1].percentage).toBeCloseTo(20);
  });

  it("weights repos equally regardless of byte size", () => {
    // Repo A: 1 000 000 bytes of CSS, tiny amount of TS
    // Repo B: 100 bytes, all TypeScript
    // Without normalization CSS would dominate; with it each repo counts equally.
    const result = aggregateLanguages([
      repo(["CSS", 999_000, "#563d7c"], ["TypeScript", 1_000, "#3178c6"]),
      repo(["TypeScript", 100, "#3178c6"]),
    ]);

    const ts = result.find((l) => l.name === "TypeScript");
    const css = result.find((l) => l.name === "CSS");
    // Repo A: TS = 1000/1000000 = 0.1%, CSS = 99.9%  →  shares: TS ≈ 0.001, CSS ≈ 0.999
    // Repo B: TS = 100%                               →  shares: TS += 1.0
    // Total TS share ≈ 1.001, CSS share ≈ 0.999
    expect(ts?.percentage).toBeCloseTo(50.05, 1);
    expect(css?.percentage).toBeCloseTo(49.95, 1);
  });

  it("sorts languages by share descending", () => {
    const result = aggregateLanguages([
      repo(["HTML", 10, "#e34c26"], ["Go", 70, "#00ADD8"], ["Shell", 20, "#89e051"]),
    ]);
    expect(result.map((l) => l.name)).toEqual(["Go", "Shell", "HTML"]);
  });

  it("uses fallback color when language color is null", () => {
    const result = aggregateLanguages([repo(["Makefile", 100, null])]);
    expect(result[0].color).toBe("#8b8b8b");
  });

  it("percentages sum to 100", () => {
    const result = aggregateLanguages([
      repo(["TypeScript", 500, "#3178c6"], ["CSS", 300, "#563d7c"], ["HTML", 200, "#e34c26"]),
      repo(["Go", 600, "#00ADD8"], ["Shell", 400, "#89e051"]),
    ]);
    const total = result.reduce((sum, l) => sum + l.percentage, 0);
    expect(total).toBeCloseTo(100);
  });

  it("merges the same language across multiple repos", () => {
    const result = aggregateLanguages([
      repo(["TypeScript", 100, "#3178c6"]),
      repo(["TypeScript", 100, "#3178c6"]),
      repo(["TypeScript", 100, "#3178c6"]),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("TypeScript");
    expect(result[0].percentage).toBeCloseTo(100);
  });
});
