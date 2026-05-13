# gh-traffic-stats

![Clones](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/gtapps/gh-traffic-stats/_gh_traffic_stats/.github/badges/clones.json)
![Views](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/gtapps/gh-traffic-stats/_gh_traffic_stats/.github/badges/views.json)
[![gh-traffic-stats](https://github.com/gtapps/gh-traffic-stats/actions/workflows/gh-traffic-stats.yml/badge.svg)](https://github.com/gtapps/gh-traffic-stats/actions/workflows/gh-traffic-stats.yml)
[![Test](https://github.com/gtapps/gh-traffic-stats/actions/workflows/test.yml/badge.svg)](https://github.com/gtapps/gh-traffic-stats/actions/workflows/test.yml)

Permanent clones and views badges for your GitHub repo using Github Actions workflow on a cron.

## Problem

GitHub's Official [Traffic API](https://docs.github.com/en/rest/metrics/traffic) only exposes the last 14 days of clones and views. Anything older is gone.

## Solution

A GitHub Actions workflow runs daily inside your repo, saves each day's clone and view counts, and keeps your README badges showing the all-time totals. Add the workflow below to your repo — that's it.

The badges above are live; this repo runs its own action.

## Setup

**1. Add a Personal Access Token.** The GitHub Traffic API needs push-equivalent access, which the default `GITHUB_TOKEN` lacks. Create a [fine-grained PAT](https://github.com/settings/personal-access-tokens) scoped to your repo only, with **Repository permissions → Administration: Read**.

**2. Save it as a Repository Secret.** In GitHub under Repo → Settings → Secrets and variables → Actions → **Repository secrets** → New repository secret, named exactly `GH_TRAFFIC_STATS_TOKEN` (not an Environment or Organization secret).

> **Note:** A [classic PAT](https://github.com/settings/tokens) with `repo` scope also works but grants access to all your repos — fine-grained is preferred.

**3. Add the workflow to your repo.**

Create `.github/workflows/gh-traffic-stats.yml`:

```yaml
name: gh-traffic-stats
on:
  schedule:
    - cron: "30 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: gh-traffic-stats
  cancel-in-progress: false

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: gtapps/gh-traffic-stats@v1
        with:
          token: ${{ secrets.GH_TRAFFIC_STATS_TOKEN }}
```

The action automatically creates the `_gh_traffic_stats` orphan branch on first run if it doesn't exist yet. No manual branch setup needed.

**4. Trigger the first run.** Repo → Actions → gh-traffic-stats → Run workflow → Run workflow.

> **Note:** Pick **main** in the "Use workflow from" dropdown — the workflow only lives there.

**5. Add the badges to your README.**

Replace `<OWNER>` and `<REPO>` with your GitHub username and repository name.

```markdown
![Clones](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/<OWNER>/<REPO>/_gh_traffic_stats/.github/badges/clones.json)
![Views](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/<OWNER>/<REPO>/_gh_traffic_stats/.github/badges/views.json)
```

Done. Every day the cron runs and the badges stay current.

## Customization

All optional. Configure via `with:` inputs on the action step.

| Input | Default | Description |
|---|---|---|
| `metrics` | `clones,views` | Comma-separated metrics to track. Set to `clones` or `views` for one metric only. |
| `badges-branch` | `_gh_traffic_stats` | Orphan branch that holds badge data. |
| `badges-dir` | `.github/badges` | Path within the badges branch where JSON files live. |
| `clones-label` | `Clones` | Shields.io label for the clones badge. |
| `clones-color` | `blue` | Shields.io color for the clones badge. Any [shields.io color](https://shields.io/badges) works. |
| `views-label` | `Views` | Shields.io label for the views badge. |
| `views-color` | `green` | Shields.io color for the views badge. |

Example with custom labels:

```yaml
      - uses: gtapps/gh-traffic-stats@v1
        with:
          token: ${{ secrets.GH_TRAFFIC_STATS_TOKEN }}
          clones-label: 'Total clones'
          clones-color: 'orange'
          views-label: 'Total views'
          views-color: 'purple'
```

## Pre-tracking totals (baseline)

If your repo had clones or views before you installed this, the badges would otherwise start from 0. After the first workflow run lands the seed files on `_gh_traffic_stats`, edit `clones-history.json` and/or `views-history.json` and set `baseline` / `baseline_uniques`:

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
