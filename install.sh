#!/usr/bin/env bash
set -euo pipefail

DOCSOPS_INSTALL_DIR="${DOCSOPS_INSTALL_DIR:-/opt/docsops}"
DOCSOPS_REPO="${DOCSOPS_REPO:-https://github.com/bjkawecki/docs-ops.git}"
DOCSOPS_VERSION="${DOCSOPS_VERSION:-main}"

# curl | sudo bash: script on stdin → BASH_SOURCE[0] unset; skip local checkout detection.
SCRIPT_DIR=""
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")"
  SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
fi

log() {
  echo "==> $*"
}

die() {
  echo "Fehler: $*" >&2
  exit 1
}

require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    die "Bitte mit sudo ausführen: sudo bash  (oder: curl … | sudo bash)"
  fi
}

# curl | bash: git/curl vor dem Clone; auf der VM oft noch nicht installiert.
ensure_clone_prerequisites() {
  if command -v git >/dev/null 2>&1 && command -v curl >/dev/null 2>&1; then
    return 0
  fi
  log "Installiere git und curl für den Repository-Clone …"
  if [[ -f /etc/debian_version ]]; then
    apt-get update
    apt-get install -y git curl ca-certificates
  elif [[ -f /etc/fedora-release ]] || grep -qE '^ID="?(fedora|rhel|centos|almalinux|rocky)"?' /etc/os-release 2>/dev/null; then
    if command -v dnf >/dev/null 2>&1; then
      dnf install -y git curl
    else
      die "dnf fehlt – bitte git und curl manuell installieren."
    fi
  elif [[ -f /etc/arch-release ]]; then
    pacman -Sy --noconfirm git curl
  else
    die "Unbekannte Distribution – bitte git und curl installieren."
  fi
}

run_from_checkout() {
  local root="$1"
  shift
  if [[ -f "${root}/docker-compose.prod.yml" && -f "${root}/scripts/install-prod.sh" ]]; then
    export DOCSOPS_INSTALL_DIR="$root"
    exec "${root}/scripts/install-prod.sh" "$@"
  fi
}

clone_or_update() {
  if [[ -d "${DOCSOPS_INSTALL_DIR}/.git" ]]; then
    log "Bestehendes Repository unter ${DOCSOPS_INSTALL_DIR} – aktualisiere (${DOCSOPS_VERSION})"
    git -C "$DOCSOPS_INSTALL_DIR" fetch --depth 1 origin "$DOCSOPS_VERSION" 2>/dev/null \
      || git -C "$DOCSOPS_INSTALL_DIR" fetch origin
    git -C "$DOCSOPS_INSTALL_DIR" checkout "$DOCSOPS_VERSION"
    git -C "$DOCSOPS_INSTALL_DIR" pull --ff-only 2>/dev/null || true
  else
    log "Klone ${DOCSOPS_REPO} (${DOCSOPS_VERSION}) nach ${DOCSOPS_INSTALL_DIR}"
    install -d "$(dirname "$DOCSOPS_INSTALL_DIR")"
    git clone --depth 1 --branch "$DOCSOPS_VERSION" "$DOCSOPS_REPO" "$DOCSOPS_INSTALL_DIR"
  fi
}

# Only install-prod.sh flags pass through; optional path sets DOCSOPS_INSTALL_DIR.
parse_args() {
  INSTALL_PROD_ARGS=()
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --reconfigure | --install-systemd | -h | --help)
        INSTALL_PROD_ARGS+=("$1")
        shift
        ;;
      -*)
        die "Unbekanntes Argument: $1"
        ;;
      *)
        DOCSOPS_INSTALL_DIR="$1"
        export DOCSOPS_INSTALL_DIR
        shift
        ;;
    esac
  done
}

docsops_raw_url() {
  local path="$1"
  local slug="${DOCSOPS_REPO%.git}"
  slug="${slug#https://github.com/}"
  echo "https://raw.githubusercontent.com/${slug}/${DOCSOPS_VERSION}/${path}"
}

source_install_common() {
  local common_sh="" tmp=""
  if [[ -n "$SCRIPT_DIR" && -f "${SCRIPT_DIR}/scripts/install/lib/common.sh" ]]; then
    common_sh="${SCRIPT_DIR}/scripts/install/lib/common.sh"
  elif [[ -z "$SCRIPT_DIR" ]] && command -v curl >/dev/null 2>&1; then
    # curl | bash: immer von GitHub (nicht aus altem Clone vor clone_or_update)
    tmp="$(mktemp)"
    if curl -fsSL "$(docsops_raw_url scripts/install/lib/common.sh)" -o "$tmp"; then
      common_sh="$tmp"
    else
      rm -f "$tmp"
      die "Install-Hilfen konnten nicht geladen werden. curl oder lokaler Clone erforderlich."
    fi
  elif [[ -f "${DOCSOPS_INSTALL_DIR}/scripts/install/lib/common.sh" ]]; then
    common_sh="${DOCSOPS_INSTALL_DIR}/scripts/install/lib/common.sh"
  elif command -v curl >/dev/null 2>&1; then
    tmp="$(mktemp)"
    if curl -fsSL "$(docsops_raw_url scripts/install/lib/common.sh)" -o "$tmp"; then
      common_sh="$tmp"
    else
      rm -f "$tmp"
      die "Install-Hilfen konnten nicht geladen werden. curl oder lokaler Clone erforderlich."
    fi
  else
    die "curl fehlt – install.sh kann den Disclaimer nicht laden. Bitte curl installieren oder Repository manuell klonen."
  fi
  # shellcheck source=scripts/install/lib/common.sh
  source "$common_sh"
  [[ -n "$tmp" ]] && rm -f "$tmp"
}

bootstrap_confirm_before_clone() {
  export DOCSOPS_BOOTSTRAP_CONFIRM=1
  source_install_common
  print_security_notice
  confirm_or_exit
  export DOCSOPS_INSTALL_CONFIRMED=1
  unset DOCSOPS_BOOTSTRAP_CONFIRM
}

main() {
  require_root
  parse_args "$@"

  # Lokaler Checkout (sudo ./install.sh im Repo) → Disclaimer in install-prod.sh
  if [[ -n "$SCRIPT_DIR" ]]; then
    run_from_checkout "$SCRIPT_DIR" "${INSTALL_PROD_ARGS[@]}"
  fi

  # curl | bash: Disclaimer vor Clone/Download
  bootstrap_confirm_before_clone

  ensure_clone_prerequisites
  clone_or_update
  export DOCSOPS_INSTALL_DIR
  run_from_checkout "$DOCSOPS_INSTALL_DIR" "${INSTALL_PROD_ARGS[@]}"

  die "install-prod.sh nicht gefunden unter ${DOCSOPS_INSTALL_DIR}"
}

main "$@"
