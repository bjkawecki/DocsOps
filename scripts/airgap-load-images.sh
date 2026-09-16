#!/usr/bin/env bash
# Load DocsOps images previously saved with airgap-save-images.sh.
#
# Usage:
#   ./scripts/airgap-load-images.sh /path/to/docsops-images-v0.1.0.tar
set -euo pipefail

IN="${1:-}"
if [[ -z "$IN" || ! -f "$IN" ]]; then
  echo "Usage: $0 /path/to/docsops-images-vX.Y.Z.tar" >&2
  exit 1
fi

echo "Loading images from ${IN} …"
docker load -i "$IN"
echo "Done. Install/update with DOCSOPS_SKIP_IMAGE_PULL=1 (and DOCSOPS_BUNDLE_PATH if needed)."
echo "See docs/plan/Runbook-Air-Gap-Install.md."
