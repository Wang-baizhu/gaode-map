#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

fail=0

echo "[check] forbidden tracked files"
forbidden_regex='(^|/)(__pycache__/|\.pytest_cache/|\.playwright-cli/|.*\.pyc$|.*\.bak$|script_0\.js$)'
tracked_forbidden=""
while IFS= read -r f; do
  [[ -e "$f" ]] || continue
  if echo "$f" | rg -q "$forbidden_regex" -S; then
    tracked_forbidden+="$f"$'\n'
  fi
done < <(git ls-files)
if [[ -n "$tracked_forbidden" ]]; then
  echo "Forbidden tracked files found:"
  echo "$tracked_forbidden"
  fail=1
fi

echo "[check] deprecated dirs must not exist"
for dir in \
  modules/analysis \
  modules/analysis_service \
  modules/h3_service \
  modules/poi_service \
  modules/generated_charts \
  modules/isochrone_service \
  modules/grid_h3 \
  modules/road_syntax \
  modules/export_bundle \
  modules/gaode_service
do
  if [[ -d "$dir" ]]; then
    echo "Deprecated dir still exists: $dir"
    fail=1
  fi
done

echo "[check] legacy analysis entry must not exist"
for path in \
  templates/analysis.html \
  static/js/analysis
do
  if [[ -e "$path" ]]; then
    echo "Legacy analysis path still exists: $path"
    fail=1
  fi
done

echo "[check] no legacy module import usage"
legacy_import_hits="$(
  rg -n "modules\.(grid_h3|road_syntax|export_bundle|gaode_service|isochrone_service)" \
    --glob '!docs/**' \
    --glob '!**/.venv/**' \
    --glob '!**/__pycache__/**' \
    . || true
)"
if [[ -n "$legacy_import_hits" ]]; then
  echo "Legacy imports still referenced:"
  echo "$legacy_import_hits"
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "repo hygiene check failed"
  exit 1
fi

echo "repo hygiene check passed"
