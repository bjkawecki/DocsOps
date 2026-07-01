# Landing Page – Plan & Technik

**Status:** §19 – `apps/landing` existiert; **inhaltliche Leitlinie:** [Positionierung-und-Landing.md](./Positionierung-und-Landing.md)  
**Sprache Landing:** Deutsch · **App/Demo:** Englisch  
**Domain:** `docsops.de` · Demo: `demo.docsops.de`  
**Design:** Mantine 8, dunkles Theme (Coolify-inspiriert)

---

## 1. Ziel

- Erklären, **wofür** DocsOps gedacht ist (offizieller Wissensstand, Hierarchie, Veröffentlichung).
- **Abgrenzen:** anderer Weg als „alle schreiben gleichzeitig“ – siehe [Positionierung §1–3](./Positionierung-und-Landing.md).
- **Vertrauen:** Self-hosted, Open Source (MIT), Impressum/Datenschutz.
- **Konvertieren:** Live-Demo, Self-hosted-Install.

**Nicht:** vollständige Produkt-Doku (Help in der App), Feature-Checkbox-Schlacht.

---

## 2. Technik

| Aspekt | Stand                                                    |
| ------ | -------------------------------------------------------- |
| Stack  | `apps/landing` – Vite + React + Mantine 8                |
| Theme  | Fest dark, Cornflower-Blue-Akzent                        |
| Build  | `make landing-build` → `apps/landing/dist`               |
| Env    | `VITE_DEMO_URL`, `VITE_GITHUB_REPO_URL` (`.env.example`) |

**Lokal:** `make landing-dev` → http://localhost:5174 · Demo-CTA default `http://localhost:5000`

### Lokal: zwei Hostnames (optional, vor Go-live)

Siehe [Positionierung](./Positionierung-und-Landing.md); Details unverändert: `/etc/hosts` `docsops.local` / `demo.docsops.local`, `Caddyfile.local` – noch nicht im Repo.

---

## 3. Seitenaufbau (aktuell & geplant)

**Leitplan Sections:** [Landing-Sections-Plan.md](./Landing-Sections-Plan.md)

### Startseite – **jetzt**

1. Navbar
2. Hero
3. **Scope** (`#scope`)
4. **Kontext** (`#kontext`)
5. **Rechte** (`#rechte`)
6. **Beispiel** (`#einordnen`)
7. Footer

**Zurückgestellt:** Feature-Grid, Vergleichstabelle, FAQ.

### Startseite – **Ziel** (Modell-Sections umgesetzt)

1. Hero
2. **Scope** (`#scope`) – Leitfrage: Wo gehört ein Nutzer hin – und was sieht er?
3. **Kontext** (`#kontext`) – Wo wird Wissen abgelegt?
4. **Rechte** (`#rechte`) – Wie entsteht die verbindliche Fassung?
5. **Beispiel** (`#einordnen`) – Barrierefreiheit / Software X
6. Footer

### Routen

| Route                        | Inhalt                                                             |
| ---------------------------- | ------------------------------------------------------------------ |
| `/`                          | Startseite                                                         |
| `/warum`                     | Warum DocsOps (Redirect `/ansatz` → `/warum`)                      |
| `/vergleich`                 | Hub Head-to-head (**Demnächst**, nicht in Navbar bis Tabelle reif) |
| `/impressum`, `/datenschutz` | Platzhalter                                                        |

---

## 4. Navbar & Footer

- Logo + **DocsOps** → `/`
- **Modell** (Hover-Menü) → `#scope`, `#kontext`, `#rechte`, `#einordnen`
- **Warum DocsOps** → `/warum`
- **GitHub** (extern)
- **Live-Demo** (Primary CTA)
- Footer: Warum, Modell (vier Anker), Demo, GitHub, Install-Doku, Impressum, Datenschutz

**Design:** Modell-Section-Header zentriert (max. 720px). Hellgraue Cards (`dark.7`) mit dezentem Primary-Schatten (`blue-4`, Klasse `.landing-surface-card`).

Kein Newsletter v1.

---

## 5. Vergleich & FAQ (zurückgestellt)

- Tabellendaten: [vergleich/startseite-confluence-docmost.md](./vergleich/startseite-confluence-docmost.md)
- Strategie Head-to-head: intern [Vergleich-DocsOps-Docmost.md](../platform/Vergleich-DocsOps-Docmost.md)
- **Wieder aufnehmen**, wenn Labels aus [Positionierung §5](./Positionierung-und-Landing.md) übernommen sind.

---

## 6. Demo & Landing

| Thema          | Landing                      | Demo                                          |
| -------------- | ---------------------------- | --------------------------------------------- |
| Storytelling   | Hierarchie, Rollen, Beispiel | Seed-Dokumente (IT / Software X / A11y-Stand) |
| Erster Kontakt | Hero + CTA                   | Login / Enter demo                            |
| Rechtliches    | Impressum, Datenschutz       | Demo-Banner (später)                          |

---

## 7. Offene Punkte

### Inhalt

- [x] Hero, Rollen-Diagramm auf Startseite
- [x] Scope (2-Zweig, Member-Highlight) – Phase B
- [x] Kontext-Section – Phase C
- [x] Rechte-Umbenennung – Phase D
- [x] Beispiel Barrierefreiheit – Phase E
- [ ] `/warum` an [Positionierung](./Positionierung-und-Landing.md) anpassen
- [ ] Vergleichstabelle & FAQ reaktivieren
- [ ] Impressum/Datenschutz (Texte)
- [ ] Demo-Seed-Story

### Technik

- [x] `apps/landing` (Vite + Mantine 8)
- [x] Navbar, Footer, Hero
- [ ] `Caddyfile.local` + Hosts-Doku
- [ ] VPS + DNS

---

## 8. Referenzen

- [Landing-Sections-Plan.md](./Landing-Sections-Plan.md) – **Umsetzungsplan Scope · Kontext · Rechte**
- [Positionierung-und-Landing.md](./Positionierung-und-Landing.md) – **inhaltliche Quelle**
- [antwort.md](./antwort.md) – Diskussionsnotiz
- [Plan-Demo-Oeffentlich.md](../plan/Plan-Demo-Oeffentlich.md)
- [Doc-Platform-Konzept](../platform/Doc-Platform-Konzept.md)
