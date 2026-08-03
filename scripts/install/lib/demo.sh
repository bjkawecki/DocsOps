#!/usr/bin/env bash
# Demo helpers for docsops-demo (public) and docsops-demo-local (lab).
# Requires DOCSOPS_DEMO_PROFILE=public|local (set by CLI entrypoint before source).
# shellcheck shell=bash

DOCSOPS_DEMO_HOSTS_MARKER_BEGIN="${DOCSOPS_DEMO_HOSTS_MARKER_BEGIN:-# BEGIN docsops-demo lab}"
DOCSOPS_DEMO_HOSTS_MARKER_END="${DOCSOPS_DEMO_HOSTS_MARKER_END:-# END docsops-demo lab}"
LANDING_DIST_DIR="${LANDING_DIST_DIR:-${DOCSOPS_INSTALL_DIR}/landing}"

# Apply profile defaults (hosts, compose overlays, CLI paths). Safe to call multiple times.
# Profile-derived values are always reset so switching public↔local cannot stick stale defaults.
apply_demo_profile() {
  local profile="${DOCSOPS_DEMO_PROFILE:-}"
  if [[ -z "$profile" ]]; then
    die "DOCSOPS_DEMO_PROFILE fehlt (public|local). Nutze docsops-demo oder docsops-demo-local."
  fi
  case "$profile" in
    public)
      DOCSOPS_LAB_LANDING_HOST="docsops.de"
      DOCSOPS_LAB_DEMO_HOST="demo.docsops.de"
      DOCSOPS_DEMO_BIN="/usr/local/bin/docsops-demo"
      DOCSOPS_DEMO_CRON_FILE="/etc/cron.d/docsops-demo"
      DOCSOPS_DEMO_SCRIPT_NAME="docsops-demo"
      DOCSOPS_DEMO_BUNDLE_LANDING="landing-dist-public"
      DOCSOPS_DEMO_SCHEME="https"
      DOCSOPS_DEMO_ADMIN_EMAIL_DEFAULT="admin@demo.docsops.local"
      ;;
    local)
      DOCSOPS_LAB_LANDING_HOST="docsops.local"
      DOCSOPS_LAB_DEMO_HOST="demo.docsops.local"
      DOCSOPS_DEMO_BIN="/usr/local/bin/docsops-demo-local"
      DOCSOPS_DEMO_CRON_FILE="/etc/cron.d/docsops-demo-local"
      DOCSOPS_DEMO_SCRIPT_NAME="docsops-demo-local"
      DOCSOPS_DEMO_BUNDLE_LANDING="landing-dist-local"
      DOCSOPS_DEMO_SCHEME="http"
      DOCSOPS_DEMO_ADMIN_EMAIL_DEFAULT="admin@demo.docsops.local"
      ;;
    *)
      die "Unbekanntes DOCSOPS_DEMO_PROFILE=${profile} (erwartet: public|local)"
      ;;
  esac
  export DOCSOPS_DEMO_PROFILE DOCSOPS_LAB_LANDING_HOST DOCSOPS_LAB_DEMO_HOST
  export DOCSOPS_DEMO_BIN DOCSOPS_DEMO_CRON_FILE DOCSOPS_DEMO_SCRIPT_NAME
  export DOCSOPS_DEMO_BUNDLE_LANDING DOCSOPS_DEMO_SCHEME DOCSOPS_DEMO_ADMIN_EMAIL_DEFAULT
}

demo_is_public() {
  [[ "${DOCSOPS_DEMO_PROFILE}" == "public" ]]
}

demo_compose_extra_files() {
  if demo_is_public; then
    echo "docker-compose.demo.yml:docker-compose.demo-public.yml"
  else
    echo "docker-compose.demo.yml:docker-compose.lab.yml"
  fi
}

demo_primary_ip() {
  local ip
  ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  echo "${ip:-127.0.0.1}"
}

ensure_demo_compose_overlay() {
  [[ -f "${DOCSOPS_INSTALL_DIR}/docker-compose.demo.yml" ]] \
    || die "docker-compose.demo.yml fehlt unter ${DOCSOPS_INSTALL_DIR}"
  if demo_is_public; then
    [[ -f "${DOCSOPS_INSTALL_DIR}/docker-compose.demo-public.yml" ]] \
      || die "docker-compose.demo-public.yml fehlt unter ${DOCSOPS_INSTALL_DIR}"
    [[ -f "${DOCSOPS_INSTALL_DIR}/Caddyfile.demo" ]] \
      || die "Caddyfile.demo fehlt unter ${DOCSOPS_INSTALL_DIR}"
  else
    [[ -f "${DOCSOPS_INSTALL_DIR}/docker-compose.lab.yml" ]] \
      || die "docker-compose.lab.yml fehlt unter ${DOCSOPS_INSTALL_DIR}"
    [[ -f "${DOCSOPS_INSTALL_DIR}/Caddyfile.lab" ]] \
      || die "Caddyfile.lab fehlt unter ${DOCSOPS_INSTALL_DIR}"
  fi
}

demo_compose_file_list() {
  echo "docker-compose.yml:docker-compose.prod.yml:$(demo_compose_extra_files)"
}

# Health wait uses HTTP (ACME/TLS may still be settling on public).
demo_health_url() {
  echo "http://${DOCSOPS_LAB_DEMO_HOST}/health"
}

demo_public_url() {
  local host="$1"
  echo "${DOCSOPS_DEMO_SCHEME}://${host}/"
}

export_demo_compose_env() {
  apply_demo_profile
  export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-docsops-demo}"
  export DOCSOPS_EXTRA_COMPOSE_FILES="${DOCSOPS_EXTRA_COMPOSE_FILES:-$(demo_compose_extra_files)}"
  export COMPOSE_FILE="${COMPOSE_FILE:-$(demo_compose_file_list)}"
  export LANDING_DIST_DIR="${LANDING_DIST_DIR:-${DOCSOPS_INSTALL_DIR}/landing}"
  export DOCSOPS_HEALTH_URL="${DOCSOPS_HEALTH_URL:-$(demo_health_url)}"
  export DOCSOPS_LAB_LANDING_HOST DOCSOPS_LAB_DEMO_HOST DOCSOPS_DEMO_PROFILE
}

require_demo_ports_free() {
  require_publish_port_free
  if demo_is_public; then
    local saved="${DOCSOPS_HEALTH_URL:-}"
    DOCSOPS_HEALTH_URL="http://127.0.0.1:443/health"
    export DOCSOPS_HEALTH_URL
    require_publish_port_free
    if [[ -n "$saved" ]]; then
      DOCSOPS_HEALTH_URL="$saved"
    else
      DOCSOPS_HEALTH_URL="$(demo_health_url)"
    fi
    export DOCSOPS_HEALTH_URL
  fi
}

write_demo_env_file() {
  local session_secret backup_key admin_email admin_password image_prefix version
  local landing_host demo_host landing_dir extra_files compose_file update_github_repo agent_token
  local health_url session_cookie_secure profile
  apply_demo_profile
  assert_release_version
  session_secret="$(openssl rand -hex 32)"
  backup_key="$(openssl rand -base64 32)"
  admin_email="${ADMIN_EMAIL:-${DOCSOPS_DEMO_ADMIN_EMAIL_DEFAULT}}"
  admin_password="${ADMIN_PASSWORD:-DocsOps1}"
  image_prefix="${DOCSOPS_IMAGE_PREFIX:-ghcr.io/bjkawecki}"
  version="${DOCSOPS_VERSION}"
  landing_host="${DOCSOPS_LAB_LANDING_HOST}"
  demo_host="${DOCSOPS_LAB_DEMO_HOST}"
  landing_dir="${LANDING_DIST_DIR:-${DOCSOPS_INSTALL_DIR}/landing}"
  extra_files="$(demo_compose_extra_files)"
  compose_file="$(demo_compose_file_list)"
  health_url="$(demo_health_url)"
  profile="${DOCSOPS_DEMO_PROFILE}"
  update_github_repo="${DOCSOPS_UPDATE_GITHUB_REPO:-${DOCSOPS_GITHUB_REPO:-bjkawecki/docs-ops}}"
  agent_token="$(openssl rand -hex 32)"
  session_cookie_secure=0
  if demo_is_public; then
    session_cookie_secure=1
  fi

  install -d -m 700 /etc/docsops

  if [[ -f "$DOCSOPS_ENV_FILE" && "${DOCSOPS_RECONFIGURE:-}" != "1" ]]; then
    die "$DOCSOPS_ENV_FILE existiert bereits. Nutze --reconfigure oder ${DOCSOPS_DEMO_SCRIPT_NAME} install --reconfigure."
  fi

  umask 077
  cat >"$DOCSOPS_ENV_FILE" <<EOF
# DocsOps demo config (generated by ${DOCSOPS_DEMO_SCRIPT_NAME})
DOCSOPS_DEMO_PROFILE=${profile}
COMPOSE_PROJECT_NAME=docsops-demo
COMPOSE_FILE=${compose_file}
DOCSOPS_VERSION=${version}
DOCSOPS_IMAGE_PREFIX=${image_prefix}
DOCSOPS_UPDATE_GITHUB_REPO=${update_github_repo}
DOCSOPS_AGENT_URL=http://host.docker.internal:8091
DOCSOPS_AGENT_TOKEN=${agent_token}
DOCSOPS_AGENT_LISTEN=0.0.0.0:8091
DOCSOPS_AGENT_INSTALL_DIR=${DOCSOPS_INSTALL_DIR}
DOCSOPS_AGENT_ENV_FILE=${DOCSOPS_ENV_FILE}
DOCSOPS_AGENT_HEALTH_URL=${health_url}
DOCSOPS_EXTRA_COMPOSE_FILES=${extra_files}
LANDING_DIST_DIR=${landing_dir}
DOCSOPS_LAB_LANDING_HOST=${landing_host}
DOCSOPS_LAB_DEMO_HOST=${demo_host}
DOCSOPS_HEALTH_URL=${health_url}
SESSION_SECRET=${session_secret}
SESSION_COOKIE_SECURE=${session_cookie_secure}
BACKUP_ENCRYPTION_KEY="${backup_key}"
ADMIN_EMAIL=${admin_email}
ADMIN_PASSWORD=${admin_password}
DOCSOPS_HOSTNAME=${demo_host}
EOF
  chmod 600 "$DOCSOPS_ENV_FILE"

  export COMPOSE_PROJECT_NAME=docsops-demo
  export COMPOSE_FILE="$compose_file"
  export LANDING_DIST_DIR="$landing_dir"
  export DOCSOPS_LAB_LANDING_HOST="$landing_host"
  export DOCSOPS_LAB_DEMO_HOST="$demo_host"
  export DOCSOPS_HEALTH_URL="$health_url"
  export DOCSOPS_EXTRA_COMPOSE_FILES="$extra_files"
  export DOCSOPS_DEMO_PROFILE="$profile"
  export ADMIN_EMAIL="$admin_email"
  export ADMIN_PASSWORD="$admin_password"
  export SESSION_COOKIE_SECURE="$session_cookie_secure"

  echo ""
  echo "================================================================"
  echo " BACKUP_ENCRYPTION_KEY (einmalig – im Passwortmanager sichern!)"
  echo "================================================================"
  echo "${backup_key}"
  echo "================================================================"
  echo "Gespeichert in: ${DOCSOPS_ENV_FILE}"
  echo ""
  if [[ "${DOCSOPS_NON_INTERACTIVE:-}" != "1" && "${DOCSOPS_ASSUME_YES:-}" != "1" ]]; then
    confirm_backup_key_saved
  fi
}

load_demo_env() {
  local saved_landing saved_demo
  [[ -f "$DOCSOPS_ENV_FILE" ]] || {
    apply_demo_profile
    die "${DOCSOPS_ENV_FILE} fehlt – zuerst: ${DOCSOPS_DEMO_SCRIPT_NAME} install"
  }
  # shellcheck disable=SC1090
  set -a
  source "$DOCSOPS_ENV_FILE"
  set +a
  saved_landing="${DOCSOPS_LAB_LANDING_HOST:-}"
  saved_demo="${DOCSOPS_LAB_DEMO_HOST:-}"
  # Older lab installs had no profile key; treat as local.
  if [[ -z "${DOCSOPS_DEMO_PROFILE:-}" ]]; then
    DOCSOPS_DEMO_PROFILE=local
  fi
  apply_demo_profile
  [[ -n "$saved_landing" ]] && DOCSOPS_LAB_LANDING_HOST="$saved_landing"
  [[ -n "$saved_demo" ]] && DOCSOPS_LAB_DEMO_HOST="$saved_demo"
  LANDING_DIST_DIR="${LANDING_DIST_DIR:-${DOCSOPS_INSTALL_DIR}/landing}"
  export_demo_compose_env
  assert_release_version
}

# Manage a marked block in /etc/hosts for lab hostnames (local profile only).
install_lab_hosts() {
  local ip hosts_file tmp
  if demo_is_public; then
    log "Public-Profil: /etc/hosts unverändert (DNS docsops.de / demo.docsops.de)"
    return 0
  fi
  ip="${DOCSOPS_LAB_HOSTS_IP:-$(demo_primary_ip)}"
  hosts_file="${DOCSOPS_HOSTS_FILE:-/etc/hosts}"
  tmp="$(mktemp)"

  if [[ -f "$hosts_file" ]]; then
    awk -v begin="$DOCSOPS_DEMO_HOSTS_MARKER_BEGIN" -v end="$DOCSOPS_DEMO_HOSTS_MARKER_END" '
      $0 == begin {skip=1; next}
      $0 == end {skip=0; next}
      !skip {print}
    ' "$hosts_file" >"$tmp"
  else
    : >"$tmp"
  fi

  {
    cat "$tmp"
    echo "$DOCSOPS_DEMO_HOSTS_MARKER_BEGIN"
    echo "${ip}  ${DOCSOPS_LAB_LANDING_HOST} ${DOCSOPS_LAB_DEMO_HOST}"
    echo "$DOCSOPS_DEMO_HOSTS_MARKER_END"
  } >"${hosts_file}.docsops-new"
  mv "${hosts_file}.docsops-new" "$hosts_file"
  rm -f "$tmp"
  log "DNS/Hosts: ${ip} → ${DOCSOPS_LAB_LANDING_HOST} ${DOCSOPS_LAB_DEMO_HOST} (${hosts_file})"
}

remove_lab_hosts() {
  local hosts_file tmp
  hosts_file="${DOCSOPS_HOSTS_FILE:-/etc/hosts}"
  [[ -f "$hosts_file" ]] || return 0
  tmp="$(mktemp)"
  awk -v begin="$DOCSOPS_DEMO_HOSTS_MARKER_BEGIN" -v end="$DOCSOPS_DEMO_HOSTS_MARKER_END" '
    $0 == begin {skip=1; next}
    $0 == end {skip=0; next}
    !skip {print}
  ' "$hosts_file" >"$tmp"
  mv "$tmp" "$hosts_file"
  log "DocsOps-Lab-Einträge aus ${hosts_file} entfernt"
}

ensure_landing_dist() {
  local dest src bundle_landing legacy_landing
  apply_demo_profile
  dest="${LANDING_DIST_DIR:-${DOCSOPS_INSTALL_DIR}/landing}"
  install -d -m 755 "$dest"

  if [[ -n "${DOCSOPS_LANDING_DIST:-}" ]]; then
    src="${DOCSOPS_LANDING_DIST}"
    [[ -f "${src}/index.html" ]] || die "DOCSOPS_LANDING_DIST ohne index.html: ${src}"
    rm -rf "${dest:?}/"*
    cp -a "${src}/." "${dest}/"
    log "Landing aus DOCSOPS_LANDING_DIST nach ${dest} kopiert"
    return 0
  fi

  bundle_landing="${DOCSOPS_INSTALL_DIR}/${DOCSOPS_DEMO_BUNDLE_LANDING}"
  if [[ -f "${bundle_landing}/index.html" ]]; then
    rm -rf "${dest:?}/"*
    cp -a "${bundle_landing}/." "${dest}/"
    log "Landing aus Bundle (${bundle_landing}) nach ${dest} kopiert"
    return 0
  fi

  # Older bundles only had landing-dist/
  legacy_landing="${DOCSOPS_INSTALL_DIR}/landing-dist"
  if [[ -f "${legacy_landing}/index.html" ]]; then
    rm -rf "${dest:?}/"*
    cp -a "${legacy_landing}/." "${dest}/"
    log "Landing aus Legacy-Bundle (${legacy_landing}) nach ${dest} kopiert"
    return 0
  fi

  if [[ -f "${dest}/index.html" ]]; then
    log "Landing vorhanden: ${dest}"
    return 0
  fi

  die "Landing-Dist fehlt (${dest}/index.html). Bundle mit ${DOCSOPS_DEMO_BUNDLE_LANDING} bauen, oder DOCSOPS_LANDING_DIST=… setzen."
}

refresh_landing_from_bundle() {
  local bundle_landing legacy_landing
  apply_demo_profile
  bundle_landing="${DOCSOPS_INSTALL_DIR}/${DOCSOPS_DEMO_BUNDLE_LANDING}"
  if [[ -f "${bundle_landing}/index.html" ]]; then
    rm -rf "${LANDING_DIST_DIR:?}/"*
    cp -a "${bundle_landing}/." "${LANDING_DIST_DIR}/"
    return 0
  fi
  legacy_landing="${DOCSOPS_INSTALL_DIR}/landing-dist"
  if [[ -f "${legacy_landing}/index.html" ]]; then
    rm -rf "${LANDING_DIST_DIR:?}/"*
    cp -a "${legacy_landing}/." "${LANDING_DIST_DIR}/"
  fi
}

install_demo_cron() {
  local bin cron_hour
  apply_demo_profile
  bin="${DOCSOPS_DEMO_BIN}"
  cron_hour="${DOCSOPS_DEMO_RESET_HOUR:-4}"
  [[ -x "$bin" ]] || die "${DOCSOPS_DEMO_SCRIPT_NAME} Binary fehlt: ${bin}"

  cat >"$DOCSOPS_DEMO_CRON_FILE" <<EOF
# DocsOps demo (${DOCSOPS_DEMO_PROFILE}): daily reset (volumes wipe + reseed via DEMO_MODE)
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 ${cron_hour} * * * root ${bin} reset >>/var/log/${DOCSOPS_DEMO_SCRIPT_NAME}-reset.log 2>&1
EOF
  chmod 644 "$DOCSOPS_DEMO_CRON_FILE"
  log "Cron: täglich ${cron_hour}:00 → ${bin} reset (${DOCSOPS_DEMO_CRON_FILE})"
}

remove_demo_cron() {
  apply_demo_profile
  rm -f "$DOCSOPS_DEMO_CRON_FILE"
  # Also remove the other profile's cron if present (clean uninstall)
  rm -f /etc/cron.d/docsops-demo /etc/cron.d/docsops-demo-local
  log "Cron-Dateien für Demo entfernt"
}

install_docsops_demo_bin() {
  local src dest
  apply_demo_profile
  src="${1:-}"
  dest="${DOCSOPS_DEMO_BIN}"
  [[ -n "$src" && -f "$src" ]] || die "${DOCSOPS_DEMO_SCRIPT_NAME} Quellskript fehlt"
  install -m 755 "$src" "$dest"
  log "CLI installiert: ${dest}"
}

list_github_release_tags() {
  local json tags
  json="$(curl -fsSL "https://api.github.com/repos/${DOCSOPS_GITHUB_REPO}/releases?per_page=30")" \
    || die "GitHub Releases nicht abrufbar."
  tags="$(echo "$json" | sed -n 's/.*"tag_name": *"\(v[0-9][^"]*\)".*/\1/p')"
  [[ -n "$tags" ]] || die "Keine Releases gefunden."
  echo "$tags"
}

prompt_demo_release_version() {
  local pinned="$1" tags tag i=0 choice
  if [[ -n "$pinned" ]]; then
    assert_release_version "$pinned"
    echo "$pinned"
    return 0
  fi
  if [[ -n "${DOCSOPS_VERSION:-}" ]]; then
    assert_release_version "$DOCSOPS_VERSION"
    echo "$DOCSOPS_VERSION"
    return 0
  fi
  if [[ -f "${DOCSOPS_INSTALL_DIR}/VERSION" ]]; then
    tag="$(tr -d '[:space:]' <"${DOCSOPS_INSTALL_DIR}/VERSION")"
    if [[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "$tag"
      return 0
    fi
  fi
  if [[ -n "${DOCSOPS_BUNDLE_PATH:-}" ]]; then
    die "DOCSOPS_VERSION setzen (z. B. v0.1.0) wenn DOCSOPS_BUNDLE_PATH genutzt wird."
  fi
  if [[ "${DOCSOPS_NON_INTERACTIVE:-}" == "1" ]]; then
    fetch_latest_github_release_tag
    return 0
  fi

  mapfile -t tags < <(list_github_release_tags)
  echo "Verfügbare Releases:"
  for tag in "${tags[@]}"; do
    i=$((i + 1))
    echo "  ${i}) ${tag}"
  done
  require_interactive_tty
  read_tty -p "Version wählen [1]: " choice
  choice="${choice:-1}"
  if [[ "$choice" =~ ^[0-9]+$ ]] && ((choice >= 1 && choice <= ${#tags[@]})); then
    echo "${tags[$((choice - 1))]}"
    return 0
  fi
  die "Ungültige Auswahl: ${choice}"
}

download_demo_release_bundle() {
  local version="$1" url archive stage extracted
  assert_release_version "$version"
  install -d -m 755 "$DOCSOPS_INSTALL_DIR"

  if [[ -z "${DOCSOPS_BUNDLE_PATH:-}" && "${DOCSOPS_FORCE_BUNDLE:-}" != "1" ]]; then
    if [[ -f "${DOCSOPS_INSTALL_DIR}/VERSION" && -f "${DOCSOPS_INSTALL_DIR}/docker-compose.demo.yml" ]]; then
      local have
      have="$(tr -d '[:space:]' <"${DOCSOPS_INSTALL_DIR}/VERSION")"
      if [[ "$have" == "$version" ]]; then
        log "Bestehendes Bundle ${version} unter ${DOCSOPS_INSTALL_DIR} – Download übersprungen"
        return 0
      fi
    fi
  fi

  if [[ -n "${DOCSOPS_BUNDLE_PATH:-}" ]]; then
    [[ -f "$DOCSOPS_BUNDLE_PATH" ]] || die "DOCSOPS_BUNDLE_PATH nicht gefunden: ${DOCSOPS_BUNDLE_PATH}"
    archive="$DOCSOPS_BUNDLE_PATH"
    log "Lokales Bundle: ${archive}"
  else
    url="https://github.com/${DOCSOPS_GITHUB_REPO}/releases/download/${version}/docsops-${version}.tar.gz"
    archive="$(mktemp /tmp/docsops-demo-XXXXXX.tar.gz)"
    log "Lade ${url} …"
    curl -fsSL -o "$archive" "$url" || die "Bundle-Download fehlgeschlagen: ${url}"
  fi

  stage="$(mktemp -d)"
  tar -xzf "$archive" -C "$stage"
  extracted="$(find_bundle_root_in_dir "$stage")"
  [[ -n "$extracted" ]] || die "Ungültiges Bundle (scripts/install-prod.sh fehlt)."

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
      --exclude 'landing/' \
      "${extracted}/" "${DOCSOPS_INSTALL_DIR}/"
  else
    for item in "${extracted}"/*; do
      base="$(basename "$item")"
      [[ "$base" == "landing" ]] && continue
      rm -rf "${DOCSOPS_INSTALL_DIR:?}/${base}"
      cp -a "$item" "${DOCSOPS_INSTALL_DIR}/"
    done
  fi

  for dist_name in landing-dist landing-dist-local landing-dist-public; do
    if [[ -d "${extracted}/${dist_name}" ]]; then
      rm -rf "${DOCSOPS_INSTALL_DIR}/${dist_name}"
      cp -a "${extracted}/${dist_name}" "${DOCSOPS_INSTALL_DIR}/${dist_name}"
    fi
  done

  echo "$version" >"${DOCSOPS_INSTALL_DIR}/VERSION"
  if [[ -z "${DOCSOPS_BUNDLE_PATH:-}" ]]; then
    rm -f "$archive"
  fi
  rm -rf "$stage"
  log "Bundle ${version} nach ${DOCSOPS_INSTALL_DIR}"
}

compose_up_demo() {
  export_demo_compose_env
  ensure_demo_compose_overlay
  compose_up_prod
}

compose_reset_demo() {
  export_demo_compose_env
  ensure_demo_compose_overlay
  compose_stack_setup
  log "Demo-Reset: Volumes löschen und Stack neu starten …"
  compose_stack_cmd down -v
  compose_up_prod
}

print_demo_finish() {
  local ip scheme cli
  apply_demo_profile
  ip="$(demo_primary_ip)"
  scheme="${DOCSOPS_DEMO_SCHEME}"
  cli="${DOCSOPS_DEMO_SCRIPT_NAME}"
  echo ""
  if demo_is_public; then
    echo "DocsOps öffentliche Demo ist bereit."
    echo "  Landing:  ${scheme}://${DOCSOPS_LAB_LANDING_HOST}/"
    echo "  Demo-App: ${scheme}://${DOCSOPS_LAB_DEMO_HOST}/"
    echo "  DNS:      A/AAAA für ${DOCSOPS_LAB_LANDING_HOST} und ${DOCSOPS_LAB_DEMO_HOST} → ${ip}"
    echo "  Firewall: Ports 80 und 443"
    echo "  Vor DNS:  Client /etc/hosts: ${ip}  ${DOCSOPS_LAB_LANDING_HOST} ${DOCSOPS_LAB_DEMO_HOST}"
  else
    echo "DocsOps Demo / VM-Lab ist bereit."
    echo "  Landing:  ${scheme}://${DOCSOPS_LAB_LANDING_HOST}/"
    echo "  Demo-App: ${scheme}://${DOCSOPS_LAB_DEMO_HOST}/"
    echo "  Client-Maschinen brauchen in /etc/hosts:"
    echo "    ${ip}  ${DOCSOPS_LAB_LANDING_HOST} ${DOCSOPS_LAB_DEMO_HOST}"
  fi
  echo "  Login:    Rollenwahl (DEMO_MODE) oder Seed-Accounts / Passwort DocsOps1"
  echo "  Config:   ${DOCSOPS_ENV_FILE}"
  echo "  CLI:      ${cli} status | reset | logs"
  echo ""
}
