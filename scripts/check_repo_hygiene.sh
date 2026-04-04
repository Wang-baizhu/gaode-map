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

echo "[check] forbidden runtime files must not exist in worktree"
runtime_forbidden="$(
  find . \
    -path './.git' -prune -o \
    -path './.venv' -prune -o \
    \( \
      -type d -name '__pycache__' -o \
      -type d -name '.pytest_cache' -o \
      -type d -name '.playwright-cli' -o \
      -type f -name '*.pyc' -o \
      -type f -name '*.bak' \
    \) -print
)"
if [[ -n "$runtime_forbidden" ]]; then
  writable_runtime_forbidden=""
  readonly_runtime_forbidden=""
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    if [[ -w "$path" || ( -d "$path" && -w "$path" ) ]]; then
      writable_runtime_forbidden+="$path"$'\n'
    else
      readonly_runtime_forbidden+="$path"$'\n'
    fi
  done <<< "$runtime_forbidden"
  if [[ -n "$writable_runtime_forbidden" ]]; then
    echo "Forbidden runtime files found:"
    echo "$writable_runtime_forbidden"
    fail=1
  fi
  if [[ -n "$readonly_runtime_forbidden" ]]; then
    echo "Warning: forbidden runtime files exist but are not writable by current user:"
    echo "$readonly_runtime_forbidden"
    echo "Please clean them with elevated privileges if needed."
  fi
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

echo "[check] hotspot file size thresholds"
while IFS='|' read -r path limit; do
  [[ -f "$path" ]] || continue
  line_count="$(wc -l < "$path")"
  line_count="${line_count//[[:space:]]/}"
  if (( line_count > limit )); then
    echo "Hotspot file exceeds threshold: $path ($line_count > $limit)"
    fail=1
  fi
done <<'EOF'
router/domains/isochrone.py|120
modules/population/facade.py|500
modules/export/builder.py|750
modules/road/core.py|900
modules/h3/analysis.py|320
store/history_repo.py|220
router/domains/road.py|120
main.py|180
EOF

echo "[check] history router must delegate via service"
if [[ -f "modules/history/service.py" ]]; then
  history_router_direct_repo_calls="$(
    rg -n "history_repo\\.(create_record|get_list|get_detail|get_pois|delete_record)\\(" \
      router/domains/history.py || true
  )"
  if [[ -n "$history_router_direct_repo_calls" ]]; then
    echo "History router bypasses service layer:"
    echo "$history_router_direct_repo_calls"
    fail=1
  fi
fi

if [[ "$fail" -ne 0 ]]; then
  echo "repo hygiene check failed"
  exit 1
fi

echo "repo hygiene check passed"
