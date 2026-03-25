# GHCD - GitHub Contributions Dashboard

Compare GitHub contribution heatmaps and stats for multiple users side by side.

**Live:** [brdv.github.io/ghcd](https://brdv.github.io/ghcd/)

## What it does

GHCD fetches contribution data from GitHub's GraphQL API and displays it as a dashboard with:

- **Contribution heatmaps** — GitHub-style green squares for each user
- **Stats** — commits, PRs, reviews, issues, and repo contributions
- **Organization filtering** — scope contributions to a specific GitHub org
- **Date range** — pick any time window (defaults to current year)
- **Shareable URLs** — the current config (users, org, dates) is encoded in the URL so you can share a dashboard view with others

## Setup

You need a [GitHub Personal Access Token](https://github.com/settings/tokens) with the `read:user` scope. The token is stored in your browser's `localStorage` and never leaves your machine.

## Getting started

```sh
bun install
bun run dev
```

Open [localhost:5173/ghcd/](http://localhost:5173/ghcd/), click the gear icon to add your PAT and some GitHub usernames, then hit **Fetch**.

## Stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS**
- **GitHub GraphQL API** (client-side, no backend)

## Build & deploy

```sh
bun run build
```

Produces a static `dist/` folder. Currently deployed to GitHub Pages.
