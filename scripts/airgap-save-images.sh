#!/usr/bin/env bash
# Save DocsOps release images (+ base images) for air-gapped transfer.
# Run on a machine with registry access after: docker compose pull (or install).
#
# Usage:
#   DOCSOPS_VERSION=v0.1.0 ./scripts/airgap-save-images.sh /path/to/docsops-images-v0.1.0.tar
#   DOCSOPS_VERSION=v0.1.0 DOCSOPS_IMAGE_PREFIX=ghcr.io/bjkawecki ./scripts/airgap-save-images.sh ./images.tar
#
# Then transfer the tar + release bundle to the offline host and run airgap-load-images.sh.
set -euo pipefail

OUT="${1:-}"
VERSION="${DOCSOPS_VERSION:-}"
PREFIX="${DOCSOPS_IMAGE_PREFIX:-ghcr.io/bjkawecki}"

if [[ -z "$OUT" ]]; then
  echo "Usage: DOCSOPS_VERSION=vX.Y.Z $0 /path/to/docsops-images-vX.Y.Z.tar" >&2
  exit 1
fi
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "DOCSOPS_VERSION must be a release tag (vX.Y.Z), got: ${VERSION:-<empty>}" >&2
  exit 1
fi

IMAGES=(
  "${PREFIX}/docsops-migrate:${VERSION}"
  "${PREFIX}/docsops-app:${VERSION}"
  "${PREFIX}/docsops-worker:${VERSION}"
  "${PREFIX}/docsops-frontend:${VERSION}"
  "postgres:18-alpine"
  "pgsty/minio:RELEASE.2026-08-04T00-00-00Z"
  "caddy:2-alpine"
)

echo "Saving ${#IMAGES[@]} images to ${OUT} …"
docker save -o "$OUT" "${IMAGES[@]}"
echo "Done. Transfer ${OUT} and the release bundle (docsops-${VERSION}.tar.gz) to the offline host."
echo "Offline: ./scripts/airgap-load-images.sh ${OUT}"
echo "Then: DOCSOPS_SKIP_IMAGE_PULL=1 DOCSOPS_BUNDLE_PATH=… install (see docs/plan/Runbook-Air-Gap-Install.md)."
