# Pulling Upstream Changes into plugin-refactor

## One-time setup

```bash
# Add the upstream remote (only needed once)
git remote add upstream https://github.com/inventree/InvenTree.git
```

## Each time you want to sync

```bash
# 1. Make sure working tree is clean
git status

# 2. Stash any uncommitted work
git stash push -m "temp before upstream sync"

# 3. Fetch latest from upstream
git fetch upstream master

# 4. Merge upstream/master into your branch
git merge upstream/master

# 5. Resolve conflicts — only .po translation files will conflict
#    Take upstream's version for all locale files:
git checkout --theirs src/frontend/src/locales/*/messages.po
git add src/frontend/src/locales/*/messages.po

# 6. Commit the merge
git commit -m "merge upstream/master"

# 7. Restore your stashed work
git stash pop

# 8. Push to your fork
git push origin plugin-refactor
```

## What to expect

- **Zero code conflicts.** All Python, TypeScript, and JavaScript files merge cleanly.
- **~38 translation files** (`src/frontend/src/locales/*/messages.po`) will conflict every time. These are Crowdin auto-updates — just take upstream's version.
- Your `plugins/` directory is never touched because upstream doesn't have one.
- Core InvenTree files you've modified (`part/`, `stock/`, `order/`, `common/`, `router.tsx`, etc.) have always auto-merged cleanly in testing.

## If something goes wrong

```bash
# Abort the merge and go back to your pre-merge state
git merge --abort
git stash pop
```
