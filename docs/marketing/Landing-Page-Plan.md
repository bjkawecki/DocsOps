# Landing Page – Plan & Technik

**Status:** §19 – `apps/landing` existiert; **inhaltliche Leitlinie:** [Positionierung-und-Landing.md](./Positionierung-und-Landing.md)  
**Sprache Landing (Ziel):** Deutsch + Englisch · **App/Demo:** EN/DE (App-i18n)  
**Domain:** `docsops.de` · Demo: `demo.docsops.de`  
**Design:** Mantine; Light/Dark/Auto (siehe §9)

---

## 1. Ziel

- Erklären, **wofür** DocsOps gedacht ist (offizieller Wissensstand, Hierarchie, Veröffentlichung).
- **Abgrenzen:** anderer Weg als „alle schreiben gleichzeitig“ – siehe [Positionierung §1–3](./Positionierung-und-Landing.md) und `/philosophy` (EN: `/en/philosophy`).
- **Vertrauen:** Self-hosted, quelloffen, Impressum/Datenschutz (DE+EN).
- **Konvertieren:** Story verstehen → Philosophie (optional) → Live-Demo oder `/install`.

**Nicht:** vollständige Produkt-Doku (Help in der App), Feature-Checkbox-Schlacht, volle Vergleichstabelle auf der Startseite (Vergleich lebt auf `/compare`).

---

## 2. Technik

| Aspekt  | Stand                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------- |
| Stack   | `apps/landing` – Vite + React + Mantine 8                                                                     |
| Theme   | Light/Dark/Auto (`prefers-color-scheme` + Toggle + Persistenz) – §9                                           |
| Build   | `make landing-build` → `apps/landing/dist`                                                                    |
| Env     | `VITE_DEMO_URL`, `VITE_GITHUB_REPO_URL`, `VITE_SITE_URL`, optional `VITE_SPONSOR_GITHUB_URL` (`.env.example`) |
| Version | `VITE_APP_VERSION` aus Root-`package.json` beim Build (Vite `define`)                                         |
| SEO     | robots/sitemap (Build), Canonical/OG, FAQ JSON-LD, Prerender – siehe [Landing-SEO.md](./Landing-SEO.md)       |

**Lokal:** `make landing-dev` → http://127.0.0.1:5174 (Make setzt `VITE_SITE_URL` / `VITE_DEMO_URL`; siehe Makefile).

---

## 3. Seitenaufbau

**Leitplan Sections:** [Landing-Sections-Plan.md](./Landing-Sections-Plan.md)

### Startseite `/`

1. Navbar (Desktop + Mobile Drawer)
2. Hero (Demo extern · Installation → `/install`)
3. **Scope** (`#scope`)
4. **Context** (`#context`)
5. **Roles** (`#roles`) – Titel: Rollenbasierte Zusammenarbeit
6. **Example** (`#example`)
7. **Philosophie-Teaser** → `/philosophy`
8. **Feature-Grid** (`#features`) – Alle Features (Org-Hierarchie, Governance, Do11y, Datenkontrolle)
9. **FAQ** (`#faq`)
10. **Abschluss-CTA** (Demo · Installation)
11. Footer (Version-Badge → `/changelog`)

**Vergleichstabelle:** **`/compare`**, nicht auf `/`. EN-Home: `/en`.

### Routen (englische Pfadsegmente; DE unprefixed, EN `/en/…`)

| Pfad (DE)        | Pfad (EN)           | Inhalt                |
| ---------------- | ------------------- | --------------------- |
| `/`              | `/en`               | Startseite            |
| `/philosophy`    | `/en/philosophy`    | Philosophie           |
| `/install`       | `/en/install`       | Marketing-Install     |
| `/changelog`     | `/en/changelog`     | Changelog             |
| `/sponsor`       | `/en/sponsor`       | Sponsor               |
| `/compare`       | `/en/compare`       | DocsOps · Confluence  |
| `/legal/imprint` | `/en/legal/imprint` | Impressum / Imprint   |
| `/legal/privacy` | `/en/legal/privacy` | Datenschutz / Privacy |

Legacy-Redirects (DE): `/philosophie`, `/warum`, `/ansatz` → `/philosophy`; `/vergleich` → `/compare`; `/impressum` → `/legal/imprint`; `/datenschutz` → `/legal/privacy`.

---

## 4. Navbar & Footer

**Navbar (Desktop):** Logo · **So funktioniert’s** ▾ · **Philosophie** ▾ · Sprachumschalter · (später Theme-Toggle) · GitHub · Changelog · Unterstützen · **Live-Demo**

- So funktioniert’s: Anker auf Startseite (`#scope`, …) – Anker-IDs bei i18n stabil Englisch halten
- Philosophie: Unser Ansatz (`/philosophy`), DocsOps vs. Confluence (`/compare`)

**Navbar (Mobile):** Burger/Drawer mit gleichen Links + Demo-CTA.

**Footer:** Produkt · **DocsOps vs.** · Projekt · Rechtliches · `vX.Y.Z` → Changelog

Externe Links: einheitlich mit External-Icon (`LandingExternalLink`).

---

## 5. Vergleich & FAQ

- **`/compare`:** Hauptort der Gegenüberstellung.
- Startseite: kein großes Vergleichs-Grid; FAQ verweist auf Compare.
- Abgrenzung Haltung: `/philosophy`. Tabellendaten: [vergleich/](./vergleich/).
- FAQ auf der Startseite (`#faq`) inkl. FAQPage-JSON-LD – siehe [Landing-SEO.md](./Landing-SEO.md).

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

- [x] Modell-Sections, Beispiel, Philosophie-Teaser, FAQ, Abschluss-CTA
- [x] `/philosophy`, `/install`, `/changelog`, `/sponsor`
- [x] **Feature-Grid auf `/`:** Section `#features` nach Philosophie-Teaser; Titel „Alle Features“; Kacheln Org-Hierarchie, Governance, Do11y, Datenkontrolle.
- [x] Impressum/Datenschutz (DE + EN) auf `/legal/imprint`, `/legal/privacy`
- [x] Gegenüberstellung Confluence vs DocsOps auf `/compare`
- [ ] Demo-Seed-Story (App; Landing-unabhängig)
- [x] **Landing EN-Copy:** alle Seiten inkl. Vergleich und Legal

### Technik

- [x] Mobile Navbar, OG-Tags, Hero LCP-Attribute, Version-Badge
- [x] SEO: robots/sitemap, Canonicals, Prerender, Search-Console-Checkliste ([Landing-SEO.md](./Landing-SEO.md))
- [x] `Caddyfile.lab` + Hosts-Doku (VM-Lab in [install.md](../install.md))
- [x] **Favicon Color Scheme:** Landing + App: SVG `docops.svg` / `docops-dark.svg` mit `prefers-color-scheme`
- [x] **Landing i18n** – siehe §8
- [x] **Landing Color Theme** – siehe §9
- [ ] VPS + DNS · SPA-Fallback für neue Routen prüfen

---

## 8. Landing i18n (umgesetzt)

**Reihenfolge:** Sprache vor Color Theme.

| Entscheidung        | Vorgabe                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Locales             | `de` \| `en`                                                                                                     |
| Pfadsegmente        | **Englisch** in beiden Locales (`/philosophy`, `/compare`, `/legal/imprint`, …)                                  |
| Locale im URL       | DE **ohne** Präfix; EN unter **`/en/…`** (gleiche Segmente). Kein `?lang=` als Primärmodell                      |
| Default (1. Besuch) | Browser `de` / `de-*` → DE; sonst → EN. Danach: URL-Locale und gespeicherte Wahl gewinnen                        |
| Persistenz          | `localStorage` Key `docsops-landing-locale` bei explizitem Umschalter                                            |
| Scope               | **alle** Landing-Routen inkl. Vergleich und Legal                                                                |
| SEO                 | Canonical + `hreflang` je Locale; Sitemap und Prerender für DE- und EN-URLs – [Landing-SEO.md](./Landing-SEO.md) |
| Copy                | DE SSoT freigeben, dann EN; Marketing-Prosa-Regeln                                                               |
| Redirects           | Alte DE-Slugs → neue EN-Slugs (301); optional Root `/` nur beim Erstbesuch locale-redirecten                     |

**Nicht:** App-`i18next`-Namespaces 1:1 übernehmen (Landing-Copy bleibt in `apps/landing` Content-Modulen, locale-aufgeteilt oder Key-basiert).

---

## 9. Landing Color Theme (umgesetzt)

| Entscheidung | Vorgabe                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| System       | `prefers-color-scheme` beachten (Modus **Auto**)                                             |
| UI           | Hover-Menü Light / Dark / Auto rechts neben Sprache (`ColorSchemeSwitcher`)                  |
| Persistenz   | `localStorage` Key `docsops-landing-color-scheme`; ohne Wahl → Auto                          |
| Look         | **App-ähnlich** (Mantine Light/Dark, gleicher Blau-Akzent); Tokens in `theme-light/dark.css` |
| Diagramme    | Surfaces/Edges über `--landing-diagram-*` Tokens                                             |
| Favicon      | folgt resolved Scheme (`LandingColorSchemeEffects`)                                          |

---

## 10. Referenzen

- [Landing-Sections-Plan.md](./Landing-Sections-Plan.md)
- [Positionierung-und-Landing.md](./Positionierung-und-Landing.md)
- [Landing-SEO.md](./Landing-SEO.md)
- [install.md](../install.md) – vollständige Installationsdoku (extern verlinkt)
