# GHCD Roadmap

## Done

- [x] Contribution heatmaps per user
- [x] Stats bar (commits, PRs, reviews, issues, repos, streak)
- [x] Configurable visible stats (toggle pills in drawer)
- [x] Badge system with alliterative names
- [x] Streak counter + Streak Star badge
- [x] Day-of-week breakdown chart (in user detail modal)
- [x] User detail modal with insights, top repos, heatmap
- [x] Organization filtering
- [x] Date range presets (7d, 30d, 90d, YTD, this year, 12 months)
- [x] Shareable URLs (base64-encoded state)
- [x] Auto-fetch on page load with URL state
- [x] Settings drawer (full-screen mobile, sidebar desktop)
- [x] PAT stored in localStorage
- [x] Dark/light/system theme toggle
- [x] Keyboard shortcuts (R = refetch, S = settings)
- [x] Responsive layout (single column mobile, up to 3 on desktop)
- [x] Cards sorted by total contributions
- [x] Skeleton loading states
- [x] Toast notification system
- [x] Favicon
- [x] CI (lint, typecheck, build)
- [x] Footer with credits

## To Do

### Data & Insights

- [x] **Current streak indicator on card** — show the current streak (not just longest) as a visible element on the main card, not just in the modal
- [ ] **Contribution velocity** — week-over-week change indicator (trending up/down arrow + percentage)
- [ ] **Language breakdown** — fetch top languages per user from their repos and show as colored dots or a mini bar
- [ ] **PR review turnaround** — average time between PR opened and first review (requires additional API data)
- [ ] **Contribution time-of-day heatmap** — when during the day does each user contribute most (requires commit timestamp data)

### Badges

- [ ] **Weekend Warrior** — most contributions on Sat/Sun
- [ ] **Early Bird / Night Owl** — based on commit timestamps (if available)
- [ ] **Consistent Contributor** — lowest variance in daily contributions (most evenly spread)
- [ ] **Rising Star** — biggest increase in contributions compared to previous period

### Usability

- [ ] **Saved configs** — name and save different user/org/date setups to localStorage, switch between them from the drawer
- [ ] **Auto-import org members** — button to fetch all members of the configured org and add them
- [ ] **Export as image** — screenshot individual cards or the full dashboard (html-to-image)
- [ ] **Export as CSV/JSON** — download contribution data for external analysis
- [ ] **Drag to reorder cards** — manual card ordering as alternative to auto-sort
- [ ] **Compare mode** — side-by-side comparison of exactly 2 users with diff highlighting
- [ ] **Date range in URL state** — already partially done, ensure custom ranges round-trip correctly

### UI & Polish

- [ ] **Animated card transitions** — cards fade/slide in as data loads progressively
- [ ] **Heatmap tooltips** — richer tooltips on hover showing day name + contribution count
- [ ] **Responsive date presets** — show abbreviated labels on smaller desktop screens
- [ ] **Card expand/collapse** — toggle individual cards between compact (stats only) and full (heatmap + stats)
- [ ] **Custom badge images** — replace emoji placeholders with designed SVG/PNG badge icons
- [ ] **PWA support** — add manifest + service worker for installable app experience
- [ ] **Confetti on badges** — subtle celebration animation when badges are awarded after fetch

### Infrastructure

- [ ] **E2E tests** — Playwright tests for core flows (add user, fetch, verify cards)
- [ ] **Unit tests** — test streak computation, badge logic, date presets
- [ ] **GitHub Pages deploy action** — auto-deploy on push to main
- [ ] **Error boundary** — catch React render errors gracefully with a fallback UI
- [ ] **Rate limit handling** — detect GitHub API rate limits and show a meaningful message with reset time

## Inbox

Unscoped ideas — move to a section above when ready to prioritize.

- [ ] Notifications/alerts when a user hits a milestone (e.g., 100 commits)
- [ ] Historical comparison — compare current period vs previous period
- [ ] Team leaderboard view — ranked table with sortable columns
- [ ] Embed mode — query param that renders a single card for embedding in other pages
- [ ] Public API / share endpoint — generate a public link that doesn't require a PAT (server-rendered snapshot)
- [ ] GitHub OAuth login — replace PAT with OAuth flow for smoother onboarding
- [ ] Multi-org support — compare contributions across multiple orgs simultaneously
- [ ] Slack integration — post dashboard summaries to a Slack channel on a schedule
- [ ] Browser extension — show contribution comparison on GitHub org pages
- [ ] Contribution goals — set targets per user and show progress bars
