# CLAUDE.md

## Project

GHCD (GitHub Contributions Dashboard) — a React SPA that compares GitHub contribution heatmaps and stats for multiple users side by side. Deployed to GitHub Pages at brdv.github.io/ghcd/.

## Stack

- **Runtime/package manager:** Bun (not npm/yarn)
- **Framework:** React 19 + TypeScript
- **Build:** Vite (base path `/ghcd/`)
- **Styling:** Tailwind CSS 3 with CSS custom properties for theme colors
- **Linting/formatting:** Biome (single tool, replaces ESLint + Prettier)
- **CI:** GitHub Actions (lint, typecheck, build)

## Commands

```sh
bun install            # install dependencies
bun run dev            # start dev server
bun run build          # typecheck + production build
bun run lint           # biome check (lint + format)
bun run lint:fix       # auto-fix lint + format issues
bun run format         # format only
```

## Architecture

- `src/App.tsx` — root component, holds all state, fetch logic, URL sync
- `src/components/` — UI components (Toolbar, SettingsDrawer, ContributionCard, Heatmap, StatsBar, UserDetailModal, etc.)
- `src/lib/` — logic modules (github API, types, badges, streaks, stats, date presets, theme, toast context)
- `public/` — static assets (favicon)
- Data flows from GitHub's GraphQL API → App state → components. No backend; PAT is stored in localStorage.

## Key patterns

- **Toasts:** use `useToast()` from `src/lib/ToastContext.tsx` (context provider, not a standalone hook)
- **Theme:** `useTheme()` from `src/lib/useTheme.ts` — cycles system/light/dark, persists to localStorage, applies CSS vars
- **Badges:** computed via `computeBadges()` in `src/lib/badges.ts` — only awarded when 2+ users loaded, clear winner, value > 0
- **Stats:** defined in `src/lib/stats.ts` as `ALL_STATS` — each has an id, label, and getValue function. Users toggle visibility in the drawer.
- **URL state:** encoded as base64 JSON in `?state=` param — contains users, org, from, to
- **Date presets:** defined in `src/lib/datePresets.ts`, rendered as pills in Toolbar (desktop) and SettingsDrawer (mobile)

## Conventions

- Double quotes, semicolons (Biome default)
- Biome handles import sorting
- CSS linting is disabled (Tailwind `@tailwind` directives aren't standard CSS)
- Tailwind colors reference CSS custom properties (`var(--gh-bg)` etc.) for theme support
- SVGs must have `role="img"` + `aria-label` for a11y
- Labels must wrap or be associated with their inputs
- `biome-ignore` comments require a reason suffix

## Things to avoid

- Don't use npm — use bun
- Don't push to remote — user pushes manually
- Don't add dependencies without asking — the project intentionally has zero runtime deps beyond React
