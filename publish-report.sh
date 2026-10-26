#!/usr/bin/env bash
set -euo pipefail

# Where your tests already wrote Allure results
RESULTS_DIR="allure-results"
REPORT_DIR="allure-report"

REPO_URL=$(git remote get-url origin)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

if [ ! -d "$RESULTS_DIR" ] || [ -z "$(ls -A "$RESULTS_DIR")" ]; then
  echo "No Allure results found in $RESULTS_DIR. Run your tests first."
  exit 1
fi

# 1. Fetch the existing gh-pages branch (or create it on first run)
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git clone --branch gh-pages --depth 1 "$REPO_URL" "$WORK"
else
  git clone "$REPO_URL" "$WORK"
  git -C "$WORK" checkout --orphan gh-pages
  git -C "$WORK" rm -rf . >/dev/null 2>&1 || true
fi

# 2. Restore trend history from the previous report
if [ -d "$WORK/history" ]; then
  rm -rf "$RESULTS_DIR/history"
  cp -r "$WORK/history" "$RESULTS_DIR/history"
fi

# 3. Generate the report from the existing results
allure generate "$RESULTS_DIR" -o "$REPORT_DIR" --clean

# 4. Replace branch contents with the new report and push
find "$WORK" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -r "$REPORT_DIR"/. "$WORK"/
touch "$WORK/.nojekyll"

git -C "$WORK" add -A
git -C "$WORK" commit -m "Allure report $(date -u '+%F %T')" || echo "Nothing to commit"
git -C "$WORK" push origin gh-pages

echo "Done: report will be live shortly on GitHub Pages"