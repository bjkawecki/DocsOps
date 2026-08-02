# Öffentliche Demo, Domains & Sprache

**Status:** Planungsnotiz – Details für Marketing, Live-Demo und rechtlichen Rahmen. Umsetzung über [Umsetzungs-Todo §19–§20](Umsetzungs-Todo.md), sobald die Plattform demo-tauglich ist. Ergänzt [Infrastruktur §11](Infrastruktur-und-Deployment.md).

---

## 1. Zielbild

DocsOps bleibt **self-hosted-first**. Zusätzlich eine **öffentliche Präsenz**:

| Schicht                      | Beispiel-URL              | Inhalt                                                             |
| ---------------------------- | ------------------------- | ------------------------------------------------------------------ |
| **Marketing**                | `https://docsops.de`      | Landing (zunächst **Deutsch**), Impressum, Datenschutz, CTA „Demo“ |
| **Live-Demo**                | `https://demo.docsops.de` | **Eigene Instanz** – volle App, Wegwerf-Daten                      |
| **OSS / Projekt** (optional) | `https://docsops.org`     | Redirect oder Projekt-Gesicht (GitHub, englische OSS-Doku)         |
| **Self-hosted**              | beim Kunden               | unabhängig von Demo                                                |

**Nicht** Marketing und Demo in einer produktiven Kunden-Instanz mischen.

---

## 2. Architektur

### Marketing vs. Demo trennen

- **Landing** kann zunächst **statisch** sein (eigener Build, Caddy `file_server`, oder später `VITE_LANDING_PAGE_ENABLED` im App-Frontend – siehe §19).
- **Demo** = immer **eigener Compose-Stack** (eigene PostgreSQL, MinIO, Volumes), idealerweise isoliert vom eigenen Betrieb.

```text
docsops.de              → statische Landing (DE)
demo.docsops.de         → DocsOps-Stack (App, Worker, DB, MinIO, Caddy)
```

### Vergleichbare Projekte (üblich)

- Öffentliche Marketing-Site + „Try live demo“
- **Gemeinsamer Demo-Login** oder Button „Enter demo“ (Session ohne sichtbares Passwort)
- **Writable Demo** mit **periodischem Reset** (Seed-Daten) – Standard bei OSS-Demos
- Alternative **read-only** (weniger Abuse, weniger Überzeugungskraft)

Empfehlung für DocsOps: **writable + Reset** (z. B. alle 6–24 h).

---

## 3. Domains

### Gehaltene Domains (Stand Planung)

| Domain             | Rolle                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| **`docsops.de`**   | **Hauptmarke** – Landing, Demo-Subdomain, DACH-Vertrauen, Impressum                |
| **`docsops.org`**  | **OSS/Projekt** – optional Redirect auf `.de` oder englische Projektseite / GitHub |
| **`docs-ops.com`** | günstig verfügbar; optional später international oder Redirect                     |

`docsops.com` ist am Aftermarket teuer (Premium) – **nicht** nötig für den Start.

### TLD-Einordnung

- **`.de` + englisches Produkt** ist **kein Widerspruch** (TLD = Standort/Vertrauen, UI-Sprache = Produkt).
- **Englisch** bleibt Standardsprache im Code und in der App (vgl. Projekt-Regeln); **deutsche Landing** ist bewusst ein separater Kanal.

### Subdomains (Vorschlag)

- `docsops.de` – Marketing
- `demo.docsops.de` – Live-Demo
- `docs.docsops.de` – optionale Produkt-Doku (oder `/docs` auf Hauptdomain)

---

## 4. Sprache & i18n

**Detailvorgaben (Stack, Keys, Locale-Reihenfolge, Phasen, Pflege):** [Plan-App-i18n](Plan-App-i18n.md).

### Getrennte Kanäle (bewusst)

| Bereich                     | Sprache (Start)                                      |
| --------------------------- | ---------------------------------------------------- |
| **Produkt (App)**           | **i18n EN + DE**; Keys/Fallback **Englisch**         |
| **Marketing/Landing**       | zunächst **nur Deutsch** (nicht im App-i18n-Katalog) |
| **README / GitHub**         | Englisch                                             |
| **Help in der App**         | EN zuerst; nicht blockieren                          |
| **Impressum / Datenschutz** | Deutsch (auf `.de`-Landing)                          |

### App-Locale

- Reihenfolge: Preference (eingeloggt) → `?lang=` → Browser → Fallback **EN**
- Persistenz über `userPreferences.locale` (Settings)
- Landing soll erwähnen: „Die App ist auf Deutsch und Englisch verfügbar“
- Demo-Link optional mit `?lang=de` / Sprachwahl auf der Landing – vermeidet Sprung DE-Landing → EN-App ohne Hinweis

### Pflege

- Jeder neuer UI-Text: EN + DE (oder EN + TODO-DE für unwichtige Labels)
- Landing **nicht** in App-i18n – statischer DE-Content entkoppelt
- Semantische Keys; Backend-Fehlercodes EN, Mapping im Frontend; Lint/CI gegen Literal-Strings nach Gerüst

---

## 5. Demo-Zugang & Missbrauch

### Zugang

- **Demo-Login mit Rollenwahl** (festgelegt): In `DEMO_MODE` Login-UI mit Auswahl **Admin | Company Lead | Department Lead | Team Lead | User** → Session als Seed-Account. **Kein** Dev-Debug-Menü / Impersonate.
- Optional zusätzlich sichtbare Demo-Credentials auf der Landing.
- Alternative später: Button **„Enter demo“** → Default-Rolle (z. B. Team Lead).

### Reset & Ops

- **Täglicher Reset** via Job oder Host-Skript `docsops-demo reset`.
- **`docsops-demo`:** install / reinstall / update / status gegen **GitHub Releases** (Versionen listen + wählen).
- UI-Banner: „Demo – resets daily“.

### Admin in DEMO_MODE

- Gefährliche Admin-**Routen serverseitig 403**; UI ausblenden allein reicht nicht.

### Technische Maßnahmen

| Maßnahme                                | Zweck                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------- |
| **Eigene Demo-Instanz**                 | Keine Kunden-/Produktionsdaten                                              |
| **Automatischer Reset** + **Seed**      | Vandalismus, Schimpfwörter, Müll verschwinden                               |
| Env **`DEMO_MODE=true`**                | Kein Mail-Versand, kein Self-Register, ggf. eingeschränkte Admin-Funktionen |
| **Rate Limiting**                       | Bots, Brute Force                                                           |
| Optional **CAPTCHA** vor Demo-Login     | Bot-Spam                                                                    |
| **Kurze Sessions**                      | Weniger dauerhafte Missbrauchs-Sessions                                     |
| **Upload-Limits**                       | Storage-Missbrauch                                                          |
| **Disclaimer** auf Landing + Login      | Keine vertraulichen echten Daten                                            |
| **`robots.txt` / noindex** für Demo-App | SEO der Müll-Inhalte vermeiden                                              |
| UI-Hinweis                              | z. B. „Demo – resets daily“                                                 |

Profanity-Filter im Editor: optional, meist **unnötig** bei täglichem Reset.

### Nutzerinhalte & Verantwortung (keine Rechtsberatung)

- Als **Betreiber** einer öffentlichen Demo mit **nutzergenerierten Inhalten** gilt: **nicht** pauschal für jeden Satz verantwortlich, aber **nicht** ignorieren, sobald **eindeutig illegale** Inhalte bekannt sind (löschen, ggf. melden).
- **Schimpfwörter / Vandalismus:** vor allem **Image-Problem** – löst **Reset** + Seed, nicht Dauer-Moderation.
- **Strafrechtlich relevante Inhalte:** ernst nehmen, sofort entfernen, bei Bedarf anwaltlich klären.
- **Nutzer** sollen **keine echten Interna** in der Demo eintragen – klar kommunizieren.

### Rechtliches auf `.de` (Rahmen)

- **Impressum** und **Datenschutz** auf der Landing (DE)
- Kurze **Nutzungsbedingungen Demo** (vor „Enter demo“): verbotene Inhalte, Wegwerf-Daten, kein Anspruch auf Speicherung
- Datenschutz: Demo, Logs, Cookies, Speicherdauer bis Reset

---

## 6. Umsetzung im Produkt (später)

### Demo-Modus (Backend/Env)

- `DEMO_MODE=true` auf Demo-Instanz
- Job/Cron: **`demo.reset`** – DB leeren, Seed laden, MinIO-Demo-Bucket leeren
- Seed-Daten: **eine** Sprache (DE oder EN) für Beispieldokumente; Hinweis „sample data“

### Optionale integrierte Landing (Alternative zu statisch)

- Feature-Flag `VITE_LANDING_PAGE_ENABLED` (vgl. §19): `/` Landing, `/docs` Produkt-Doku
- Für Start kann **statische DE-Landing** auf `docsops.de` + **separate Demo-Subdomain** einfacher sein

### Abgrenzung

- **What's new** (`/whats-new`, §24) = Release Notes für **eingeloggte** Nutzer – nicht die öffentliche Marketing-Docs-Page.

---

## 7. Go-Live-Checkliste (Demo)

- [ ] `demo.docsops.de` – eigene Instanz, isolierte Volumes
- [ ] Seed + automatischer Reset (Cron/Job dokumentiert)
- [ ] `DEMO_MODE` + Rate Limits, kein E-Mail-Versand
- [ ] Disclaimer + Nutzungsbedingungen Demo + Impressum/Datenschutz (DE)
- [ ] Hinweis Landing: keine vertraulichen Daten; App EN/DE
- [ ] Monitoring (Disk, CPU, Traffic)
- [ ] `docsops.org` → Redirect oder OSS-Rolle festgelegt

---

## 8. Empfohlene Reihenfolge

1. Plattform intern demo-stabil (Seed, Basis-Features) – weitgehend erreicht
2. **App-i18n EN + DE** (vor öffentlicher Demo)
3. Statische **DE-Landing** auf `docsops.de` (Code fertig; Deploy + Legal-Platzhalter)
4. **Demo-Subdomain** mit Seed-Accounts (Rollen), täglichem Reset, `DEMO_MODE`
5. Optional: integrierte Landing per Flag; `docsops.org`-Strategie verfeinern; Vergleich/FAQ auf Landing

---

## 9. Offene Punkte

- Formulierung Nutzungsbedingungen / Disclaimer (Anwalt)
- „Enter demo“ vs. sichtbare Demo-Credentials
- **Rollen-UX:** Seed-Accounts (A) vs. Demo-Switcher (B) vs. beides – Entscheidung vor Umsetzung
- Seed-Sprache (DE vs. EN) für `demo.docsops.de` (bei App-i18n: DE-Seed sinnvoll)
- Öffentliche Produkt-Doku: nur Landing-Abschnitt vs. `docs.docsops.de`

**Nächster Schritt:** App-i18n EN/DE nach [Plan-App-i18n](Plan-App-i18n.md); parallel Rollen-Entscheidung für Demo; dann Landing-Deploy + Demo-Stack.
