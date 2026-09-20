# DocsOps

Self-hosted **internal documentation** for organizations. Knowledge lives in your company hierarchy (company → department → team), with a clear split between **drafts** and the **published, official version**.

## Why DocsOps

- **Organization in the product** – Scopes mirror how you work: company, department, team, plus personal space.
- **Process and project contexts** – “How we work” and “what we are building” share the same model, not a flat wiki dump.
- **Explicit access** – Readers and writers are granted per document (and via teams/departments), not guessed from folder ACLs alone.
- **Lead publishes** – Authors draft and propose; scope leads publish the binding version. Members see the official stand, not every WIP edit.
- **Yours to run** – Open source (MIT), intranet-friendly install, no SaaS lock-in.

## Try it

- Marketing site: [https://docsops.de](https://docsops.de)
- Live demo (resets daily): [https://demo.docsops.de](https://demo.docsops.de)

## Quick start: development

**Need:** Docker (Compose), Node.js matching [`.nvmrc`](.nvmrc), [pnpm](https://pnpm.io/).

```bash
cp .env.example .env   # if you do not have a root .env yet
make up                # or: docker compose up -d
```

App: [http://localhost:5000](http://localhost:5000) · Health: [http://localhost:5000/health](http://localhost:5000/health)

More detail: [docs/Development-Anleitung.md](docs/Development-Anleitung.md).

## Quick start: production (intranet)

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

**Update:** `sudo /opt/docsops/scripts/update.sh` (latest) or `… update.sh vX.Y.Z`.

Full guide: [docs/install.md](docs/install.md). Offline hosts: [docs/plan/Runbook-Air-Gap-Install.md](docs/plan/Runbook-Air-Gap-Install.md).

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

## Further reading

| Topic | Doc |
| ----- | --- |
| Production install & demo stacks | [docs/install.md](docs/install.md) |
| Local development | [docs/Development-Anleitung.md](docs/Development-Anleitung.md) |
| Air-gapped install/update | [docs/plan/Runbook-Air-Gap-Install.md](docs/plan/Runbook-Air-Gap-Install.md) |
| Platform concept | [docs/platform/README.md](docs/platform/README.md) |
| Implementation backlog | [docs/plan/Umsetzungs-Todo.md](docs/plan/Umsetzungs-Todo.md) |

## License

[MIT](LICENSE)
