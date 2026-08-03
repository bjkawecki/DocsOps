#!/usr/bin/env bash
# Build docsops-vX.Y.Z.tar.gz deploy bundle (no monorepo sources).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT_DIR="${1:-${ROOT}/dist}"
VERSION="${DOCSOPS_VERSION:-}"
AGENT_BINARY="${DOCSOPS_AGENT_BINARY:-${ROOT}/dist/docsops-agent}"
LANDING_DIST_LOCAL="${DOCSOPS_LANDING_DIST_LOCAL:-${ROOT}/apps/landing/dist-local}"
LANDING_DIST_PUBLIC="${DOCSOPS_LANDING_DIST_PUBLIC:-${ROOT}/apps/landing/dist-public}"
# Legacy single-dist override (copies into both profile dirs if profile dirs missing)
LANDING_DIST="${DOCSOPS_LANDING_DIST:-}"

if [[ -z "$VERSION" ]]; then
  VERSION="$(node -p "require('${ROOT}/package.json').version")"
  VERSION="v${VERSION}"
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "VERSION must be a release tag (vX.Y.Z), got: ${VERSION}" >&2
  exit 1
fi

if [[ ! -f "$AGENT_BINARY" ]]; then
  echo "Agent binary missing: ${AGENT_BINARY} (set DOCSOPS_AGENT_BINARY or build with go build)" >&2
  exit 1
fi

if [[ -n "$LANDING_DIST" ]]; then
  LANDING_DIST_LOCAL="${LANDING_DIST}"
  LANDING_DIST_PUBLIC="${LANDING_DIST}"
fi

if [[ ! -f "${LANDING_DIST_LOCAL}/index.html" ]]; then
  echo "Local landing dist missing: ${LANDING_DIST_LOCAL}/index.html" >&2
  echo "Build first, e.g.:" >&2
  echo "  make landing-build-lab   # → apps/landing/dist-local (or dist via symlink)" >&2
  echo "Or set DOCSOPS_LANDING_DIST_LOCAL=/path/to/dist" >&2
  exit 1
fi

if [[ ! -f "${LANDING_DIST_PUBLIC}/index.html" ]]; then
  echo "Public landing dist missing: ${LANDING_DIST_PUBLIC}/index.html" >&2
  echo "Build first, e.g.:" >&2
  echo "  make landing-build-public" >&2
  echo "Or set DOCSOPS_LANDING_DIST_PUBLIC=/path/to/dist" >&2
  exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

BUNDLE_ROOT="${STAGE}/docsops-${VERSION}"
install -d "$BUNDLE_ROOT/scripts/install/lib" "$BUNDLE_ROOT/scripts/lab" "$BUNDLE_ROOT/bin" \
  "$BUNDLE_ROOT/systemd" \
  "$BUNDLE_ROOT/landing-dist" "$BUNDLE_ROOT/landing-dist-local" "$BUNDLE_ROOT/landing-dist-public" \
  "$OUT_DIR"

copy_file() {
  local src="$1" dest="$2"
  [[ -f "$src" ]] || { echo "Missing: $src" >&2; exit 1; }
  install -D "$src" "$dest"
}

stamp_install_sh() {
  local src="$1" dest="$2" version="$3"
  copy_file "$src" "$dest"
  sed -i "s/^DOCSOPS_DEFAULT_RELEASE_VERSION=\"\"/DOCSOPS_DEFAULT_RELEASE_VERSION=\"${version}\"/" "$dest"
}

copy_file "${ROOT}/docker-compose.yml" "${BUNDLE_ROOT}/docker-compose.yml"
copy_file "${ROOT}/docker-compose.prod.yml" "${BUNDLE_ROOT}/docker-compose.prod.yml"
copy_file "${ROOT}/docker-compose.demo.yml" "${BUNDLE_ROOT}/docker-compose.demo.yml"
copy_file "${ROOT}/docker-compose.lab.yml" "${BUNDLE_ROOT}/docker-compose.lab.yml"
copy_file "${ROOT}/docker-compose.demo-public.yml" "${BUNDLE_ROOT}/docker-compose.demo-public.yml"
copy_file "${ROOT}/Caddyfile.prod" "${BUNDLE_ROOT}/Caddyfile.prod"
copy_file "${ROOT}/Caddyfile.lab" "${BUNDLE_ROOT}/Caddyfile.lab"
copy_file "${ROOT}/Caddyfile.demo" "${BUNDLE_ROOT}/Caddyfile.demo"
stamp_install_sh "${ROOT}/install.sh" "${BUNDLE_ROOT}/install.sh" "$VERSION"
copy_file "${ROOT}/uninstall.sh" "${BUNDLE_ROOT}/uninstall.sh"
copy_file "${ROOT}/scripts/install-prod.sh" "${BUNDLE_ROOT}/scripts/install-prod.sh"
copy_file "${ROOT}/scripts/uninstall-prod.sh" "${BUNDLE_ROOT}/scripts/uninstall-prod.sh"
copy_file "${ROOT}/scripts/install/lib/common.sh" "${BUNDLE_ROOT}/scripts/install/lib/common.sh"
copy_file "${ROOT}/scripts/install/lib/demo.sh" "${BUNDLE_ROOT}/scripts/install/lib/demo.sh"
copy_file "${ROOT}/scripts/docsops-demo-cli.sh" "${BUNDLE_ROOT}/scripts/docsops-demo-cli.sh"
copy_file "${ROOT}/scripts/docsops-demo" "${BUNDLE_ROOT}/scripts/docsops-demo"
copy_file "${ROOT}/scripts/docsops-demo-local" "${BUNDLE_ROOT}/scripts/docsops-demo-local"
copy_file "${ROOT}/scripts/docsops-demo" "${BUNDLE_ROOT}/docsops-demo"
copy_file "${ROOT}/scripts/docsops-demo-local" "${BUNDLE_ROOT}/docsops-demo-local"
copy_file "${ROOT}/scripts/update.sh" "${BUNDLE_ROOT}/scripts/update.sh"
copy_file "${ROOT}/scripts/lab/smoke-vm-lab.sh" "${BUNDLE_ROOT}/scripts/lab/smoke-vm-lab.sh"
copy_file "${ROOT}/docker-compose.ci.yml" "${BUNDLE_ROOT}/docker-compose.ci.yml"
install -m 755 "$AGENT_BINARY" "${BUNDLE_ROOT}/bin/docsops-agent"
copy_file "${ROOT}/systemd/docsops-agent.service" "${BUNDLE_ROOT}/systemd/docsops-agent.service"
cp -a "${LANDING_DIST_LOCAL}/." "${BUNDLE_ROOT}/landing-dist-local/"
cp -a "${LANDING_DIST_PUBLIC}/." "${BUNDLE_ROOT}/landing-dist-public/"
# Legacy alias for older install paths / docs
cp -a "${LANDING_DIST_LOCAL}/." "${BUNDLE_ROOT}/landing-dist/"
echo "$VERSION" >"${BUNDLE_ROOT}/VERSION"
chmod +x "${BUNDLE_ROOT}/install.sh" "${BUNDLE_ROOT}/uninstall.sh" \
  "${BUNDLE_ROOT}/docsops-demo" "${BUNDLE_ROOT}/docsops-demo-local" \
  "${BUNDLE_ROOT}/scripts/install-prod.sh" "${BUNDLE_ROOT}/scripts/uninstall-prod.sh" \
  "${BUNDLE_ROOT}/scripts/docsops-demo" "${BUNDLE_ROOT}/scripts/docsops-demo-local" \
  "${BUNDLE_ROOT}/scripts/docsops-demo-cli.sh" "${BUNDLE_ROOT}/scripts/update.sh" \
  "${BUNDLE_ROOT}/scripts/lab/smoke-vm-lab.sh"

ARCHIVE="${OUT_DIR}/docsops-${VERSION}.tar.gz"
tar -C "$STAGE" -czf "$ARCHIVE" "docsops-${VERSION}"
cp "${BUNDLE_ROOT}/install.sh" "${OUT_DIR}/install.sh"
copy_file "${ROOT}/uninstall.sh" "${OUT_DIR}/uninstall.sh"
copy_file "${ROOT}/scripts/docsops-demo" "${OUT_DIR}/docsops-demo"
copy_file "${ROOT}/scripts/docsops-demo-local" "${OUT_DIR}/docsops-demo-local"
chmod +x "${OUT_DIR}/docsops-demo" "${OUT_DIR}/docsops-demo-local"
echo "Created ${ARCHIVE}"
