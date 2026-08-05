#!/usr/bin/env bash
# Shared DocsOps demo CLI (sourced by docsops-demo / docsops-demo-local after setting DOCSOPS_DEMO_PROFILE).
# shellcheck shell=bash

: "${DOCSOPS_DEMO_PROFILE:?DOCSOPS_DEMO_PROFILE must be set by the entrypoint}"

_DEMO_CLI_FILE="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")"
_DEMO_CLI_DIR="$(cd "$(dirname "${_DEMO_CLI_FILE}")" && pwd)"
DOCSOPS_INSTALL_DIR="${DOCSOPS_INSTALL_DIR:-/opt/docsops}"

_resolve_demo_lib_dir() {
  if [[ -f "${_DEMO_CLI_DIR}/install/lib/common.sh" ]]; then
    echo "${_DEMO_CLI_DIR}"
  elif [[ -f "${DOCSOPS_INSTALL_DIR}/scripts/install/lib/common.sh" ]]; then
    echo "${DOCSOPS_INSTALL_DIR}/scripts"
  else
    return 1
  fi
}

_DEMO_LIB_DIR="$(_resolve_demo_lib_dir)" || true
if [[ -z "${_DEMO_LIB_DIR:-}" ]]; then
  echo "Fehler: Install-Libs fehlen (scripts/install/lib). Bundle unter ${DOCSOPS_INSTALL_DIR} prüfen." >&2
  exit 1
fi

# shellcheck source=install/lib/common.sh
source "${_DEMO_LIB_DIR}/install/lib/common.sh"
# shellcheck source=install/lib/demo.sh
source "${_DEMO_LIB_DIR}/install/lib/demo.sh"
apply_demo_profile

RECONFIGURE=0
SKIP_CRON=0
SKIP_HOSTS=0
INSTALL_SYSTEMD=0
VERSION_ARG=""

usage() {
  apply_demo_profile
  if demo_is_public; then
    cat <<EOF
Usage: docsops-demo <command> [options]

Public demo: Landing + Demo-App (HTTPS via Caddy).
  Landing:  https://docsops.de/
  Demo-App: https://demo.docsops.de/

DNS A/AAAA for docsops.de and demo.docsops.de must point at this host. Firewall: 80 and 443.
EOF
  else
    cat <<EOF
Usage: docsops-demo-local <command> [options]

Local VM lab: Landing + Demo-App on one host (HTTP :80).
  Landing:  http://docsops.local/
  Demo-App: http://demo.docsops.local/
EOF
  fi
  cat <<EOF

Commands:
  install     Bundle + env + compose + daily reset cron
  reset       Wipe demo volumes and reseed (also used by cron)
  update      Update to a release (bundle + images), keep demo overlays
  status      Compose status + health checks
  logs        Follow compose logs (optional service name)
  uninstall   Stop stack, remove cron/hosts (optional --keep-data / --keep-config)

Install options:
  --version vX.Y.Z   Pin release (otherwise list GitHub tags / use VERSION file)
  --reconfigure      Rewrite /etc/docsops/docsops.env (new secrets)
  --skip-cron        Do not install daily reset cron
  --skip-hosts       Do not modify /etc/hosts (local profile only)
  --install-systemd  Register docsops.service for reboot autostart
  -h, --help         This help

Environment:
  DOCSOPS_NON_INTERACTIVE=1   No prompts
  DOCSOPS_ASSUME_YES=1        Skip backup-key confirmation
  DOCSOPS_BUNDLE_PATH=…       Local docsops-vX.Y.Z.tar.gz (no GitHub download)
  DOCSOPS_FORCE_BUNDLE=1       Force bundle re-download (update sets this automatically)
  DOCSOPS_SKIP_IMAGE_PULL=1   Use images already on the host (docker load)
  DOCSOPS_LANDING_DIST=…      Path to landing dist if missing from bundle
  DOCSOPS_LAB_HOSTS_IP=…      IP written into /etc/hosts (local; default: primary host IP)
  DOCSOPS_DEMO_RESET_HOUR=4   Cron hour for daily reset (0–23)
EOF
}

parse_install_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --version)
        VERSION_ARG="${2:-}"
        [[ -n "$VERSION_ARG" ]] || die "--version braucht ein Argument (vX.Y.Z)"
        shift 2
        ;;
      --version=*)
        VERSION_ARG="${1#--version=}"
        shift
        ;;
      --reconfigure)
        RECONFIGURE=1
        export DOCSOPS_RECONFIGURE=1
        shift
        ;;
      --skip-cron)
        SKIP_CRON=1
        shift
        ;;
      --skip-hosts)
        SKIP_HOSTS=1
        shift
        ;;
      --install-systemd)
        INSTALL_SYSTEMD=1
        shift
        ;;
      -h | --help)
        usage
        exit 0
        ;;
      *)
        die "Unbekanntes Argument: $1"
        ;;
    esac
  done
}

resolve_demo_script_source() {
  apply_demo_profile
  local name="${DOCSOPS_DEMO_SCRIPT_NAME}"
  if [[ -f "${DOCSOPS_INSTALL_DIR}/scripts/${name}" ]]; then
    echo "${DOCSOPS_INSTALL_DIR}/scripts/${name}"
  elif [[ -f "${_DEMO_CLI_DIR}/${name}" ]]; then
    echo "${_DEMO_CLI_DIR}/${name}"
  else
    die "Kann Quellpfad von ${name} nicht ermitteln."
  fi
}

cmd_install() {
  parse_install_args "$@"
  require_root
  apply_demo_profile

  local version self_src
  version="$(prompt_demo_release_version "$VERSION_ARG")"
  export DOCSOPS_VERSION="$version"

  local stage_total=7
  if [[ "$SKIP_HOSTS" != "1" ]]; then stage_total=$((stage_total + 1)); fi
  if [[ "$SKIP_CRON" != "1" ]]; then stage_total=$((stage_total + 1)); fi
  if [[ "$INSTALL_SYSTEMD" == "1" ]]; then stage_total=$((stage_total + 1)); fi
  export DOCSOPS_INSTALL_STAGE_TOTAL=$stage_total
  INSTALL_STAGE_N=0

  install_stage "Release-Bundle"
  download_demo_release_bundle "$version"
  resolve_install_dir || die "Bundle unvollständig unter ${DOCSOPS_INSTALL_DIR}"

  install_stage "Voraussetzungen"
  ensure_docker_compose
  require_demo_ports_free

  install_stage "Konfiguration"
  if [[ "$RECONFIGURE" == "1" || ! -f "$DOCSOPS_ENV_FILE" ]]; then
    export DOCSOPS_RECONFIGURE=1
    export ADMIN_EMAIL="${ADMIN_EMAIL:-${DOCSOPS_DEMO_ADMIN_EMAIL_DEFAULT}}"
    export ADMIN_PASSWORD="${ADMIN_PASSWORD:-DocsOps1}"
    write_demo_env_file
  else
    log "Bestehende Konfiguration: ${DOCSOPS_ENV_FILE}"
    load_demo_env
    patch_env_version "$version"
  fi

  if [[ "$SKIP_HOSTS" != "1" ]]; then
    install_stage "DNS / Hosts"
    install_lab_hosts
  fi

  install_stage "Landing"
  if [[ -f "${DOCSOPS_INSTALL_DIR}/${DOCSOPS_DEMO_BUNDLE_LANDING}/index.html" ]] \
    || [[ -f "${DOCSOPS_INSTALL_DIR}/landing-dist/index.html" ]] \
    || [[ -n "${DOCSOPS_LANDING_DIST:-}" ]]; then
    refresh_landing_from_bundle || true
  fi
  ensure_landing_dist

  install_stage "Docker-Stack (demo)"
  compose_up_demo

  install_stage "Bereitschaft prüfen"
  wait_for_health

  install_stage "CLI + Agent"
  self_src="$(resolve_demo_script_source)"
  install_docsops_demo_bin "$self_src"
  ensure_demo_hook_env
  install_agent_binary
  install_agent_systemd_unit

  if [[ "$SKIP_CRON" != "1" ]]; then
    install_stage "Täglicher Reset (cron)"
    install_demo_cron
  fi

  if [[ "$INSTALL_SYSTEMD" == "1" ]]; then
    install_stage "systemd Stack-Autostart"
    install_demo_systemd_unit
  fi

  print_demo_finish
}

install_demo_systemd_unit() {
  apply_demo_profile
  cat >/etc/systemd/system/docsops.service <<EOF
[Unit]
Description=DocsOps Demo (${DOCSOPS_DEMO_PROFILE}) (Docker Compose)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${DOCSOPS_INSTALL_DIR}
EnvironmentFile=${DOCSOPS_ENV_FILE}
ExecStart=/usr/bin/docker compose --env-file ${DOCSOPS_ENV_FILE} up -d
ExecStop=/usr/bin/docker compose --env-file ${DOCSOPS_ENV_FILE} down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable docsops.service
  log "systemd-Unit docsops.service aktiviert"
}

cmd_reset() {
  require_root
  resolve_install_dir || die "Keine Installation unter ${DOCSOPS_INSTALL_DIR}"
  load_demo_env
  ensure_landing_dist
  compose_reset_demo
  wait_for_health
  log "Demo-Reset abgeschlossen."
}

cmd_update() {
  local version="${1:-}"
  require_root
  resolve_install_dir || die "Keine Installation unter ${DOCSOPS_INSTALL_DIR}"
  load_demo_env

  if [[ "$version" == "-h" || "$version" == "--help" ]]; then
    usage
    exit 0
  fi
  if [[ "$version" == "--version" ]]; then
    version="${2:-}"
  fi

  version="$(prompt_demo_release_version "$version")"
  export DOCSOPS_VERSION="$version"
  # Same-tag retags replace GitHub assets; always refresh the install bundle on update.
  export DOCSOPS_FORCE_BUNDLE=1

  download_demo_release_bundle "$version"
  patch_env_version "$version"
  load_demo_env
  refresh_landing_from_bundle
  ensure_landing_dist
  compose_up_demo
  wait_for_health
  install_docsops_demo_bin "$(resolve_demo_script_source)"
  ensure_demo_hook_env
  install_agent_binary
  install_agent_systemd_unit
  log "Update auf ${version} abgeschlossen."
  print_demo_finish
}

cmd_status() {
  resolve_install_dir || die "Keine Installation unter ${DOCSOPS_INSTALL_DIR}"
  load_demo_env
  compose_stack_setup
  echo "== Compose =="
  compose_stack_cmd ps -a || true
  echo ""
  echo "== Health =="
  local landing_host demo_host scheme code
  landing_host="${DOCSOPS_LAB_LANDING_HOST}"
  demo_host="${DOCSOPS_LAB_DEMO_HOST}"
  scheme="${DOCSOPS_DEMO_SCHEME}"
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://${landing_host}/" || true)"
  echo "landing http://${landing_host}/ → ${code}"
  if [[ "$scheme" == "https" ]]; then
    code="$(curl -sk -o /dev/null -w '%{http_code}' "https://${landing_host}/" || true)"
    echo "landing https://${landing_host}/ → ${code}"
  fi
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://${demo_host}/health" || true)"
  echo "demo   http://${demo_host}/health → ${code}"
  if [[ "$scheme" == "https" ]]; then
    code="$(curl -sk -o /dev/null -w '%{http_code}' "https://${demo_host}/health" || true)"
    echo "demo   https://${demo_host}/health → ${code}"
  fi
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://${demo_host}/ready" || true)"
  echo "demo   http://${demo_host}/ready → ${code}"
}

cmd_logs() {
  resolve_install_dir || die "Keine Installation unter ${DOCSOPS_INSTALL_DIR}"
  load_demo_env
  compose_stack_setup
  if [[ $# -gt 0 ]]; then
    compose_stack_cmd logs -f --tail=100 "$@"
  else
    compose_stack_cmd logs -f --tail=100
  fi
}

cmd_uninstall() {
  local keep_data=0 keep_config=0
  apply_demo_profile
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --keep-data) keep_data=1; shift ;;
      --keep-config) keep_config=1; shift ;;
      -h | --help) usage; exit 0 ;;
      *) die "Unbekanntes Argument: $1" ;;
    esac
  done
  require_root
  if [[ -f "$DOCSOPS_ENV_FILE" ]]; then
    load_demo_env || true
  fi
  if resolve_install_dir 2>/dev/null; then
    export_demo_compose_env
    compose_stack_setup || true
    if [[ "$keep_data" == "1" ]]; then
      compose_stack_cmd down || true
    else
      compose_stack_cmd down -v || true
    fi
  fi
  remove_demo_cron
  remove_lab_hosts
  rm -f /usr/local/bin/docsops-demo /usr/local/bin/docsops-demo-local
  if [[ "$keep_config" != "1" ]]; then
    rm -f "$DOCSOPS_ENV_FILE"
  fi
  log "Demo-Uninstall fertig (Install-Dir ${DOCSOPS_INSTALL_DIR} bleibt; bei Bedarf manuell löschen)."
}

docsops_demo_main() {
  local cmd="${1:-}"
  if [[ -z "$cmd" ]]; then
    cmd=install
  else
    shift || true
  fi
  case "$cmd" in
    install) cmd_install "$@" ;;
    reset | reinstall) cmd_reset "$@" ;;
    update) cmd_update "$@" ;;
    status) cmd_status "$@" ;;
    logs) cmd_logs "$@" ;;
    uninstall) cmd_uninstall "$@" ;;
    -h | --help | help)
      usage
      exit 0
      ;;
    *)
      echo "Unbekannter Befehl: ${cmd}" >&2
      usage
      exit 1
      ;;
  esac
}

docsops_demo_main "$@"
