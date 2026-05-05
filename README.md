# gh-traffic-stats

![Clones](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/gtapps/gh-traffic-stats/_stats_badges/.github/badges/clones.json)
![Views](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/gtapps/gh-traffic-stats/_stats_badges/.github/badges/views.json)
[![Traffic stats](https://github.com/gtapps/gh-traffic-stats/actions/workflows/traffic-stats.yml/badge.svg)](https://github.com/gtapps/gh-traffic-stats/actions/workflows/traffic-stats.yml)
[![Test](https://github.com/gtapps/gh-traffic-stats/actions/workflows/test.yml/badge.svg)](https://github.com/gtapps/gh-traffic-stats/actions/workflows/test.yml)

Permanent clones and views badges for your GitHub repo using Github Actions workflow on a cron.

## Problem

GitHub's Official [Traffic API](https://docs.github.com/en/rest/metrics/traffic) only exposes the last 14 days of clones and views. Anything older is gone.

## Solution

A GitHub Actions workflow runs daily inside your repo, saves each day's clone and view counts, and keeps your README badges showing the all-time totals. Copy two files into your repo — `update-traffic.mjs` and `.github/workflows/traffic-stats.yml` — and you're done.

The badges above are live, this repo runs its own script.

## Setup

**1. Add a Personal Access Token.** The GitHub Traffic API needs push-equivalent access, which the default `GITHUB_TOKEN` lacks. Create a [fine-grained PAT](https://github.com/settings/personal-access-tokens) scoped to this repo only, with **Repository permissions → Administration: Read**. Save it under Repo → Settings → Secrets and variables → Actions → **Repository secrets** → New repository secret, named exactly `TRAFFIC_TOKEN` (not an Environment or Organization secret).

> **Note:** A [classic PAT](https://github.com/settings/tokens) with `repo` scope also works but grants access to all your repos — fine-grained is preferred.

**2. Create the orphan branch.** It starts empty — your `main` files are untouched.

```bash
git switch --orphan _stats_badges
git commit --allow-empty -m "init traffic-stats"
git push -u origin _stats_badges
git switch main
```

The script auto-seeds the history files on first run, so the branch can stay empty until then.

**3. Copy the two files into your repo.**

```bash
curl -sSL https://raw.githubusercontent.com/gtapps/gh-traffic-stats/main/update-traffic.mjs -o update-traffic.mjs
mkdir -p .github/workflows
curl -sSL https://raw.githubusercontent.com/gtapps/gh-traffic-stats/main/.github/workflows/traffic-stats.yml -o .github/workflows/traffic-stats.yml
git add update-traffic.mjs .github/workflows/traffic-stats.yml
git commit -m "add gh-traffic-stats"
git push
```

**4. Trigger the first run in Github.** Repo → Actions → Traffic stats → Run workflow → Run workflow.

> **Note:** Pick **main** in the "Use workflow from" dropdown — the workflow only lives there.

**5. Add the badges to your README.**

```markdown
![Clones](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/<OWNER>/<REPO>/_stats_badges/.github/badges/clones.json)
![Views](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/<OWNER>/<REPO>/_stats_badges/.github/badges/views.json)
```

Done. Every day the cron runs and the badges stay current.

## Customization

All optional. All edited in `.github/workflows/traffic-stats.yml`.

- **Schedule.** Default is `30 0 * * *` (daily at 00:30 UTC). Change the `cron:` line.
- **Labels and colors.** Set `CLONES_LABEL`, `CLONES_COLOR`, `VIEWS_LABEL`, `VIEWS_COLOR` in the `env:` block. Defaults: `Clones`/`blue`, `Views`/`green`. Any [shields.io color](https://shields.io/badges) works.
- **One metric only.** Set `METRICS: clones` or `METRICS: views`.

## Pre-tracking totals (baseline)

If your repo had clones or views before you installed this, the badges would otherwise start from 0. After the first workflow run lands the seed files on `_stats_badges`, edit `clones-history.json` and/or `views-history.json` and set `baseline` / `baseline_uniques`:

```json
{
  "baseline": 6210,
  "baseline_uniques": 4100,
  "baseline_date": "2026-05-02",
  "daily": [],
  "total": 0,
  "total_uniques": 0
}
```

`total` is recomputed every run as `baseline + sum(daily)`, so you don't need to touch it. `baseline_date` records the cutoff before which history was captured manually — useful as a lower bound when auditing totals later.

## License

[MIT](LICENSE).
