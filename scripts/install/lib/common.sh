#!/usr/bin/env bash
# Shared helpers for DocsOps production install scripts.
set -euo pipefail

DOCSOPS_ENV_FILE="${DOCSOPS_ENV_FILE:-/etc/docsops/docsops.env}"
DOCSOPS_INSTALL_DIR="${DOCSOPS_INSTALL_DIR:-/opt/docsops}"
DOCSOPS_REPO="${DOCSOPS_REPO:-https://github.com/bjkawecki/docs-ops.git}"
DOCSOPS_VERSION="${DOCSOPS_VERSION:-main}"
DOCSOPS_HEALTH_URL="${DOCSOPS_HEALTH_URL:-http://127.0.0.1/health}"
DOCSOPS_COMPOSE_FILES="${DOCSOPS_COMPOSE_FILES:-docker-compose.yml:docker-compose.prod.yml}"

log() {
  echo "==> $*"
}

die() {
  echo "Fehler: $*" >&2
  exit 1
}

require_root() {
  if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    die "Bitte mit sudo ausführen: sudo $0"
  fi
}

# curl | bash: stdin is the script; prompts must read from the controlling terminal.
require_interactive_tty() {
  if [[ ! -r /dev/tty ]]; then
    die "Kein interaktives Terminal (TTY). Setze DOCSOPS_ASSUME_YES=1 bzw. DOCSOPS_NON_INTERACTIVE=1 mit ADMIN_EMAIL/PASSWORD, oder führe install.sh als Datei aus."
  fi
}

read_tty() {
  read -r "$@" </dev/tty
}

confirm_or_exit() {
  if [[ "${DOCSOPS_ASSUME_YES:-}" == "1" ]]; then
    return 0
  fi
  require_interactive_tty
  echo ""
  read_tty -p "Fortfahren? [y/N] " reply
  case "${reply}" in
    y | Y | yes | YES) ;;
    *) die "Abgebrochen." ;;
  esac
}

print_security_notice() {
  cat <<'EOF'

DocsOps Production-Installation
================================

Dieses Skript wird als root ausgeführt und kann:
  - Systempakete installieren (git, curl, openssl, Docker)
  - Quellcode nach /opt/docsops klonen
  - /etc/docsops/docsops.env mit Secrets anlegen
  - Docker-Container bauen und starten (Port 80 muss auf dem Host frei sein)

Warum root-Skripte aus dem Internet riskant sind
-------------------------------------------------
Beliebiger Code mit Administratorrechten kann das System vollständig
kompromittieren. curl | bash sollte nur verwendet werden, wenn du dem
Quellcode vertraust.

Warum es hier vertretbar sein kann
----------------------------------
DocsOps ist Open Source (FOSS). Prüfe das Repository und – für Production –
bevorzugt einen Release-Tag (DOCSOPS_VERSION=vX.Y.Z) statt main.

Alternativ: Repository klonen und sudo ./install.sh aus dem Checkout starten.

EOF
}

ensure_docker_compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    return 0
  fi

  log "Docker wird installiert …"
  if [[ -f /etc/debian_version ]]; then
    apt-get update
    apt-get install -y git curl openssl ca-certificates docker.io docker-compose-plugin
  elif [[ -f /etc/fedora-release ]] || grep -qE '^ID="?(fedora|rhel|centos)"?' /etc/os-release 2>/dev/null; then
    if command -v dnf >/dev/null 2>&1; then
      dnf install -y git curl openssl docker docker-compose-plugin
    else
      die "Unsupported RPM-based system (dnf fehlt)."
    fi
  elif [[ -f /etc/arch-release ]]; then
    pacman -Sy --noconfirm git curl openssl docker docker-compose
  else
    die "Unbekannte Distribution. Bitte Docker und docker compose manuell installieren."
  fi

  systemctl enable --now docker 2>/dev/null || true
  command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 \
    || die "Docker Compose ist nach der Installation nicht verfügbar."
}

resolve_install_dir() {
  local checkout_root="${1:-}"

  if [[ -f "${DOCSOPS_INSTALL_DIR}/docker-compose.prod.yml" ]]; then
    return 0
  fi

  if [[ -n "$checkout_root" && -f "${checkout_root}/docker-compose.prod.yml" ]]; then
    log "DOCSOPS_INSTALL_DIR nicht gesetzt – verwende Checkout: ${checkout_root}"
    DOCSOPS_INSTALL_DIR="$checkout_root"
    export DOCSOPS_INSTALL_DIR
    return 0
  fi

  return 1
}

publish_port_from_health_url() {
  local url="${DOCSOPS_HEALTH_URL:-http://127.0.0.1/health}"
  if [[ "$url" =~ :([0-9]+)/ ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo 80
  fi
}

port_in_use() {
  local port="$1"
  ss -tlnH "sport = :${port}" 2>/dev/null | grep -q .
}

pids_on_port() {
  local port="$1"
  ss -tlnHp "sport = :${port}" 2>/dev/null \
    | grep -oE 'pid=[0-9]+' \
    | cut -d= -f2 \
    | sort -u
}

process_names_on_port() {
  local port="$1" pid name names=()
  while read -r pid; do
    [[ -n "$pid" ]] || continue
    name="$(ps -o comm= -p "$pid" 2>/dev/null | tr -d ' ')"
    [[ -n "$name" ]] && names+=("$name(pid=$pid)")
  done < <(pids_on_port "$port")
  (IFS=', '; echo "${names[*]}")
}

# Prüft den Publish-Port (Default 80, aus DOCSOPS_HEALTH_URL ableitbar) – beendet keine fremden Dienste.
require_publish_port_free() {
  local port proc_info
  port="$(publish_port_from_health_url)"

  if ! port_in_use "$port"; then
    log "Port ${port} ist frei"
    return 0
  fi

  echo "Port ${port} ist belegt:" >&2
  ss -tlnp "sport = :${port}" 2>/dev/null || true
  proc_info="$(process_names_on_port "$port")"
  [[ -n "$proc_info" ]] && echo "Prozesse: ${proc_info}" >&2

  if [[ "$port" == "80" ]]; then
    die "Port 80 muss frei sein, bevor DocsOps installiert wird. Bitte den bestehenden Webserver stoppen (z. B. systemctl stop apache2 oder systemctl stop httpd) und das Skript erneut starten."
  fi

  die "Port ${port} muss frei sein, bevor DocsOps installiert wird (DOCSOPS_HEALTH_URL=${DOCSOPS_HEALTH_URL})."
}

require_port_80_free() {
  require_publish_port_free
}

write_env_file() {
  local session_secret backup_key admin_email admin_password hostname
  session_secret="$(openssl rand -hex 32)"
  backup_key="$(openssl rand -base64 32)"
  admin_email="${ADMIN_EMAIL:-}"
  admin_password="${ADMIN_PASSWORD:-}"
  hostname="${DOCSOPS_HOSTNAME:-}"

  install -d -m 700 /etc/docsops

  if [[ -f "$DOCSOPS_ENV_FILE" && "${DOCSOPS_RECONFIGURE:-}" != "1" ]]; then
    die "$DOCSOPS_ENV_FILE existiert bereits. Nutze --reconfigure oder entferne die Datei bewusst."
  fi

  umask 077
  cat >"$DOCSOPS_ENV_FILE" <<EOF
# DocsOps production config (generated by install-prod.sh)
COMPOSE_PROJECT_NAME=docsops
SESSION_SECRET=${session_secret}
BACKUP_ENCRYPTION_KEY="${backup_key}"
ADMIN_EMAIL=${admin_email}
ADMIN_PASSWORD=${admin_password}
DOCSOPS_HOSTNAME=${hostname}
EOF
  chmod 600 "$DOCSOPS_ENV_FILE"

  echo ""
  echo "================================================================"
  echo " BACKUP_ENCRYPTION_KEY (einmalig – im Passwortmanager sichern!)"
  echo "================================================================"
  echo "${backup_key}"
  echo "================================================================"
  echo "Gespeichert in: ${DOCSOPS_ENV_FILE}"
  echo ""
}

compose_up_prod() {
  local compose_files extra_files
  compose_files="${DOCSOPS_COMPOSE_FILES}"
  extra_files="${DOCSOPS_EXTRA_COMPOSE_FILES:-}"
  if [[ -n "$extra_files" ]]; then
    compose_files="${compose_files}:${extra_files}"
  fi
  export COMPOSE_FILE="$compose_files"
  cd "$DOCSOPS_INSTALL_DIR"
  docker compose --env-file "$DOCSOPS_ENV_FILE" up -d --build
}

wait_for_health() {
  local i max attempts delay url
  max="${DOCSOPS_HEALTH_RETRIES:-30}"
  delay="${DOCSOPS_HEALTH_DELAY:-10}"
  url="${DOCSOPS_HEALTH_URL}"
  log "Warte auf ${url} …"
  for ((i = 1; i <= max; i++)); do
    if curl -sf "$url" >/dev/null 2>&1; then
      log "Health-Check OK"
      return 0
    fi
    echo "  Versuch ${i}/${max}, erneut in ${delay}s …"
    sleep "$delay"
  done
  die "Health-Check fehlgeschlagen: ${url}"
}

install_systemd_unit() {
  cat >/etc/systemd/system/docsops.service <<EOF
[Unit]
Description=DocsOps (Docker Compose)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${DOCSOPS_INSTALL_DIR}
EnvironmentFile=${DOCSOPS_ENV_FILE}
ExecStart=/usr/bin/docker compose --env-file ${DOCSOPS_ENV_FILE} -f docker-compose.yml -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose --env-file ${DOCSOPS_ENV_FILE} -f docker-compose.yml -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable docsops.service
  log "systemd-Unit docsops.service aktiviert"
}

print_finish() {
  local ip url
  ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  url="http://${ip:-localhost}/"
  if [[ -n "${DOCSOPS_HOSTNAME:-}" ]]; then
    echo ""
    echo "Optionaler Hostname: ${DOCSOPS_HOSTNAME}"
    echo "Clients: Eintrag in /etc/hosts oder internes DNS, z. B.:"
    echo "  ${ip:-<server-ip>}  ${DOCSOPS_HOSTNAME}"
    url="http://${DOCSOPS_HOSTNAME}/"
  fi
  echo ""
  echo "DocsOps ist installiert."
  echo "  URL:        ${url}"
  echo "  Admin:      ${ADMIN_EMAIL:-}"
  echo "  Konfiguration: ${DOCSOPS_ENV_FILE}"
  echo ""
}
