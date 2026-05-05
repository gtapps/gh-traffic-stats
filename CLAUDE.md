# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

Source files (everything Actions-related lives under `.github/`):

- `.github/update-gh-traffic.mjs` — Node ESM script, no dependencies, requires Node 24+ (uses built-in `fetch`).
- `.github/update-gh-traffic.test.mjs` — `node:test` suite for `formatMessage` and `mergeDaily` (the only pure functions). Integration is covered by `workflow_dispatch`.
- `.github/workflows/gh-traffic-stats.yml` — daily cron (`30 0 * * *` UTC) plus `workflow_dispatch`.
- `.github/workflows/test.yml` — runs `node --test .github/update-gh-traffic.test.mjs` on push and PR.

No `package.json`, no build, no linter. Tests run via `node --test` (built-in, zero deps). Don't add a `package.json` unless genuinely required.

## The two-branch architecture

This is the single most important thing to understand before editing anything:

- `main` holds the script and workflow. Never holds traffic data.
- `_gh_traffic_stats` is an **orphan branch** (no shared history with `main`). It holds *only* `.github/badges/{clones,views}-history.json` and `.github/badges/{clones,views}.json`. It never merges anywhere.

The workflow reflects this with two `actions/checkout@v6` steps: one for `main` (default), one for `_gh_traffic_stats` into `badges-data/`. The script reads/writes `BADGES_DIR` which points into the second checkout. Commits land on `_gh_traffic_stats`, not `main`.

When testing locally, mirror this with `git worktree add /tmp/badges _gh_traffic_stats` — see README "Local testing".

## How the upsert works

GitHub's Traffic API returns the rolling last 14 days. The exported `mergeDaily(existing, apiSeries)` builds a map keyed by `timestamp`, overwrites entries from the API response, sorts, and returns it. This is **upsert by timestamp**, not append — important because:

- The current day's count keeps incrementing through the day, so re-running on the same day must overwrite, not duplicate.
- Across runs >14 days apart, old entries are preserved (they aren't in the API response, so the map keeps them); within 14 days they get refreshed with the latest API numbers.

`history.total = baseline + sum(daily.count)` is recomputed on every run. Don't write to `total` / `total_uniques` directly — they're derived. `baseline` / `baseline_uniques` are the only knobs for pre-tracking history.

## Script structure quirks

- `// @ts-check` is on. Keep the `History`, `DailyEntry`, and `MetricSpec` JSDoc typedefs accurate when changing shapes.
- All side-effecting code lives inside `if (isMain) { ... }` so the file is importable by tests. Env reads, `mkdirSync`, and `updateMetric` invocations must stay inside that guard.
- Use `requireEnv(value, name)` for required env vars — TS doesn't narrow `process.env.X` through guard blocks into closures, but `requireEnv` returns `string` cleanly.

## Auto-seeding

If `historyPath` doesn't exist (e.g. fresh empty `_gh_traffic_stats` branch), the script writes a fresh history with `baseline: 0`, `baseline_uniques: 0`, `baseline_date: <today>`, `daily: []`. It also `mkdirSync`s `BADGES_DIR` recursively. This means the orphan branch can be created empty (`git commit --allow-empty`) and the first workflow run seeds the data files itself. Don't reintroduce a hard-fail when the file is missing.

## Adding a new metric

The `METRICS` registry at the top of `.github/update-gh-traffic.mjs` defines each metric. Each entry needs `apiPath`, `arrayKey`, `historyFile`, `badgeFile`, plus default label/color and the env var names that override them. The GitHub Traffic API only exposes clones and views, so adding a third metric means a different API endpoint — check it returns the same `[{ timestamp, count, uniques }]` shape, otherwise the upsert loop needs adjusting.

History files for new metrics auto-seed on first run, so no manual file creation needed on `_gh_traffic_stats`.

## Local run

```bash
git worktree add /tmp/badges _gh_traffic_stats
GH_TOKEN=<PAT-with-repo-scope> \
REPO=<owner>/<repo> \
BADGES_DIR=/tmp/badges/.github/badges \
METRICS=clones,views \
node .github/update-gh-traffic.mjs
```

`GITHUB_TOKEN` is **not** sufficient — Traffic API needs push-level access. Use a fine-grained PAT scoped to the target repo with **Administration: Read** (preferred), or a classic PAT with `repo` scope as fallback. The workflow consumes it as `secrets.GH_TRAFFIC_STATS_TOKEN`.

## Self-hosting note

This repo dogfoods itself: the badges in `README.md` point at this repo's own `_gh_traffic_stats` branch. If you change the badge JSON schema or filename, update the README URLs too.
