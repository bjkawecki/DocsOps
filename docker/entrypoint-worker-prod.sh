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

exec node dist/src/entrypoints/worker.js
