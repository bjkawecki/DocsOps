# Bestandsaufnahme: Mobile UX (App)

**Status:** Inventar (Probleme + Lösungsoptionen).  
**Lösungsplan:** [Plan-Mobile-UX](Plan-Mobile-UX.md)  
**Scope dieses Dokuments:** `apps/frontend` (eingeloggte App). Landing (`apps/landing`) ist separat und hier nur am Rande erwähnt.  
**Grundlage:** Screenshots / Beobachtungen (August 2026) plus Abgleich mit dem aktuellen Code.

Verwandte Todos: [Umsetzungs-Todo §19 / §20](Umsetzungs-Todo.md) (Mobile-Review).

---

## 1. Kurzfazit

Die App ist **Desktop-first**. Auf schmalen Viewports greifen oft nur naive Stack-Umbrüche (`Flex column` unter `lg`): Desktop-Sidebars und Filter landen **über** dem Inhalt, Tabellen bleiben Tabellen (Horizontal-Scroll), Settings bleibt ein Zwei-Spalten-Modal. Die AppShell hat zwar Burger + Overlay-Navbar, aber der Burger verschwindet unter dem Overlay – die Navbar wirkt zudem zu klein für Touch.

Viele Seiten teilen **dieselben Bausteine**. Deshalb lohnt später eine Pattern-Lösung vor Einzel-Seiten-Fixes.

---

## 2. Breakpoints und Mechanismen (Ist)

| Mechanismus                                      | Typische Nutzung                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| AppShell `navbar.breakpoint: 'sm'`               | Mobile Overlay ≤ ~48em (`useAppShellLayout`, `DESKTOP_MIN_WIDTH`) |
| `Flex direction={{ base: 'column', lg: 'row' }}` | Admin, Notifications, Approvals, Context Workspace u. a.          |
| Document-Chrome CSS `min-width: 62em`            | Help, Templates, Document-Seiten (teilweise)                      |
| `visibleFrom="lg"`                               | oft nur „Balance“-Schienen, **nicht** die linke Inhalts-Sidebar   |
| `useMediaQuery`                                  | praktisch nur AppShell (+ wenige Ausnahmen)                       |
| Tabellen                                         | `dense-list-table`, teils `minWidth` + `overflowX: auto`          |

**Inkonsistenz:** AppShell wechselt bei ~48em (`sm`) zu Desktop-Rail, Seiten-Sidebars stapeln aber oft bis ~75em (`lg`). Dazwischen: Desktop-Chrome + weiterhin gestapelte Seiten-Sidebars.

---

## 3. Beobachtungen nach Screenshot

### Bild 1 – Start / Pulse-Feed und Hintergrund

**Symptom:** Feed- bzw. Explore-Inhalt überlappt mit der dekorativen Hintergrundillustration (Netz / Pinwheels). Blaue Links und Icons sind schwer lesbar.

**Betroffene Bereiche (Code):**

- `apps/frontend/src/pages/HomePage/HomePage.tsx` / `HomePage.css`
- `PulseExploreBlock.tsx`, `PulseHomeIllustration.tsx`, `PulseIllustrationPlayfulDetails.tsx`

**Vermutete Ursache:** Illustration `position: absolute|sticky; bottom: 0` mit großer Höhe (~`min(50vh, …)`), `z-index: 0`, Explore-Inhalt `z-index: 1`. Bei kurzem Inhalt oder Fill-Layout sitzt der Content optisch auf der Illustration; negative Margins ziehen die Grafik unter den Content-Bereich.

**Lösungsoptionen (noch nicht entschieden):**

- A) Illustration auf Mobile stark verkleinern / ausblenden (`max-width` Media Query).
- B) Illustration nur hinter dem unteren Viewport-Rand, Content mit undurchsichtigem Hintergrund / Gradient-Mask.
- C) Illustration nur Desktop (`visibleFrom` / CSS), Mobile ohne Dekoration.
- D) Stacking und Höhenlogik im Fill-Layout neu (Illustration nie in den Content-Stack).

---

### Bild 2 – Main-Sidebar ohne nutzbaren Schließen-Control; Navbar zu klein

**Symptom:**

- Geöffnete Mobile-Navbar (DocsOps, Suche, Start/Katalog/…) füllt den Screen; **kein sichtbarer Burger/X zum Schließen**.
- Top-Bar mit Icons wirkt insgesamt zu klein / eng für Touch.

**Betroffene Bereiche (Code):**

- `AppShell.tsx`, `useAppShellLayout.ts`, `AppShellTopBar.tsx`, `AppShellNavbar.tsx`, `AppShell.css` (`--app-shell-chrome-height: 44px`)

**Vermutete Ursache:**

- Burger sitzt in der Top-Bar im `AppShell.Main`. Die mobile Navbar liegt als Overlay **darüber** und verdeckt den Burger. Schließen derzeit vor allem über Navigation (`closeMobile` / `onNavigate`), nicht über ein dauerhaftes Close-Control in der Drawer-UI.
- Chrome-Höhe 44px und Icon-Größe ~32/18 ohne mobile Vergrößerung.

**Lösungsoptionen:**

- A) Close-Button (X) fest in der Navbar-Kopfzeile (Marke + Close).
- B) Burger/Toggle **über** dem Overlay halten (z-index / Portal in Header-Slot außerhalb des überdeckten Main).
- C) Overlay-Klick (Scrim) schließt die Navbar.
- D) Top-Bar mobil erhöhen (z. B. 52–56px), Icons/Touch-Targets ≥ 44px, Abstände zwischen Actions vergrößern.
- E) Kombination A+C+D (häufigstes Muster).

---

### Bild 3 – Benachrichtigungen

**Symptom:**

- Titel/Meta („Benachrichtigungen“ vs. Zähler) und Actions („Nur ungelesen“, „Alle als…“) kollidieren / werden abgeschnitten.
- Kategorie-Nav („Typ“) stapelt sich als große Karte **über** der Liste und verbraucht Fold-Platz.
- Inbox als Desktop-Tabelle: Truncation, Status-Pills unleserlich, Horizontaldruck.

**Betroffene Bereiche (Code):**

- `pages/account/NotificationsPage.tsx`
- `components/notifications/NotificationsInboxPanel.tsx` (Tabelle, `minWidth` ~640)
- `AppShellBreadcrumbBar.tsx` (`wrap="nowrap"` für Breadcrumb + Actions)

**Vermutete Ursache:** Desktop-Zwei-Spalten-Layout wird unter `lg` nur gestapelt; Filter/Actions bleiben in einer nicht-wrappenden Breadcrumb-Zeile; keine Mobile-Listen-Alternative.

**Lösungsoptionen:**

- A) Kategorie-Nav mobil als Segmented Control / Select / Bottom-Sheet statt voller Sidebar-Karte.
- B) Actions unter den Titel wrappen oder in Overflow-Menü („…“).
- C) Inbox mobil als Card-/Stack-Liste statt Tabelle.
- D) Desktop-Tabelle beibehalten, nur ab `md`/`lg`; darunter Liste.

---

### Bild 4 – Settings-Modal

**Symptom:** Zwei-Spalten-Modal (Nav links, Content rechts) auf schmalem Viewport: Nav und Content gequetscht, Texte abgeschnitten, flackernde/fehlplatzierte Controls (z. B. Darstellung).

**Betroffene Bereiche (Code):**

- `components/settings/SettingsModal.tsx` (feste Größe ~960, Körperhöhe begrenzt)
- `pages/settings/SettingsPanel.tsx` (Aside ~200px + Content, **kein** Mobile-Collapse)

**Vermutete Ursache:** Kein responsives Settings-Layout; Modal schrumpft mit Viewport, interne Flex-Zwei-Spalte bleibt.

**Lösungsoptionen:**

- A) Mobil: Vollbild-Drawer/Page statt Modal; Nav als Liste, Detail als zweite „Seite“ (Drill-down).
- B) Mobil: nur Nav zuerst, nach Auswahl Content (einspaltig, Zurück).
- C) Settings unter `sm` als eigene Route `/settings` (Deep-Link ohnehin über Query).
- D) Modal behalten, aber Nav horizontal scrollbare Tabs / Accordion statt linker Spalte.

---

### Bild 5 – Hilfe

**Symptom:** Topic-Nav (Getting started / Governance / …) als große Karte oben; eigentlicher Text erst darunter. Navbar-Icons klein. Seite wirkt „nicht gelöst“.

**Betroffene Bereiche (Code):**

- `pages/help/HelpLayout.tsx`
- Document-Chrome / `contextWorkspaceChrome.tsx` (linke Spalte `w={{ base: '100%', lg: … }}`)
- `AppShell.css` (`.document-page-body`)

**Vermutete Ursache:** Dieselbe Sidebar-über-Content-Stack-Strategie wie Admin/Templates; Balance-Rail wird ausgeblendet, die **linke Nav bleibt**.

**Lösungsoptionen:**

- A) Topic-Nav mobil als Select / Drawer / Collapsible („Themen“), Content first.
- B) Eigene Mobile-Help-Route mit flacher Topic-Liste, dann Artikel.
- C) Nav sticky kompakt (eine Zeile + Menü), Inhalt darunter mit mehr Margin.

---

### Bild 6 – Admin (Nutzer) als Exemplar des allgemeinen Problems

**Symptom:** Admin-Bereichs-Nav (Organisation / Betrieb / Daten / Plattform) als große Karte oben; darunter Filter; darunter Tabelle. Viel Scroll, bevor die eigentliche Liste erscheint. Primärbutton und Breadcrumb eng.

**Betroffene Bereiche (Code):**

- `pages/admin/AdminPage.tsx`, `AdminContentSidebar.tsx`
- `AdminEntityListToolbar.tsx`
- Tabellen mit `dense-list-table`

**Vermutete Ursache:** Shared Pattern „linke Content-Sidebar + Main“ → auf Mobile nur vertikal gestapelt, nicht umgebaut.

---

### Bild 7 – Katalog (gleiches Muster)

**Symptom:** Viele Filter-Controls untereinander (Suche, Kontexttyp, Sortierung, Tags, Pro Seite); Tabelle mit mehreren Spalten eng; Navbar klein.

**Betroffene Bereiche (Code):**

- `pages/catalog/CatalogPage.tsx` (+ sticky Filters / CSS)
- `dense-list-table`

**Lösungsoptionen (Katalog-spezifisch ergänzend):**

- A) Filter hinter „Filter“-Button / Sheet; nur Suche sichtbar.
- B) Ergebnis mobil als Cards (Titel, Meta-Zeile), Desktop-Tabelle ab `md`/`lg`.

---

### Bild 8 – Vorlagen (gleiches Muster)

**Symptom:** „Typen“-Panel (Prozess/Projekt-Baum) nimmt den Großteil des Viewports ein; „Richtlinie“-Inhalt erst weit unten. Primary Action („Neuer …“) konkurriert mit Breadcrumb um Breite.

**Betroffene Bereiche (Code):**

- `pages/documentTemplates/DocumentTemplatesPage.tsx`
- Document-Chrome / linke Spalte

**Lösungsoptionen:** analog Bild 5/6 – Typen-Nav mobil Drawer/Select/Collapsible; Content first.

---

## 4. Querschnitt: wiederkehrende Problemklassen

Diese Klassen erklären Bild 3 und 5–8 gemeinsam und sollten im späteren Plan **zuerst** adressiert werden.

### P1 – Desktop-Sidebar stapelt über Content

**Bausteine:** `ContextWorkspaceLeftColumn`, `Flex` `base: column` → `lg: row`, `ContentSidebarCollapsibleSection`, Document-Chrome.

**Seiten (Auswahl):** Admin, Notifications, Approvals, Help, Templates, Context Workspace, Trash/Archive-Varianten.

**Kernproblem:** „Responsive“ = Stack, nicht Mobile-IA.

**Optionsraum:**

| Option | Idee                                                                             |
| ------ | -------------------------------------------------------------------------------- |
| P1-a   | Linke Nav auf Mobile in Drawer / Bottom-Sheet; Hauptinhalt full-width            |
| P1-b   | Collapsed summary + „Menü“-Button oben; Expand nur auf Wunsch                    |
| P1-c   | Zweistufige Mobile-Navigation (Liste → Detail), Desktop unverändert Zwei-Spalten |
| P1-d   | Unter `lg` Nav ausblenden und per Select/Segmented ersetzen                      |

### P2 – Desktop-Tabellen auf schmalen Screens

**Bausteine:** `dense-list-table`, Mantine `Table`, oft `minWidth` + Horizontal-Scroll.

**Seiten:** Catalog, Admin-Listen, Notifications, Trash/Drafts, Settings-Tabellen u. a.

**Optionsraum:**

| Option | Idee                                                                  |
| ------ | --------------------------------------------------------------------- |
| P2-a   | Card-/Stack-Liste unter Breakpoint X, Tabelle darüber                 |
| P2-b   | Nur essenzielle Spalten mobil, Rest in Detail-Row/Accordion           |
| P2-c   | Horizontal-Scroll bewusst belassen (meist schlechte UX, nur Fallback) |

### P3 – Filter- und Action-Leisten verbrauchen Fold

**Bausteine:** Catalog sticky filters, Admin toolbar, Breadcrumb-Actions (`wrap="nowrap"`).

**Optionsraum:** Filter-Sheet; Wrapping erlauben; Overflow-Menü; Primäraktion full-width unter dem Titel.

### P4 – AppShell-Chrome (Touch & Overlay)

Siehe Bild 2. Betrifft **alle** Seiten.

**Plan:** Close + Scrim + Touch-Targets ([Plan-Mobile-UX §2.2](Plan-Mobile-UX.md)); **Welle-1-Checkliste** in [Plan §3](Plan-Mobile-UX.md#welle-1--appshell-p4).  
**Offen (P4-f):** optionale Hybrid-Bottom-Nav nur `narrow` (Primärs + „Mehr“ → volle Drawer-Nav); Entscheidung nach Shell-/Content-Nav-Wellen ([Plan §2.8](Plan-Mobile-UX.md)).

### P5 – Modals mit Desktop-Innenlayout

Settings (Bild 4) als stärkstes Beispiel; prüfen, ob weitere große Modals denselben Fehler haben.

### P6 – Dekoration vs. Lesbarkeit

Home-Illustration (Bild 1); ggf. weitere dekorative Hintergründe auditieren.

### P7 – Breakpoint-Wildwuchs

`sm` (Shell) vs. `md` (Document CSS) vs. `lg` (viele Sidebars). Erschwert einheitliches Mobile-Verhalten.

**Optionsraum:** eine SSoT für „narrow / compact / desktop“ dokumentieren und schrittweise angleichen (im Plan, nicht hier festlegen).

---

## 5. Was schon „irgendwie“ da ist (nicht als erledigt werten)

- Mobile AppShell-Overlay + Burger (`§20` Responsiv / Pin Sidebar) – **funktional unvollständig** (Close/Overlay-UX, Touch-Größe).
- Viele Layouts haben responsive `direction`/`w`-Props – das löst **nicht** die IA-Probleme.
- Landing hat eigenen Mobile-Drawer; **nicht** Gegenstand dieses Inventars (eigenes Todo §19).

---

## 6. Abdeckungslücken (noch nicht per Screenshot belegt)

Für die spätere Planung zusätzlich prüfen (kurz, gleiche Pattern-Klassen):

- [x] Login / Demo-Login – Touch-Targets Welle 4
- [x] Document Reader + Editor – Content-Nav + `lg`-Breakpoint + Toolbar Touch Welle 4
- [x] Context-/Org-Workspaces – Wrapper Welle 3/4 (Trash/MostRead/Shared); People unverändert Menu
- [x] Reviews / Approvals – Nav Welle 3, Cards Welle 4
- [x] Search – narrow fullscreen Welle 4
- [x] What's new – Hit-Area Welle 4
- [ ] Lange Formulare / Create-Modals – **bewusst zurückgestellt** (einspaltig; kein P5-Zwang)

P4-f Bottom-Nav: **verworfen** (siehe Plan §2.8). Landing: separat §19.

---

## 7. Empfohlene Reihenfolge (umgesetzt im Plan)

Siehe [Plan-Mobile-UX](Plan-Mobile-UX.md): zuerst Shell (P4), dann Content-Nav (P1), dann Listen/Filter/Settings/Home (P2–P6), danach Restflächen. Landing separat.

---

## 8. Referenz: zentrale Dateien

| Thema               | Pfade                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| AppShell            | `apps/frontend/src/components/appShell/AppShell.tsx`, `AppShellTopBar.tsx`, `AppShellNavbar.tsx`, `useAppShellLayout.ts`, `AppShell.css` |
| Home / Illustration | `apps/frontend/src/pages/HomePage/*`                                                                                                     |
| Notifications       | `pages/account/NotificationsPage.tsx`, `components/notifications/NotificationsInboxPanel.tsx`                                            |
| Settings            | `components/settings/SettingsModal.tsx`, `pages/settings/SettingsPanel.tsx`                                                              |
| Help                | `pages/help/HelpLayout.tsx`                                                                                                              |
| Admin               | `pages/admin/AdminPage.tsx`, `AdminContentSidebar.tsx`                                                                                   |
| Catalog             | `pages/catalog/CatalogPage.tsx`                                                                                                          |
| Templates           | `pages/documentTemplates/DocumentTemplatesPage.tsx`                                                                                      |
| Shared Sidebar      | `pages/contextWorkspace/contextWorkspaceChrome.tsx`                                                                                      |
| Tabellen            | `apps/frontend/src/styles/table-rows.css` (`dense-list-table`)                                                                           |

---

## 9. Änderungsprotokoll

| Datum      | Änderung                                                                  |
| ---------- | ------------------------------------------------------------------------- |
| 2026-08-06 | Erstfassung aus Screenshots Bild 1–8 + Code-Abgleich; ohne Umsetzungsplan |
| 2026-08-06 | Verweis auf [Plan-Mobile-UX](Plan-Mobile-UX.md)                           |
| 2026-08-06 | P4-f Bottom-Nav Hybrid als Offenpunkt (Plan §2.8)                         |
| 2026-08-07 | §6 Restflächen Welle 4; P4-f verworfen; Create-Modals zurückgestellt      |
