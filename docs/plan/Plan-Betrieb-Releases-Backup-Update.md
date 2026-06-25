# Betrieb: Releases, Backup, Update

Plan für Betriebs-Features: **What's new**, **Backup** (Disaster Recovery), **Update** und **Plattform-Migration**. Ergänzt [Infrastruktur & Deployment](Infrastruktur-und-Deployment.md); Umsetzungsschritte in [Umsetzungs-Todo §24–§27](Umsetzungs-Todo.md).

---

## 1. Versionierung (gemeinsame Basis)

- **Single Source of Truth:** `version` in der Root-`package.json` (SemVer, z. B. `0.2.0`) – **einzige** manuelle Stelle beim Release.
- **Deploy:** Beim Image-Build wird `APP_VERSION` **deterministisch aus** Root-`package.json` abgeleitet (`/APP_VERSION` im Image, Entrypoint exportiert). **`DOCSOPS_VERSION`** in `/etc/docsops/docsops.env` ist der **Image-Tag** für `docker compose pull` (`vX.Y.Z`) – nicht `APP_VERSION`.
- **Runtime:** Backend liest **nur** `process.env.APP_VERSION`; fehlt der Wert → Fehler (kein Fallback auf andere `package.json`).
- **Release:** Git-Tag `v0.2.0`, GitHub Release mit **Deploy-Bundle** (`docsops-v0.2.0.tar.gz`: Compose, Caddy, Install-Skripte) und **Container-Images** auf GHCR (`ghcr.io/<owner>/docsops-*:v0.2.0`, public wie Coolify). Production: `pull` + `up -d` – kein Monorepo-Clone, kein lokaler Build. Details: [Umsetzungs-Todo §19](Umsetzungs-Todo.md).
- **Update:** `scripts/update.sh` lädt neues Bundle + Image-Tags, dann `compose pull` + `up -d` (§26).
- **Release Notes:** Markdown pro Version unter `content/releases/0.2.0.md` plus `content/releases/manifest.json` (Version, Datum, Titel) – wird mit der App ausgeliefert.
- **Nummer bestimmen:** **manuell beim Release** (bewusst, nicht pro Commit). Ein Release = ein SemVer-Sprung + Release Note + Git-Tag + deploytes Image/Bundle.
- **SemVer-Kriterien:** **Patch** = Bugfixes/kleine UX; **Minor** = neue Features, rückwärtskompatibel; **Major** = Breaking Changes (Migration, inkompatible API). Während `0.x.y`: API/Betrieb dürfen sich noch ändern.
- **Kein Auto-Patch pro Commit:** CI-Build-Nummern oder lange Patch-Zahlen (wie bei Enterprise-Software) sind **kein** Ziel – sie dienen dort oft als eindeutige Build-IDs bei tausenden Deployments. DocsOps: seltene, admin-gesteuerte Releases; `APP_VERSION` bleibt kurz und lesbar (`0.2.0`).
- **Build-Metadaten (optional, später):** Git-Commit-SHA oder Build-Datum **getrennt** von `APP_VERSION` (z. B. in Logs, Backup-Manifest, Admin-About) – nicht als viertes SemVer-Segment oder aufgeblähter Patch.
- **Tooling (optional, später):** [Changesets](https://github.com/changesets/changesets) für halbautomatischen Version-Bump beim Release-PR; kein vollautomatisches semantic-release mit Patch pro Merge.

### Release-Ritual (Checkliste)

1. `version` in Root-`package.json` bumpen (Patch/Minor/Major nach Kriterien oben).
2. `content/releases/<version>.md` schreiben (Englisch, nutzerrelevante Änderungen). Optional am Ende: Abschnitt `## For operators` (Backup, Env, Migration, Downtime) — wird in `/whats-new` **nicht** angezeigt, Admin → System zeigt die volle Datei als Preview vom GitHub-Tag (§26).
3. Eintrag in `content/releases/manifest.json`.
4. `pnpm run lint` + Tests.
5. Git-Tag `vX.Y.Z`, GitHub Release (Bundle + Images, vgl. **§19**).
6. Stack/Images bauen bzw. pullen (`APP_VERSION` kommt aus Schritt 1 automatisch im Image).

### Git-Branches (`main` / `dev`)

| Branch     | Rolle                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`main`** | Release-stabil. Enthält nur Versionen, die als echtes GitHub-Release (`vX.Y.Z`) ausgeliefert werden. `GET …/releases/latest` und Produktions-Updates beziehen sich darauf. |
| **`dev`**  | Tägliche Entwicklung, Feature-Commits, Test-Releases (z. B. Update-Pfad lokal prüfen).                                                                                     |

**Workflow:**

1. Auf **`dev`** entwickeln und committen.
2. Test-Release optional nur von **`dev`**: Version bumpen, `content/releases/*`, Tag `vX.Y.Z`, GitHub Release – **`main` bleibt auf der stabilen Version** (z. B. `0.1.0` in `package.json`), bis der Stand freigegeben ist.
3. Freigabe: **`dev` → `main`** mergen (oder cherry-pick), dann Release-Ritual auf **`main`** (falls noch nicht getaggt).
4. Nach einem Test-Release auf `main` rückgängig machen: `main` auf letzten stabilen Tag zurücksetzen, GitHub-Release/Tag des Tests löschen; Stand mit Test-Version bleibt auf **`dev`**.

**Hinweis:** CI/Release-Workflow baut Images aus dem getaggten Commit; Tags nur als `vX.Y.Z` (SemVer), kein `main`-Deploy (vgl. [Env-und-Config](Env-und-Config.md)).

---

## 2. What's new (`/whats-new`)

**Ziel:** Alle eingeloggten Nutzer sehen, was in der installierten bzw. neueren Versionen neu ist – getrennt von **Help** (Bedienhilfe unter `/help/*`).

### Inhalt & Quelle

- **Nicht** als freie CMS-Inhalte nur in der DB (Drift zur deployten Version).
- **Primär:** versionierte Markdown-Dateien im Repo (`content/releases/*.md`), beim Build eingebunden oder vom Backend aus dem Image gelesen.
- **Rendering:** `react-markdown` (wie bei anderen Markdown-Inhalten im Frontend).
- **API (optional):** `GET /api/v1/releases` – Liste aus Manifest + Markdown-Inhalt; `GET /api/v1/system/version` – aktuelle `APP_VERSION`.

### Navigation & UX

- Route **`/whats-new`** (eigene URL, nicht unter `/help`).
- **Account-Menü** (Sidebar unten): erster Eintrag **What's new** (vor Admin / Help / Settings).
- **Badge „Neu“:** `userPreferences.lastSeenReleaseVersion` (PATCH über `/api/v1/me/preferences`) – Badge, solange die **installierte** Version neuer ist als zuletzt gesehen (Nutzer hat Release Notes der laufenden Version noch nicht geöffnet). Beim Besuch von `/whats-new` wird `lastSeenReleaseVersion` auf die installierte Version gesetzt (Badge verschwindet danach). **Kein** Hinweis auf extern verfügbare Updates (das ist **§26**, nur Admin).
- **Keine** Anzeige „You're on vX.Y.Z“ auf der Seite – installierte Version ist Endnutzern operativ irrelevant; Admins sehen sie unter **§26** (`/admin/system`) und im Account-Menü-Footer.

### Markdown-Konvention (Release Notes)

**Metadaten** in `content/releases/manifest.json`: `version`, `date`, `title` (Kurztitel für API/Liste – sollte mit dem `#`-Titel in der Markdown-Datei übereinstimmen). **Karten-Header:** Package-Icon + `vX.Y.Z`, Datum, optional Badge **Latest** (oberster Manifest-Eintrag). Kein Badge **Installed** (in Prod entspricht Latest meist der installierten Version; Versionsvergleich gehört zu §26). **`#`-Titel und Changelog** im einklappbaren Body (nur neueste Version standardmäßig offen).

In `content/releases/*.md`:

- **`# Release-Titel`** als erste Zeile (z. B. `# Editor & admin polish`) – kein `# DocsOps X.Y.Z` (Version steht in der Karten-Meta-Zeile).
- Optional 1–2 Einleitungssätze als Fließtext.
- Strukturierte Abschnitte unter `###` (case-insensitive):

| `###`-Überschrift | Darstellung in `/whats-new` |
| ----------------- | --------------------------- |
| Features          | grünes Häkchen-Icon         |
| Fixes             | gelbes Bug-Icon             |
| Performance       | violettes Blitz-Icon        |
| Other             | normale `h3`, kein Icon     |
| unbekannt         | normale `h3`, kein Icon     |

Kein `## Highlights`. Listen unter `###` sind Standard-Markdown-Bullets.

Optionaler Abschnitt **`## For operators`** am Ende der Datei (Backup, Env, Migration): wird von der API für `/whats-new` abgeschnitten; Admins sehen den vollen Text in der Upcoming-Preview unter **§26**.

### Abgrenzung

- **Help** = wie nutze ich DocsOps (Organisation, Rechte, Workflow).
- **What's new** = Produkt-/Release-Changelog.
- Optionale öffentliche Demo-Docs (`/docs`, §19) bleiben separat (Landing/Demo-Flag).

---

## 3. Backup (Operational Backup)

**Ziel:** Disaster Recovery und Wiederherstellung nach Fehlbedienung – **wieder einspielbar** als Ganzes (DB + Dateien). **Nicht** dasselbe wie Plattform-Export/Migration (siehe §4).

### Architektur

- **Eigener Job-Typ** `maintenance.backup` (pg-boss) – **nicht** Untertask von `maintenance.cleanup`.
- Ausführung im **Worker**-Prozess (gleiches Image wie API, Entrypoint `worker.ts`) – **kein Sidecar** für Backup v1. Sidecar nur für Update Phase 2 (Docker-Socket), vgl. §5.
- Worker-Image: zusätzlich `postgresql-client` (`pg_dump` / `pg_restore` für Runbook).

### Backup-Bundle (ein Archiv pro Lauf)

Dump und MinIO-Objekte werden **nicht** lose abgelegt, sondern als **ein versioniertes Archiv** mit Manifest:

```text
docsops-backup-<backupId>-<timestamp>.tar.zst
├── manifest.json       # Format-Version, Zeitstempel, APP_VERSION, Checksummen
├── postgres/
│   └── dump.custom     # pg_dump -Fc (Custom Format)
└── minio/
    └── objects/        # Export relevanter Bucket-Keys (Anhänge, Exporte, …)
```

`manifest.json` enthält u. a. `backupFormatVersion`, Größen, SHA-256 pro Teil und über das Gesamtarchiv. Job-Status `succeeded` erst nach erfolgreicher Prüfsummenbildung.

Secrets (`.env`, Session-Secret) **nicht** im Bundle; Restore-Runbook verweist auf separate sichere Ablage.

### Konsistenz (Wartungsmodus)

Kurz **Wartungsmodus** während der Erstellung: **keine Schreibzugriffe** auf die Plattform, dann `pg_dump` und MinIO-Export, danach Archiv bauen. So bleiben DB und Dateien zusammenpassend. Reads optional erlaubt oder komplett gesperrt – in der Implementierung festlegen und dokumentieren.

### Job-Ablauf (ein Prozess)

Alles in **einem** `maintenance.backup`-Handler, sequenziell:

1. Wartungsmodus an
2. `pg_dump` + MinIO-Export → temporäres Archiv + `manifest.json` + Checksummen
3. **Upload** an konfiguriertes Admin-Ziel (falls gesetzt) – im **selben Job**, direkt im Anschluss
4. Metadaten in DB (Status, Größe, Ziel, Remote-Pfad, Checksum)
5. Optional: Webhook(s) bei Erfolg/Fehler (nur Metadaten, s. u.)
6. Temporäre Dateien aufräumen; Wartungsmodus aus

Optional: zusätzliche Kopie im lokalen MinIO-Bucket `backups/` und **Download** über die API (`GET /api/v1/admin/backups/:id/download`, Stream durch DocsOps – kein presigned MinIO-URL im Browser) – nur wenn gewünscht (Offsite-Ziel ist der Normalfall für DR).

**Audit** (wer, wann, Größe, Status, Ziel) – analog Admin-Jobs.

Admin: **Create backup** → `POST /api/v1/admin/backups`.

### Externe Ziele (Admin-konfigurierbar)

Admins legen **Backup destinations** an (Credentials verschlüsselt in der DB, nur `requireAdmin`). Upload = **Push vom Worker** (kein „Empfangs-Endpunkt“ beim Anbieter).

| Typ                  | v1  | Umsetzung                                                                              |
| -------------------- | --- | -------------------------------------------------------------------------------------- |
| **`s3_compatible`**  | ja  | AWS SDK (`PutObject` mit Stream) – gleiche Basis wie MinIO-Anbindung                   |
| **`ssh`** (SFTP/scp) | ja  | SSH-Host, User, Key/Passwort, Zielpfad – nativ im Worker (z. B. `ssh2`), kein `rclone` |
| **`webdav`**         | ja  | HTTP `PUT` nach Archiv (Nextcloud o. Ä.) – gleicher Job-Ablauf wie S3/SSH              |

**Kein `rclone` im Image (v1):** Spart extra Binary, Subprocess-Debugging und generische Remote-Configs; S3 + SSH decken Self-hosted ab. `rclone` nur erwägen, wenn später viele Cloud-Anbieter ohne eigene Integration nötig sind.

SSRF-Schutz bei konfigurierbaren URLs (keine internen Ziele, nur `https`/`sftp` wo sinnvoll).

### Webhook (optional, v1)

Pro Destination oder global: **HTTPS-URL**, die bei Erfolg/Fehler ein **JSON-Event** erhält (`backupId`, `status`, `size`, `checksum`, `finishedAt`, optional zeitlich begrenzte `downloadUrl`). **Kein** Upload der Backup-Datei über den Webhook – nur Benachrichtigung oder Trigger für externe Automation. HMAC-Signatur (`X-DocsOps-Signature`) empfohlen.

### Automatik & Retention

- Scheduler (Cron über pg-boss): Intervall konfigurierbar (Env / Admin-UI).
- `BACKUP_RETENTION_COUNT` (z. B. 7): älteste Backups am **konfigurierten Ziel** und in der Metadaten-Liste löschen.
- Admin-UI: Destinations verwalten, Backups anstoßen, Historie (u. a. Started/Finished, Status, externes Ziel inkl. Typ), Download (falls lokale Kopie); Tab aktualisiert sich per Polling (schnell bei laufendem Job, sonst Intervall im Leerlauf).

### Restore (Operational Backup)

**Phase 1:** dokumentiertes **Runbook** (manuell): Wartungsmodus → Archiv entpacken → Manifest/Checksums prüfen → `pg_restore` → MinIO-Objekte zurück → App starten → Health/Reindex. **Restore einmal testen** (leerer Stack), bevor Produktion darauf vertraut.

**Phase 2:** Admin-Aktion **Restore** im Tab **Admin → Backup**: Archiv aus **Historie** (nur wenn `localObjectKey` vorhanden) oder **Upload** eines `docsops-backup-*.tar.zst` (z. B. manuell von S3/SSH/WebDAV kopiert). Job `maintenance.restore`; Wartungsmodus während Restore; **kein** Download vom externen Ziel. Runbook bleibt für manuelle Notfall-Prozedur.

### Abgrenzung zu Plattform-Export (§4)

Beide sichern **dieselbe logische Plattform** (Organisation, User, Kontexte, Dokumente, Rechte, Dateien). Der Unterschied liegt in **Zweck, Format und Restore-Szenario** – **nicht** in „Dokumente vs. Rest“:

|                      | **Operational Backup** (§3)                               | **Plattform-Export** (§4)                                                          |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Zweck**            | Disaster Recovery auf **derselben** Instanz               | Migration/Klon auf **anderem** Server oder nach Schema-Upgrade                     |
| **Format**           | `pg_dump -Fc` + rohe MinIO-Keys                           | Strukturiertes, versioniertes Export-Format (Domänen-JSON + Dateien)               |
| **Häufigkeit**       | Geplant (z. B. täglich), Retention                        | Selten, **explizit** vom Admin                                                     |
| **Enthält typisch**  | Gesamte DB inkl. Sessions, Job-Queue, Backup-Metadaten    | Domänendaten; **ohne** Betriebsballast (Sessions, pg-boss, Notifications optional) |
| **Restore/Import**   | `pg_restore` + MinIO (Bit-Snapshot)                       | Logischer Import mit **ID-Remapping** über Services                                |
| **Gemeinsamer Job?** | **Nein** – getrennte Job-Typen, UI-Bereiche und Retention |

Vor einer Migration kann ein Admin **nacheinander** DR-Backup und Plattform-Export anstoßen (Sicherheitsnetz + Migrationsartefakt) – das ist **keine** technische Kopplung in einem Job.

---

## 4. Plattform-Export & Migration (separates Feature)

**Ziel:** DocsOps-Inhalte und Struktur auf einem **anderen** Server (oder frischen Stack) wieder nutzbar machen – Umzug, Staging-Klon, Testinstanz, später Tenant-Export (Managed Hosting).

**Nicht** dasselbe wie Operational Backup: kein Ersatz für tägliches DR; **nicht** im selben Job oder Scheduler wie `maintenance.backup`.

### Wann welches Werkzeug?

- **Server kaputt / Rollback auf gestern** → Operational Backup + Restore (§3).
- **Neuer VPS, andere DocsOps-Version, bereinigter Klon, Datenportabilität** → Plattform-Export + Import (§4).

### Architektur

- **Eigene Job-Typen:** z. B. `maintenance.platform-export` und `maintenance.platform-import` (pg-boss, Worker) – analog Backup, aber **separater** Handler und Metadaten-Tabelle.
- **Kein** `pg_dump` im Export; Import **kein** `pg_restore`. Daten fließen über **Domänen-Services** (Organisation, User, Kontexte, Dokumente, Rechte, Storage).
- Kurzer **Wartungsmodus** während Import (Writes gesperrt); Export kann ohne Voll-Wartungsmodus laufen (konsistente Snapshots pro Phase dokumentieren).

### Export-Archiv (Entwurf)

```text
docsops-platform-export-<exportId>-<timestamp>.tar.zst
├── manifest.json           # exportFormatVersion, sourceAppVersion, createdAt, checksums, counts
├── organization.json       # Company, Departments, Teams
├── users.json              # User-Stubs, Rollen-Zuordnungen (Passwort-Policy s. u.)
├── contexts.json           # Prozesse, Projekte, Hierarchie
├── documents.json          # Metadaten, Versionen/Blocks, Tags
├── grants.json             # explizite Document-Grants
├── files/                  # Binaries (Export-Refs, nicht Quell-MinIO-Keys)
└── attachments-map.json    # documentExportId → file refs
```

**Bewusst nicht** (Standard v1): Sessions, pg-boss-Jobs, In-App-Notifications, `BackupRun`/Destinations, Audit-Logs. Secrets (`.env`, `SESSION_SECRET`, `BACKUP_ENCRYPTION_KEY`) **nie** im Archiv.

`manifest.json`: `exportFormatVersion`, SHA-256 pro Teil, Anzahlen (User, Dokumente, Dateigröße).

### Export-Ablauf (Job)

1. Metadaten-Snapshot / konsistente Lesephase (ggf. kurze Write-Pause nur wenn nötig)
2. Domänendaten serialisieren (stabile **Export-IDs** in JSON, nicht DB-UUIDs als Import-Ziel)
3. Dateien aus MinIO in `files/` kopieren
4. Archiv + Checksummen; optional Download / externes Ziel (eigenes Retention-Modell, **nicht** `BACKUP_RETENTION_COUNT`)

### Import-Ablauf (Job + UI)

**Admin-UI (eigener Bereich):** Tab **Admin → Migration** (Route z. B. `/admin/migration`) – **nicht** im Backup-Tab. Backup-Tab bleibt **Operational / Disaster recovery**; Restore aus DR-Backups gehört dorthin (§3 Phase 2).

**UI-Schritte (v1):**

**Export-Wizard (Modal):**

1. **Overview** – Inhalt des Pakets; Hinweis DR ≠ Migration (Link Backup-Tab)
2. **Confirm** – Export starten
3. **Progress** – Job-Status (Polling)
4. **Done** – Auto-Download bei Erfolg, erneuter Download optional

**Import-Wizard (Modal):**

1. Export-Archiv **hochladen**
2. **Preflight** – Format, Version, Vorschau; Fehlerliste prominent
3. **Optionen** – Passwort-Hashes übernehmen (nur gleiche `APP_VERSION`)
4. **Bestätigung** – Warnung Wartungsmodus / leere Instanz
5. **Progress** – Phasen + Fehler
6. **Done** – Report

Die Tab-Ansicht zeigt **letzten Export-Status** und Import-CTA; **keine** Export-/Import-Historie-Tabellen (Runs bleiben in DB für Audit/Jobs).

**Job-Phasen (sequenziell, Worker):**

1. Wartungsmodus an
2. Archiv entpacken; Manifest + Checksummen prüfen
3. Kompatibilität: `exportFormatVersion` ↔ Importer (ggf. Adapter pro Quell-`APP_VERSION`)
4. Import in Reihenfolge mit **ID-Remapping** (Export-ID → neue UUID):
   - Organization → Users (+ TeamMember, Leads) → Contexts → Documents (+ Versionen, Tags, Rechte) → Files (MinIO, neue Keys, DB patchen)
5. Import-Metadaten in DB; Temp aufräumen; Wartungsmodus aus
6. Benachrichtigung an Admins (`platform-import-succeeded` / `-failed`); Reindex anstoßen

Import-Logik in **Services**, nicht Roh-Prisma in Routes; Rechte- und Lifecycle-Regeln gelten wie bei normalem Betrieb.

### v1-Umfang vs. später

| v1                                        | Phase 2+                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Vollständiger Export/Import einer Instanz | Selektiver Export (eine Company / Tenant)                                                       |
| Import nur in **leere** Ziel-DB           | Merge in bestehende Instanz (Konfliktregeln)                                                    |
| Passwort-Reset nach Import (Default)      | SSO-only / Hash-Übernahme policy-gesteuert                                                      |
| Admin-UI + Job + Audit                    | Upload von externem Ziel; CLI-Skript für Offline-Import                                         |
| **Push an Ziel-Instanz**                  | Ziel erzeugt URL + Token; Quell-Wizard liefert Paket direkt (TTL, single-use, Confirm auf Ziel) |

### UI-Platzierung (festgelegt)

| Bereich                                    | Inhalt                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Admin → Backup** (`/admin/backup`)       | Operational Backup: Ziele, Schedule-Hinweis, Historie, Download, **Restore aus DR-Archiv** (Phase 2) |
| **Admin → Migration** (`/admin/migration`) | Letzter Export-Status, Export-/Import-Wizard (Stepper-Modals), kein Historie-Grid                    |
| **Admin → System** (`/admin/system`, §5)   | Version, Update, Backup-Gate – kein Migrations-Export                                                |

Tab-Label Backup: **Backup** oder **Disaster recovery** (nicht „Data backup“ – zu unscharf; Plattform-Export ist ebenfalls „Daten“).

### Abhängigkeiten

- Block-Schema: Export serialisiert `schemaVersion`; Import braucht ggf. **Migrations-Adapter** bei DocsOps-Versionswechsel ([Edit-System](Edit-System-Blocks-Suggestions-Lead-Draft.md)).
- Managed Hosting: Tenant-Löschung / Suspend → Plattform-Export ([Plan-Managed-Hosting](Plan-Managed-Hosting.md) §9).

---

## 5. Update (Admin)

**Ziel:** Admins sehen installierte vs. verfügbare Version und können Updates kontrolliert anstoßen.

### Abgrenzung zu §24 (What's new)

| Thema                    | §24 (alle Nutzer)                                      | §26 (Admin)                                 |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------- |
| Release Notes lesen      | `/whats-new`, Markdown aus dem **Image**               | –                                           |
| Installierte Version     | intern für `lastSeen`-Badge; **nicht** prominent in UI | **`APP_VERSION`** sichtbar                  |
| Neuere Version verfügbar | **nein** (Notes nur für mitgelieferte Versionen)       | GitHub Releases / Registry vs. installiert  |
| Update anstoßen          | **nein**                                               | Runbook / `update.sh` (§19), später Sidecar |

Release Notes im Image enthalten nur Versionen, die beim Build mitgeliefert wurden. Endnutzer sehen **keine** Changelogs für noch nicht deployte Versionen.

### Phase 1 (empfohlen zuerst)

- Admin-Tab **`/admin/system`** (neben Users, Backup, …).
- Anzeige: **`APP_VERSION`** (installiert) vs. neueste Version (GitHub Releases API).
- Env **`DOCSOPS_UPDATE_GITHUB_REPO`** (`owner/repo`): optional; fehlt → Default `bjkawecki/docs-ops`. **Ein/Aus** über Admin → System (`SystemSettings.updateCheckEnabled`, `PATCH /admin/system/settings`).
- Aktionen: **Check for updates** (Refresh + optional In-App an Admins, Kategorie `operations`, Event `update-available`).
- Links: GitHub-Release-URL; Runbook-Schritte im Modal „View update steps“ (**§19**).
- **Backup-Gate:** Modal mit Bestätigung „Backup exists“ vor Anzeige von `update.sh` (**§25**).
- Sidebar: Update-Hinweis neben `vX.Y.Z` für Admins; Tab-Badge bei Update verfügbar.
- Cache: GitHub-Abfrage max. 1× pro 24h (GET); manueller POST bypass.
- **Upcoming release preview:** Wenn `updateAvailable`, lädt das Backend `content/releases/{latest}.md` vom Release-Tag (raw GitHub) und zeigt sie eingeklappt im System-Tab (inkl. `## For operators`).

### Phase 1 – Umsetzungsschritte (Skizze)

1. Zod-Schema + `GET /api/v1/admin/system/update-status` (Cache TTL für GitHub-Abfrage).
2. Optional `POST /api/v1/admin/system/check-updates` (Refresh, Admin-Notification bei `latest > installed`).
3. Admin-UI: Statuskarten, Fehlerzustand wenn Check deaktiviert/Fehler, Tab-Badge bei Update verfügbar.
4. Frontend-Notification-Formatter + Link `/admin/system` für `update-available`.
5. Tests (Mock GitHub); Doku in [Env-und-Config](Env-und-Config.md).

### Phase 2 (Ein-Klick-Update)

- **Nicht** das Haupt-App-Backend mit vollem Docker-Socket auf dem Host betreiben.
- Separater **Updater-Sidecar** (`docsops-updater`): App ruft `POST /api/v1/admin/updates/apply` → automatisches `maintenance.backup` (`pre_update`) → Job `maintenance.apply-update` → Sidecar startet One-Off-Container (`scripts/updater-exec-update.sh` → `scripts/update.sh`: Release-Bundle + `compose pull` + `up -d`) → Job `maintenance.watch-update` pollt Sidecar-Exit-Code.
- Sidecar = Begleit-Container mit Docker-Socket und `/opt/docsops`-Mount; Shared Secret `DOCSOPS_UPDATER_TOKEN`.
- Wartungsmodus (`reason: update`) während Apply; Startup-Reconciliation + Admin-Notifications (`update-succeeded` / `update-failed`).
- Rollback: Env-Backup + vorheriges Bundle, `update.sh` mit altem Tag (Runbook).

Siehe auch [Infrastruktur §3](Infrastruktur-und-Deployment.md#3-update-aus-der-app).

---

## 6. Empfohlene Reihenfolge

1. **Backup v1** (§25): Bundle + Wartungsmodus + `maintenance.backup` + Admin-Destinations (S3, SSH) + Upload im selben Job + Runbook/Restore-Test
2. Version-API + Release-Manifest + `/whats-new` + Menü/Badge (§24; kann parallel zu Backup)
3. Update UI Phase 1 + `update.sh` (§26; Backup-Gate)
4. Backup Phase 2: Restore-UI im Backup-Tab, WebDAV-Ziel, optional Webhook-Härtung
5. **Plattform-Export & Import** (§4, Umsetzungs-Todo §27) – eigener Admin-Tab Migration
6. Update Phase 2 (Updater-Sidecar)

Siehe auch [Infrastruktur §12](Infrastruktur-und-Deployment.md) (Managed Hosting, optional, später).

---

## 7. Env-Variablen (Entwurf)

| Variable                     | Bedeutung                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `APP_VERSION`                | Beim Image-Build aus Root-`package.json`; Runtime nur Env (kein Fallback)                         |
| `DOCSOPS_UPDATE_GITHUB_REPO` | `owner/repo` für Admin Update-Check (§26); Default `bjkawecki/docs-ops`. Ein/Aus: Admin → System. |
| `BACKUP_RETENTION_COUNT`     | Max. Anzahl behaltener Backups (pro Destination / global – bei Implementierung festlegen)         |
| `BACKUP_SCHEDULE_CRON`       | Optional, Scheduler für automatische Backups                                                      |
| `UPDATE_CHECK_URL`           | Optional, URL für Versionsabfrage (Default: GitHub Releases)                                      |

Backup-Ziele (S3-Endpoint, SSH-Host, …) primär **in der DB** über Admin-Destinations, nicht als flache Env-Liste. Details in [Env-und-Config](Env-und-Config.md), sobald implementiert.
