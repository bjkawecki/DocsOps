# Landing Page – Plan & Technik

**Status:** §19 – `apps/landing` existiert; **inhaltliche Leitlinie:** [Positionierung-und-Landing.md](./Positionierung-und-Landing.md)  
**Sprache Landing:** Deutsch · **App/Demo:** Englisch  
**Domain:** `docsops.de` · Demo: `demo.docsops.de`  
**Design:** Mantine 8, dunkles Theme (Coolify-inspiriert)

---

## 1. Ziel

- Erklären, **wofür** DocsOps gedacht ist (offizieller Wissensstand, Hierarchie, Veröffentlichung).
- **Abgrenzen:** anderer Weg als „alle schreiben gleichzeitig“ – siehe [Positionierung §1–3](./Positionierung-und-Landing.md) und `/philosophie`.
- **Vertrauen:** Self-hosted, Open Source (MIT), Impressum/Datenschutz.
- **Konvertieren:** Story verstehen → Philosophie (optional) → Live-Demo oder `/install`.

**Nicht:** vollständige Produkt-Doku (Help in der App), Feature-Checkbox-Schlacht, Vergleichstabelle auf der Startseite.

---

## 2. Technik

| Aspekt  | Stand                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| Stack   | `apps/landing` – Vite + React + Mantine 8                                                                     |
| Theme   | Fest dark, Cornflower-Blue-Akzent                                                                             |
| Build   | `make landing-build` → `apps/landing/dist`                                                                    |
| Env     | `VITE_DEMO_URL`, `VITE_GITHUB_REPO_URL`, `VITE_SITE_URL`, optional `VITE_SPONSOR_GITHUB_URL` (`.env.example`) |
| Version | `VITE_APP_VERSION` aus Root-`package.json` beim Build (Vite `define`)                                         |

**Lokal:** `make landing-dev` → http://localhost:5174 · Demo-CTA default `http://localhost:5000`

---

## 3. Seitenaufbau

**Leitplan Sections:** [Landing-Sections-Plan.md](./Landing-Sections-Plan.md)

### Startseite `/`

1. Navbar (Desktop + Mobile Drawer)
2. Hero (Demo extern · Installation → `/install`)
3. **Scope** (`#scope`)
4. **Kontext** (`#kontext`)
5. **Rollen** (`#rollen`) – Titel: Rollenbasierte Zusammenarbeit
6. **Beispiel** (`#einordnen`)
7. **Philosophie-Teaser** → `/philosophie`
8. **Abschluss-CTA** (Demo · Installation · Link Philosophie)
9. Footer (Version-Badge → `/changelog`)

**Zurückgestellt auf `/`:** Feature-Grid, Vergleichstabelle, FAQ.

### Routen

| Route                        | Inhalt                                                               |
| ---------------------------- | -------------------------------------------------------------------- |
| `/`                          | Startseite                                                           |
| `/philosophie`               | Philosophie (Abgrenzung indirekt, keine Vergleichs-CTA)              |
| `/warum`, `/ansatz`          | Redirect → `/philosophie`                                            |
| `/install`                   | Marketing-Install (curl, Voraussetzungen, Link zu `docs/install.md`) |
| `/changelog`                 | Root-`CHANGELOG.md` (Build-Import)                                   |
| `/sponsor`                   | Sponsor us. (externe Links per Env)                                  |
| `/vergleich`                 | Hub (**ohne Navbar/Footer-Link**, Demnächst)                         |
| `/impressum`, `/datenschutz` | Strukturierte Platzhalter (`legalCopy.ts`) – vor Go-live ausfüllen   |

---

## 4. Navbar & Footer

**Navbar (Desktop):** Logo · **So funktioniert’s** ▾ · **Philosophie** · **Projekt** ▾ · **Live-Demo**

- So funktioniert’s: `#scope`, `#kontext`, `#rollen`, `#einordnen`
- Projekt: GitHub ↗, Changelog, Sponsor us., Install-Doku ↗

**Navbar (Mobile):** Burger/Drawer mit gleichen Links + Demo-CTA.

**Footer:** Produkt · So funktioniert’s · Projekt · Rechtliches · `vX.Y.Z` → Changelog

Externe Links: einheitlich mit External-Icon (`LandingExternalLink`).

---

## 5. Vergleich & FAQ

- Kein `/vergleich` in Navigation; Abgrenzung indirekt auf `/philosophie`.
- Tabellendaten bleiben in [vergleich/](./vergleich/) für spätere Head-to-head-Seiten.
- FAQ-Komponente existiert, Startseiten-Einbindung weiter zurückgestellt.

---

## 6. Demo & Landing

| Thema          | Landing                              | Demo                                          |
| -------------- | ------------------------------------ | --------------------------------------------- |
| Storytelling   | Hierarchie, Rollen, Beispiel, Teaser | Seed-Dokumente (IT / Software X / A11y-Stand) |
| Erster Kontakt | Hero → Modell → CTA                  | Login / Enter demo                            |
| Rechtliches    | Impressum, Datenschutz (Platzhalter) | Demo-Banner (später)                          |

---

## 7. Offene Punkte

### Inhalt

- [x] Modell-Sections, Beispiel, Philosophie-Teaser, Abschluss-CTA
- [x] `/philosophie`, `/install`, `/changelog`, `/sponsor`
- [ ] Impressum/Datenschutz: Platzhalter `[FIRMA]` etc. vor Go-live ersetzen
- [ ] Vergleichstabelle & FAQ reaktivieren (optional)
- [ ] Demo-Seed-Story

### Technik

- [x] Mobile Navbar, OG-Tags, Hero LCP-Attribute, Version-Badge
- [ ] `Caddyfile.local` + Hosts-Doku
- [ ] VPS + DNS · SPA-Fallback für neue Routen prüfen

---

## 8. Referenzen

- [Landing-Sections-Plan.md](./Landing-Sections-Plan.md)
- [Positionierung-und-Landing.md](./Positionierung-und-Landing.md)
- [install.md](../install.md) – vollständige Installationsdoku (extern verlinkt)
