#!/usr/bin/env bash
# Cut a DocsOps GitHub release by pushing tag vX.Y.Z (triggers .github/workflows/release.yml).
#
# Usage:
#   ./scripts/release/cut-release.sh 0.1.0
#   ./scripts/release/cut-release.sh v0.1.0 --overwrite
#   ./scripts/release/cut-release.sh 0.1.0 --overwrite --watch
#
# New release (default): fails if the tag or GitHub release already exists.
# --overwrite: deletes the GitHub release (if any), force-moves the tag to HEAD, force-pushes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

VERSION_RAW=""
OVERWRITE=0
WATCH=0
ALLOW_DIRTY=0

usage() {
  cat <<'EOF'
Usage: cut-release.sh <version> [options]

  <version>           SemVer with or without leading v (e.g. 0.1.0 or v0.1.0)

Options:
  --overwrite, -f     Replace existing tag and GitHub release (force-push tag)
  --watch             After push, wait for the Release workflow on this tag
  --allow-dirty       Allow uncommitted changes (default: require clean tree)
  -h, --help          Show this help

Examples:
  ./scripts/release/cut-release.sh 0.2.0
  ./scripts/release/cut-release.sh 0.1.0 --overwrite --watch

  make release VERSION=0.2.0
  make release-overwrite VERSION=0.1.0
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

log() {
  echo "→ $*"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    --overwrite | -f)
      OVERWRITE=1
      shift
      ;;
    --watch)
      WATCH=1
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    -*)
      die "unknown option: $1 (see --help)"
      ;;
    *)
      if [[ -n "$VERSION_RAW" ]]; then
        die "unexpected argument: $1 (version already set to ${VERSION_RAW})"
      fi
      VERSION_RAW="$1"
      shift
      ;;
  esac
done

[[ -n "$VERSION_RAW" ]] || die "version required (see --help)"

# Normalize to X.Y.Z and tag vX.Y.Z
VERSION="${VERSION_RAW#v}"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  die "version must be SemVer X.Y.Z (got: ${VERSION_RAW})"
fi
TAG="v${VERSION}"

command -v git >/dev/null || die "git not found"
command -v gh >/dev/null || die "gh not found (GitHub CLI)"
command -v node >/dev/null || die "node not found"

PKG_VERSION="$(node -p "require('${ROOT}/package.json').version")"
if [[ "$PKG_VERSION" != "$VERSION" ]]; then
  die "Root package.json version is ${PKG_VERSION}, expected ${VERSION}. Bump package.json (and content/releases) before cutting the release."
fi

if [[ "$ALLOW_DIRTY" -ne 1 ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    die "working tree is dirty; commit or stash first (or pass --allow-dirty)"
  fi
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  die "releases must be cut from main (current branch: ${BRANCH})"
fi

HEAD_SHA="$(git rev-parse HEAD)"
HEAD_SHORT="$(git rev-parse --short HEAD)"

REMOTE_TAG_SHA=""
if REMOTE_TAG_SHA="$(git ls-remote --tags origin "refs/tags/${TAG}" 2>/dev/null | awk '{print $1}' | head -n1)"; then
  :
fi
REMOTE_TAG_SHA="${REMOTE_TAG_SHA:-}"

RELEASE_EXISTS=0
if gh release view "$TAG" >/dev/null 2>&1; then
  RELEASE_EXISTS=1
fi

LOCAL_TAG_EXISTS=0
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  LOCAL_TAG_EXISTS=1
fi

if [[ ! -f "${ROOT}/content/releases/${VERSION}.md" ]]; then
  echo "warning: missing content/releases/${VERSION}.md (What's new / image notes)" >&2
fi

if [[ "$OVERWRITE" -eq 0 ]]; then
  if [[ -n "$REMOTE_TAG_SHA" ]]; then
    die "remote tag ${TAG} already exists (${REMOTE_TAG_SHA:0:7}). Use --overwrite to replace it."
  fi
  if [[ "$LOCAL_TAG_EXISTS" -eq 1 ]]; then
    die "local tag ${TAG} already exists. Use --overwrite to replace it."
  fi
  if [[ "$RELEASE_EXISTS" -eq 1 ]]; then
    die "GitHub release ${TAG} already exists. Use --overwrite to replace it."
  fi

  log "Creating annotated tag ${TAG} at ${HEAD_SHORT}"
  git tag -a "$TAG" -m "$TAG"
  log "Pushing ${TAG} to origin (starts Release workflow)"
  git push origin "refs/tags/${TAG}"
else
  log "Overwrite mode: ${TAG} → ${HEAD_SHORT}"
  if [[ "$RELEASE_EXISTS" -eq 1 ]]; then
    log "Deleting GitHub release ${TAG}"
    gh release delete "$TAG" --yes
  else
    log "No GitHub release ${TAG} to delete"
  fi
  log "Force-updating local tag ${TAG}"
  git tag -f -a "$TAG" -m "$TAG" "$HEAD_SHA"
  log "Force-pushing ${TAG} to origin (starts Release workflow)"
  git push origin "refs/tags/${TAG}" --force
fi

echo
echo "Tag ${TAG} points at ${HEAD_SHORT} (${HEAD_SHA})"
echo "Workflow: Release (push tag ${TAG})"
echo "  gh run list --workflow=release.yml --limit 3"
echo "  gh release view ${TAG}"

if [[ "$WATCH" -eq 1 ]]; then
  log "Waiting for Release workflow…"
  # Tag push can take a moment to appear as a run.
  RUN_ID=""
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    RUN_ID="$(gh run list --workflow=release.yml --branch "$TAG" --limit 1 --json databaseId,status,headSha \
      --jq ".[] | select(.headSha==\"${HEAD_SHA}\") | .databaseId" 2>/dev/null | head -n1 || true)"
    if [[ -n "$RUN_ID" ]]; then
      break
    fi
    sleep 3
  done
  [[ -n "$RUN_ID" ]] || die "could not find Release workflow run for ${TAG} @ ${HEAD_SHORT}"
  log "Watching run ${RUN_ID}"
  gh run watch "$RUN_ID" --exit-status
  gh release view "$TAG"
fi
