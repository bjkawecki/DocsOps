#!/bin/sh
set -e

if [ -z "${APP_VERSION:-}" ] && [ -f /APP_VERSION ]; then
  APP_VERSION="$(cat /APP_VERSION)"
  export APP_VERSION
fi

if [ -z "${APP_VERSION:-}" ]; then
  echo "ERROR: APP_VERSION is not set (expected from image build)" >&2
  exit 1
fi

TYPST_CMD="${TYPST_BIN:-typst}"
if ! command -v "$TYPST_CMD" >/dev/null 2>&1; then
  echo "ERROR: Typst binary not found (\"$TYPST_CMD\"). Rebuild the docsops-worker image or set TYPST_BIN." >&2
  exit 1
fi

exec node dist/src/entrypoints/worker.js
