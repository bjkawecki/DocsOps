# Do11y – Docs Observability (Konzept)

**Interner Kurzname:** Do11y (analog zu o11y / Observability).  
**UI-Name:** EN **Freshness** · DE **Aktualität** (App + API: `freshness`)  
**Umsetzung:** [Umsetzungs-Todo §29](Umsetzungs-Todo.md) · **Phasen:** [Plan-Do11y-Phasen.md](Plan-Do11y-Phasen.md)  
**Verwandt:** Pulse / Most read ([§13](Umsetzungs-Todo.md#13-dashboard--home)), API-Freshness als optionales Hart-Signal ([§28c](Umsetzungs-Todo.md#28c-api-freshness-für-system---anwendungsressourcen-docs-geplant))

## Problem

Dokumentation kann „alt“ sein und trotzdem gültig. Bloßes Alter oder fehlende Edits sind **kein** Veraltet-Urteil. Leads und Knowledge Manager brauchen einen **geführten Scan** und ein Board mit **Handlungsbedarf**: entscheiden, Pflichtaktion setzen – ohne Dauer-Alarmierung und ohne Notification bei jedem Scan.

## Zielbild

Do11y macht **Zustand und Aktualität** für verantwortliche Rollen sichtbar und entscheidbar:

| Baustein (Ist / Plan)              | Rolle in Do11y                                        |
| ---------------------------------- | ----------------------------------------------------- |
| Freigegebener Stand + Lead-Publish | Was gilt                                              |
| Most read (Scope)                  | Was wird gelesen (bleibt scope-lokal)                 |
| Pulse                              | Laufende Arbeit – getrennt von Freshness / Aktualität |
| Health-check-Hub + Scan            | Handlungsbedarf-Liste und Entscheidungen              |
| §28c API-Freshness (optional)      | Hartes Signal nur für Resource-/Ops-Docs              |

**Abgrenzung:** Pulse = Arbeits-Feed. Most read = Popularität. Do11y / Freshness = Aktualitätsprüfung und Führungsentscheidung.

## UI-Name & Navigation

|                      |                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| EN                   | **Freshness**                                                                                   |
| DE                   | **Aktualität**                                                                                  |
| Intern               | Do11y                                                                                           |
| Route (Orientierung) | App `/freshness` · API `/api/v1/me/freshness` · Doc-Actions `/api/v1/documents/:id/freshness/…` |
| Icon                 | FileCheck (kein Uhr/Kalender/Heart)                                                             |

**Einstieg:** Main-Sidebar unter **Tools / Werkzeuge**. Nav nur für Nutzer mit Scan-Recht (Lead/KM); Admin ohne Nav-Eintrag.

## Rollen & Scan-Hierarchie

| Rolle                     | Board / Scan                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Company Lead**          | Company + Departments + Teams darunter                                                        |
| **Department Lead**       | eigenes Department + Teams darunter                                                           |
| **Team Lead**             | nur eigenes Team                                                                              |
| **Knowledge Manager**     | zugewiesene Scopes (Lead-äquivalent dort)                                                     |
| **Admin**                 | **kein** Scan, **kein** Board; nur Plattform-Settings (Default-Intervall, Auto-Scan-Schalter) |
| **Normale Leser/Autoren** | kein Hub; Needs-update-Ping nur an Write-Grants + Scope-Authors                               |

Rechte über Permissions-Layer (`isScopeLead` / KM-Scopes) – **kein** Admin-Bypass fürs Board. KM ∩ Lead: beide dürfen handeln; **ein** Status am Dokument.

**Personal-Scope:** außerhalb Do11y.

### Lead-Kardinalität (Notifications)

| Scope          | Leads                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| **Team**       | **genau einer** (Hauptverantwortliche)                                             |
| **Department** | **genau einer**                                                                    |
| **Company**    | **mehrere erlaubt**; Do11y-Notifs an **alle** Company Leads bei Company-Owner-Docs |

Enforce Team/Department in Zuordnungs-APIs – Bugfix [Umsetzungs-Todo §9 / §29](Umsetzungs-Todo.md).

## Handlungsbedarf (= Candidate)

**Ein Konzept:** `action_needed` / `is_candidate` meinen dasselbe – **jemand muss handeln**. Kein getrennter „nur Kandidat“-Status.

**Default-Liste im Hub = alles mit Handlungsbedarf**, einschließlich:

- vom Scan als fällig gesetzt
- **Needs update** (bis Publish)
- **abgelaufenes Snooze** (wieder Handlungsbedarf)

Optional zusätzliche Filter-Unterarten (z. B. nur Needs update); die Sammelliste bleibt „alles“.

## Hub, Liste & Scan

- **Beim Öffnen:** Handlungsbedarf-Liste im erlaubten Teilbaum (sofort). Nach Zustand/Unterart **filterbar**.
- **Scan:** gleicht published Docs gegen Fälligkeit ab und setzt/ändert Status. Default = erlaubter Teilbaum; optional fein.
- **Manuell immer**; **Auto-Scan später**. „Do11y aus“ = keine automatischen Scans.
- **Unveröffentlicht / archiviert:** nie prüfen / nicht im Board.
- **Publish:** Do11y-Status **zurücksetzen** (Uhr ab neuem Publish + Intervall).

## Uhr & Prüfintervall

**Vor erster Attestation:** Fälligkeit aus letztem **Publish** + Intervall.  
**Nach „Noch aktuell“:** Anker = **jetzt + gewähltes Intervall** (Stufen; Default Doc-/Org-Intervall).  
**Legacy abgelaufenes Snooze:** weiter Handlungsbedarf, in der UI wie Prüftermin (`due`).

| Quelle                   | Regel                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Admin Org-Default**    | **90 Tage**; Platform-Admin-UI                                                       |
| **Pro Dokument**         | Stufen **30 / 60 / 90 / 180 / 365**; Create (Default = Org) + Metadaten ohne Publish |
| Wer ändert Doc-Intervall | **nur Lead/KM**                                                                      |

## Aktionen

| Aktion                                        | Wirkung                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Still current** (DE: Noch aktuell) + Termin | Attestation; nächste Prüfung = jetzt + gewähltes Intervall; raus aus der Liste                                           |
| **Needs update** (DE: Update nötig)           | Hub-Stand; bleibt gelistet bis Publish / Noch aktuell; Ping an **Document-Write-Grants + Scope-Authors** (nicht Lead/KM) |
| **Archive** (DE: Archivieren)                 | Hub-Stand (`healthCheckNeedsArchive`); Empfehlung, noch kein Lifecycle; Doc-Menü archiviert wirklich (Flags clear)       |

**Filter:** Grund = Eingangsgrund (`all` / `due` = Prüftermin erreicht); Stand = `open` \| `needs_update` \| `archive`.

**Verworfen:** separate Hub-Aktion „Snooze / Zurückstellen“ (war Doppelung zu Noch aktuell + Termin).

## Notifications (kein Scan-Spam)

- Nur bei **Statuswechsel** / Änderung der Handlungsbedarf-Menge – nicht bei jedem Scan ohne Änderung.
- Aggregiert **pro Owner-Scope**; Text = **Ist-Zahl** (5 schon offen + 5 neu → „**10** Dokumente haben Handlungsbedarf“); Coalescing.
- Empfänger:
  - Team-/Department-Owner: der **eine** Lead
  - Company-Owner: **alle** Company Leads
  - Scan von oben ändert Kinder-Docs → Leads der **betroffenen** Owner-Scopes
- Needs update: Ping an Write-Grants + Scope-Authors.
- Auto-Scan / Scheduler: später.

## Dokument-UI & Audit

- **Details-Card** (Lead/KM): nächste Prüfung, letzte Entscheidung, Akteur, Auto vs. manuell.
- Kein Alters-Banner für normale Leser.
- **Audit:** wer, wann, Aktion, nächste Prüfung.

## Nicht-Ziele (v1)

- Health-Score ohne Aktion; Alters-Stigma in der Leser-Ansicht; Personal-Scope; Auto-Scan zuerst; Landing-Buzzword vor Live-Hub

## Umsetzung

Lieferphasen, Abhängigkeiten, API-Skizze und Akzeptanzkriterien: **[Plan-Do11y-Phasen.md](Plan-Do11y-Phasen.md)** (Phasen 0–5; v1 = 0–3).
