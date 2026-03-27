import { useMemo } from "react";
import { aggregateLanguages } from "../lib/languages";
import type { LanguageEdge } from "../lib/types";

interface LanguageBarProps {
  repositories: { languages: { edges: LanguageEdge[] } }[];
}

export default function LanguageBar({ repositories }: LanguageBarProps) {
  const languages = useMemo(() => aggregateLanguages(repositories), [repositories]);

  if (languages.length === 0) return null;

  const description = languages.map((l) => `${l.name}: ${l.percentage.toFixed(1)}%`).join(", ");

  return (
    <figure className="m-0" role="img" aria-label={`Language breakdown. ${description}`}>
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px" aria-hidden="true">
        {languages.map((lang) => (
          <div
            key={lang.name}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
            style={{
              width: `${Math.max(lang.percentage, 0.5)}%`,
              backgroundColor: lang.color,
            }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
        {languages.map((lang) => (
          <span
            key={lang.name}
            className="flex items-center gap-1.5 text-xs text-gh-text-secondary"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: lang.color }}
              aria-hidden="true"
            />
            <span className="text-gh-text-primary font-medium">{lang.name}</span>
            <span>{lang.percentage.toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </figure>
  );
}
