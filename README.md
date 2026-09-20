# DocsOps _(docs-ops)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Self-hosted internal documentation with org hierarchy and lead-controlled publishing.

DocsOps is an open-source (MIT) platform for internal company documentation: scopes follow **company → department → team** (plus personal space), documents live in process or project contexts, and access is granted explicitly. Authors draft and propose; scope leads publish the official version that members read.

The GitHub repository and folder are `docs-ops`. The root npm workspace package is still named `engineering-knowledge-operations` (legacy); the product name is **DocsOps**.

## Table of Contents

- [Background](#background)
- [Install](#install)
  - [Dependencies](#dependencies)
  - [Development](#development)
  - [Production (intranet)](#production-intranet)
  - [Updating](#updating)
- [Usage](#usage)
- [Repository map](#repository-map)
- [Operational notes](#operational-notes)
  - [Operational backup](#operational-backup)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Background

Motivation and product shape (see also [docs/marketing/Positionierung-und-Landing.md](docs/marketing/Positionierung-und-Landing.md)):

- **Organization in the product** – Scopes mirror how you work: company, department, team, plus personal space.
- **Process and project contexts** – “How we work” and “what we are building” share the same model, not a flat wiki dump.
- **Explicit access** – Readers and writers are granted per document (and via teams/departments), not guessed from folder ACLs alone.
- **Lead publishes** – Authors draft and propose; scope leads publish the binding version. Members see the official stand, not every WIP edit.
- **Yours to run** – Self-hosted, intranet-friendly install, no SaaS lock-in.

Try it: [docsops.de](https://docsops.de) (marketing) · [demo.docsops.de](https://demo.docsops.de) (live demo, resets daily).

Deeper concept docs: [docs/platform/README.md](docs/platform/README.md). Implementation backlog: [docs/plan/Umsetzungs-Todo.md](docs/plan/Umsetzungs-Todo.md).

## Install

### Dependencies

- [Docker](https://docs.docker.com/get-docker/) with Compose
- For local development: [Node.js](https://nodejs.org/) matching [`.nvmrc`](.nvmrc), and [pnpm](https://pnpm.io/)

### Development

```bash
cp .env.example .env   # if you do not have a root .env yet
make up                # or: docker compose up -d
```

App: [http://localhost:5000](http://localhost:5000) · Health: [http://localhost:5000/health](http://localhost:5000/health)

More detail: [docs/Development-Anleitung.md](docs/Development-Anleitung.md).

### Production (intranet)

On a Linux host with Docker, ports **80** and **443** free:

```bash
curl -fsSL https://github.com/bjkawecki/docs-ops/releases/latest/download/install.sh | sudo bash
```

The script installs the matching release bundle under `/opt/docsops`, writes secrets to `/etc/docsops/docsops.env`, pulls images from GHCR, and creates the first admin.

**Defaults after install**

- HTTPS on **:443** (`DOCSOPS_TLS_MODE=internal`, Caddy self-signed – browsers show a one-time warning)
- HTTP **:80** for health checks and redirects
- `SESSION_COOKIE_SECURE=1` (use `https://` in the browser)

**Useful overrides** (set before install, or edit `/etc/docsops/docsops.env` and recreate the stack):

```bash
# HTTP-only intranet
export DOCSOPS_TLS_MODE=off

# Public hostname + Let's Encrypt
export DOCSOPS_TLS_MODE=acme
export DOCSOPS_TLS_DOMAIN=docsops.example.com
export DOCSOPS_TLS_EMAIL=admin@example.com
```

Pin a version: `…/releases/download/v0.1.0/install.sh` or `DOCSOPS_VERSION=v0.1.0` before `bash`.

Full guide: [docs/install.md](docs/install.md). Offline hosts: [docs/plan/Runbook-Air-Gap-Install.md](docs/plan/Runbook-Air-Gap-Install.md).

### Updating

```bash
sudo /opt/docsops/scripts/update.sh          # latest
sudo /opt/docsops/scripts/update.sh vX.Y.Z   # pin
```

## Usage

After **development** install, open [http://localhost:5000](http://localhost:5000) and sign in with the admin from your `.env` (or the CSV seed in the dev stack).

After **production** install, open `https://<server-ip>/` (confirm the self-signed certificate once when using `DOCSOPS_TLS_MODE=internal`) and sign in with the admin created during install.

Compose overlays and production Caddyfiles live under [`deploy/`](deploy). Local `make up` uses root [`docker-compose.yml`](docker-compose.yml) plus [`docker-compose.override.yml`](docker-compose.override.yml).

## Repository map

| Path | Role |
| ---- | ---- |
| [`deploy/`](deploy) | Compose overlays + production Caddyfiles |
| [`apps/backend`](apps/backend) | API, worker, Prisma |
| [`apps/frontend`](apps/frontend) | Web app (Vite + React) |
| [`apps/landing`](apps/landing) | Marketing site |
| [`apps/agent`](apps/agent) | Host agent for updates |
| [`apps/e2e`](apps/e2e) | Playwright smoke (release CI) |
| [`scripts/`](scripts) | Install, update, air-gap helpers |
| [`docs/platform/`](docs/platform) | Product concept and architecture |
| [`docs/plan/`](docs/plan) | Implementation and ops plans |
| [`content/releases/`](content/releases) | In-app “What’s new” notes |

## Operational notes

### Operational backup

Operational backup (Admin → Backup) is disaster recovery for Postgres + MinIO. It is **not** platform export/import (Admin → Migration).

Set **`BACKUP_ENCRYPTION_KEY`** (32 bytes, base64) so backup destination credentials can be stored encrypted. Production install writes it once to `/etc/docsops/docsops.env` – keep a copy in a password manager. Losing the key means encrypted destination secrets cannot be decrypted; the key is not inside backup archives.

Details: [docs/install.md](docs/install.md), [docs/plan/Runbook-Backup-Restore.md](docs/plan/Runbook-Backup-Restore.md).

## Maintainers

- [@bjkawecki](https://github.com/bjkawecki)

## Contributing

Questions and bug reports: [GitHub Issues](https://github.com/bjkawecki/docs-ops/issues).

Pull requests are welcome. For local setup, follow [docs/Development-Anleitung.md](docs/Development-Anleitung.md). Use `pnpm` (not npm/yarn), keep UI and API paths in English, and run `pnpm run lint` before opening a PR.

## License

[MIT](LICENSE) © 2026
