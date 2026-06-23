#!/usr/bin/env bash
# DocsOps production uninstall bootstrap (curl | sudo bash).
set -euo pipefail

DOCSOPS_INSTALL_DIR="${DOCSOPS_INSTALL_DIR:-/opt/docsops}"
DOCSOPS_GITHUB_REPO="${DOCSOPS_GITHUB_REPO:-bjkawecki/docs-ops}"

die() {
  echo "Fehler: $*" >&2
  exit 1
}

resolve_uninstall_prod() {
  local script_path root
  if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
    script_path="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")"
    root="$(dirname "$script_path")"
    if [[ -f "${root}/scripts/uninstall-prod.sh" ]]; then
      echo "${root}/scripts/uninstall-prod.sh"
      return 0
    fi
  fi
  if [[ -f "${DOCSOPS_INSTALL_DIR}/scripts/uninstall-prod.sh" ]]; then
    echo "${DOCSOPS_INSTALL_DIR}/scripts/uninstall-prod.sh"
    return 0
  fi
  return 1
}

download_uninstall_prod() {
  local version tmpdir
  version="${DOCSOPS_VERSION:-}"
  if [[ -z "$version" ]]; then
    version="$(curl -fsSL "https://api.github.com/repos/${DOCSOPS_GITHUB_REPO}/releases/latest" \
      | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1)"
  fi
  [[ -n "$version" ]] || die "DOCSOPS_VERSION fehlt und kein GitHub-Release ermittelbar."
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "$tmpdir"' RETURN
  curl -fsSL \
    "https://github.com/${DOCSOPS_GITHUB_REPO}/releases/download/${version}/docsops-${version}.tar.gz" \
    -o "${tmpdir}/bundle.tar.gz"
  tar -xzf "${tmpdir}/bundle.tar.gz" -C "$tmpdir"
  if [[ -f "${tmpdir}/docsops-${version}/scripts/uninstall-prod.sh" ]]; then
    echo "${tmpdir}/docsops-${version}/scripts/uninstall-prod.sh"
    return 0
  fi
  die "Release-Bundle ${version} enthält kein uninstall-prod.sh – DocsOps-Version zu alt?"
}

main() {
  local target
  if target="$(resolve_uninstall_prod)"; then
    exec "$target" "$@"
  fi
  if target="$(download_uninstall_prod)"; then
    exec "$target" "$@"
  fi
  die "uninstall-prod.sh nicht gefunden."
}

main "$@"
