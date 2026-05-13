# Contributing

## Local testing

To run the script against your own repo without involving GitHub Actions:

```bash
# Check out the orphan branch in a sibling worktree
git worktree add /tmp/badges _gh_traffic_stats

# Run the script with the env vars the workflow normally provides
GH_TOKEN=<your-pat> \
REPO=<owner>/<repo> \
BADGES_DIR=/tmp/badges/.github/badges \
METRICS=clones,views \
node update-gh-traffic.mjs

# Inspect the diff
git -C /tmp/badges diff
```

If everything works, you'll see updated `*-history.json` and `*.json` files in `/tmp/badges/.github/badges/`. The script auto-seeds those files if they don't exist yet, so this also works against a fresh empty `_gh_traffic_stats` branch.

Don't commit unless you want to push the manual run; the cron will pick up the same data on its next cycle.

## Project layout

- `action.yml` — composite action manifest; the entry point for `uses: gtapps/gh-traffic-stats@v1`
- `update-gh-traffic.mjs` — Node ESM script, no dependencies, requires Node 24+
- `update-gh-traffic.test.mjs` — `node:test` suite for the pure functions
- `.github/workflows/gh-traffic-stats.yml` — daily cron (`30 0 * * *` UTC) plus `workflow_dispatch`; dogfoods the action via `uses: ./`
- `.github/workflows/test.yml` — runs `node --test update-gh-traffic.test.mjs` on push and PR
- `_gh_traffic_stats` (orphan branch, not visible from `main`) — holds `.github/badges/{clones,views}-history.json` and `.github/badges/{clones,views}.json`

There is no `package.json`, no build, no test suite framework, no linter. Keep it that way unless a task genuinely requires otherwise.
