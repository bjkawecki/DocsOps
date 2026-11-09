#!/usr/bin/env bash
# Fail if forbidden typography / arrow constructions appear in product trees.
# Cursor rule: .cursor/rules/forbidden-typography.mdc
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# U+2192 RIGHTWARDS ARROW
ARROW=$'\u2192'
# U+2014 EM DASH
EM_DASH=$'\u2014'

# Full product/source trees: unicode glyphs only (ASCII -> stays allowed in code comments/tests).
CODE_PATHS=(
  apps/frontend/src
  apps/backend/src
  apps/landing/src
  content/releases
)

CODE_GLOBS=(
  --glob '*.ts'
  --glob '*.tsx'
  --glob '*.js'
  --glob '*.jsx'
  --glob '*.mjs'
  --glob '*.cjs'
  --glob '*.json'
  --glob '*.md'
  --glob '*.css'
)

# User-facing prose: also ban ASCII arrow constructions (-> and "A > B" path style).
PROSE_PATHS=(
  apps/frontend/src/i18n
  apps/landing/src/content
  content/releases
)

PROSE_GLOBS=(
  --glob '*.ts'
  --glob '*.tsx'
  --glob '*.json'
  --glob '*.md'
)

fail=0

scan() {
  local label="$1"
  local needle="$2"
  shift 2
  local hits
  if hits="$(rg -n --hidden --no-ignore-vcs "$@" -e "$needle" 2>/dev/null || true)" \
    && [[ -n "$hits" ]]; then
    echo "Forbidden character check failed: ${label} found:"
    echo "$hits"
    fail=1
  fi
}

scan "rightwards arrow → (U+2192); rephrase without arrows" "$ARROW" \
  "${CODE_GLOBS[@]}" "${CODE_PATHS[@]}"
scan "em dash — (U+2014); use en dash – or rephrase" "$EM_DASH" \
  "${CODE_GLOBS[@]}" "${CODE_PATHS[@]}"

# ASCII arrow used as path/implication in user-facing copy
scan "ASCII arrow '->' in user-facing copy; rephrase (e.g. 'under Admin, open Destinations')" \
  '->' "${PROSE_GLOBS[@]}" "${PROSE_PATHS[@]}"

# Breadcrumb-style "Word > Word" (letter/digit before and after ' > ')
scan "path separator ' > ' in user-facing copy; rephrase without '>'" \
  '[[:alnum:]] > [[:alnum:]]' "${PROSE_GLOBS[@]}" "${PROSE_PATHS[@]}"

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "Forbidden character check passed."
