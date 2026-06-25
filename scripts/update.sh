#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
# shellcheck source=install/lib/common.sh
source "${SCRIPT_DIR}/install/lib/common.sh"

usage() {
  cat <<EOF
Usage: update.sh [VERSION]

Update an existing DocsOps production install to a new release.

Examples:
  sudo ./scripts/update.sh
  sudo ./scripts/update.sh v0.2.0

Without VERSION, uses the latest GitHub release. Pass a tag to pin a specific version.

Downloads the release bundle, replaces deploy files under ${DOCSOPS_INSTALL_DIR},
updates DOCSOPS_VERSION in ${DOCSOPS_ENV_FILE}, then runs docker compose pull && up -d.

Environment (local testing):
  DOCSOPS_BUNDLE_PATH       Path to docsops-vX.Y.Z.tar.gz (skip GitHub download)
  DOCSOPS_SKIP_IMAGE_PULL=1 Skip docker compose pull (use local images)

Rollback: restore a backup of ${DOCSOPS_ENV_FILE} and the previous bundle tarball,
then re-run update.sh with the previous version tag.
EOF
}

main() {
  local version="${1:-}"
  if [[ "$version" == "-h" || "$version" == "--help" ]]; then
    usage
    exit 0
  fi

  require_root
  export DOCSOPS_INSTALL_STAGE_TOTAL=3
  INSTALL_STAGE_N=0
  resolve_install_dir || die "Keine Installation unter ${DOCSOPS_INSTALL_DIR} gefunden."
  [[ -f "$DOCSOPS_ENV_FILE" ]] || die "${DOCSOPS_ENV_FILE} fehlt – zuerst installieren."

  version="$(resolve_release_version "$version")"
  log "Ziel-Release: ${version}"

  install_release_bundle_to_install_dir "$version"
  patch_env_version "$version"
  load_existing_env_optional

  install_stage "Container-Images aktualisieren"
  compose_up_prod

  install_stage "Bereitschaft prüfen"
  wait_for_health

  install_stage "Abschluss"
  log "Update auf ${version} abgeschlossen."
}

main "$@"
