# Runbook: Air-gap install & update

Install or update DocsOps on a host **without** outbound access to `ghcr.io` / GitHub. Uses the existing flags `DOCSOPS_BUNDLE_PATH` and `DOCSOPS_SKIP_IMAGE_PULL=1`.

**Not** platform migration (§27): `platform:export` / `platform:import` move application _data_. This runbook moves _software images_ and the install bundle.

## Prerequisites

- Online machine with Docker and network to GHCR + GitHub Releases
- Offline target: Linux host with Docker, ports 80/443 (or 80 if `DOCSOPS_TLS_MODE=off`)
- Same `DOCSOPS_VERSION` (e.g. `v0.1.0`) on both sides

## 1. Online: download bundle and images

```bash
VERSION=v0.1.0   # pin the release tag
PREFIX=ghcr.io/bjkawecki

# Release bundle (compose, install scripts, Caddyfiles, agent, …)
curl -fL -o "docsops-${VERSION}.tar.gz" \
  "https://github.com/bjkawecki/docs-ops/releases/download/${VERSION}/docsops-${VERSION}.tar.gz"

# Pull images (or run a normal install once on the online host)
export DOCSOPS_VERSION="$VERSION" DOCSOPS_IMAGE_PREFIX="$PREFIX"
docker pull "${PREFIX}/docsops-migrate:${VERSION}"
docker pull "${PREFIX}/docsops-app:${VERSION}"
docker pull "${PREFIX}/docsops-worker:${VERSION}"
docker pull "${PREFIX}/docsops-frontend:${VERSION}"
docker pull postgres:18-alpine
docker pull pgsty/minio:RELEASE.2026-08-04T00-00-00Z
docker pull caddy:2-alpine

# Or use the helper (after pulls / local tags exist):
./scripts/airgap-save-images.sh "./docsops-images-${VERSION}.tar"
```

Transfer to the offline host (USB, sneaker-net, approved channel):

- `docsops-${VERSION}.tar.gz`
- `docsops-images-${VERSION}.tar`

## 2. Offline: load images and install

```bash
VERSION=v0.1.0
sudo ./scripts/airgap-load-images.sh "./docsops-images-${VERSION}.tar"

# Extract is done by install when DOCSOPS_BUNDLE_PATH is set:
export DOCSOPS_VERSION="$VERSION"
export DOCSOPS_BUNDLE_PATH="/path/to/docsops-${VERSION}.tar.gz"
export DOCSOPS_SKIP_IMAGE_PULL=1
export DOCSOPS_NON_INTERACTIVE=1
export DOCSOPS_ASSUME_YES=1
export DOCSOPS_INSTALL_CONFIRMED=1
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD='choose-a-strong-password'

# Default TLS is internal HTTPS; for HTTP-only air-gap LAN:
# export DOCSOPS_TLS_MODE=off

sudo -E /path/to/extracted-or-bundle/scripts/install-prod.sh
# Or after extracting the bundle to /opt/docsops yourself, run install-prod from there.
```

`DOCSOPS_SKIP_IMAGE_PULL=1` makes `docker compose pull` a no-op; Compose starts the already-loaded tags.

## 3. Update (same cycle)

1. Online: new version bundle + `airgap-save-images.sh` for the new tag
2. Transfer both files
3. Offline: `airgap-load-images.sh`, then:

```bash
export DOCSOPS_BUNDLE_PATH="/path/to/docsops-vX.Y.Z.tar.gz"
export DOCSOPS_SKIP_IMAGE_PULL=1
sudo -E /opt/docsops/scripts/update.sh vX.Y.Z
```

## Flags (recap)

| Variable                    | Role                                                                     |
| --------------------------- | ------------------------------------------------------------------------ |
| `DOCSOPS_BUNDLE_PATH`       | Local path to `docsops-vX.Y.Z.tar.gz` instead of downloading from GitHub |
| `DOCSOPS_SKIP_IMAGE_PULL=1` | Skip `docker compose pull` (images must already exist locally)           |
| `DOCSOPS_VERSION`           | Release tag, e.g. `v0.1.0`                                               |

## See also

- [install.md](../install.md) – normal online install
- [scripts/README.md](../../scripts/README.md) – script index
- Platform data move: Admin → Migration or `pnpm --filter backend platform:export` / `platform:import` (Umsetzungs-Todo §27)
