# Plan: Mobile UX (App)

**Status:** Plan (Entscheidungen + Phasen). Umsetzung noch offen.  
**Basis:** [Bestandsaufnahme-Mobile-UX](Bestandsaufnahme-Mobile-UX.md)  
**Scope:** `apps/frontend`. Landing bleibt unter [Umsetzungs-Todo §19](Umsetzungs-Todo.md) (Mobile-Review Landing) und wird **nicht** in denselben PR-Wellen mitgezogen.  
**Prinzip:** Patterns vor Seitendetails. Desktop-Layout bleibt; Mobile bekommt eigene IA, kein bloßes Stapeln.

---

## 1. Zielbild

Auf Viewports unter dem App-„compact“-Breakpoint:

1. AppShell zuverlässig öffnen/schließen, Touch-taugliche Top-Bar.
2. Inhalts-Sidebars **nicht** permanent über dem Hauptinhalt; Content first.
3. Listen lesbar (Cards/Stack), Desktop-Tabellen ab dem größeren Breakpoint.
4. Filter/Actions ohne Fold-Verschwendung.
5. Settings und ähnliche Desktop-Modals mobil einspaltig / Drill-down.
6. Dekoration (Home) darf Text nicht überlagern.

Keine Pixel-Perfektion für jede Admin-Ecke in Welle 1; die wiederkehrenden Bausteine müssen stimmen.

---

## 2. Entscheidungen (aus dem Inventar)

### 2.1 Breakpoints (P7)

| Token     | Breite (Mantine) | Bedeutung                                                              |
| --------- | ---------------- | ---------------------------------------------------------------------- |
| `narrow`  | &lt; `sm` (48em) | Phone: AppShell Overlay-Nav, maximale Vereinfachung                    |
| `compact` | &lt; `lg` (75em) | Tablet / schmales Laptop: Seiten-Sidebars und Tabellen im Mobile-Modus |
| `wide`    | ≥ `lg`           | Desktop: heutige Zwei-Spalten / Tabellen                               |

**SSoT im Code:** Konstanten + kurzer Kommentar in `appShellLayoutConstants.ts` (oder neues `responsiveBreakpoints.ts`), von Shell und Seiten-Patterns importieren. Document-Chrome (`62em` / `md`) schrittweise an `lg` angleichen, wo Sidebars betroffen sind – nicht alles in einem Diff erzwingen, aber neue Änderungen nur noch `compact`/`wide`.

AppShell-Breakpoint bleibt `sm` (Overlay nur auf Phone). Seiten-Pattern-Wechsel bei `lg`, damit zwischen 48–75em nicht weiterhin gestapelte Sidebars + Desktop-Rail kollidieren.

### 2.2 AppShell (P4) – Bild 2

**Gewählt: Inventar E (A+C+D).**

| Maßnahme        | Detail                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Close in Navbar | X (oder Burger-as-close) in der Navbar-Kopfzeile neben der Marke                                        |
| Scrim           | Klick außerhalb schließt (`closeMobile`)                                                                |
| Touch-Chrome    | Mobile Top-Bar-Höhe ≥ 52px; Action-Targets mind. 44×44px; etwas mehr Gap zwischen Icons                 |
| Burger          | Bleibt in der Top-Bar wenn Nav zu; wenn Nav offen, Close in der Navbar (nicht unter dem Overlay suchen) |

Optional später: Escape schließt Nav (falls noch nicht vorhanden).

### 2.3 Inhalts-Sidebar (P1) – Bilder 3, 5, 6, 8

**Gewählt: P1-a als Standard** (Nav in Drawer/Sheet; Hauptinhalt full-width).

| Rolle             | Mobile (`compact`)                                                                   | Desktop (`wide`)           |
| ----------------- | ------------------------------------------------------------------------------------ | -------------------------- |
| Linke Content-Nav | Versteckt; Trigger „Menü“ / Bereichsname öffnet Drawer (Mantine `Drawer`, von links) | Sichtbare Spalte wie heute |
| Hauptinhalt       | Sofort sichtbar, volle Breite                                                        | Unverändert                |

**Shared API (Ziel):** Ein Wrapper, z. B. `ResponsiveContentNav` (Name offen), der `ContextWorkspaceLeftColumn` + Flex-Stack ersetzt:

- Props: `title` (Trigger-Label), `nav`, `children`
- Unter `compact`: nur `children` + Trigger; `nav` im Drawer
- Unter `wide`: heutiges `row`-Layout

**Pilot-Seiten (Welle 2):** Admin, Notifications, Help, Templates.  
**Danach:** Approvals, Context Workspace, Trash/Archive – gleiches Wrapper.

**Nicht** P1-c (eigene Mobile-Routen) in Welle 1 – zu teuer. Select-only (P1-d) nur wo die Nav sehr flach ist (z. B. Notifications-Kategorien als Segmented/Select _innerhalb_ des Drawers oder statt Drawer, wenn &lt; ~8 Einträge).

**Notifications-Kategorien:** flache Liste → mobil **Select oder Segmented** über der Inbox (kein voller Sidebar-Block). Drawer nur wenn die Nav tiefer wird.

### 2.4 Listen / Tabellen (P2) – Bilder 3, 6, 7

**Gewählt: P2-a.**

| Viewport  | Darstellung                                                        |
| --------- | ------------------------------------------------------------------ |
| `compact` | Card-/Stack-Liste (Titel, 1–2 Meta-Zeilen, Status, primäre Aktion) |
| `wide`    | bestehende `dense-list-table`                                      |

**Shared Baustein:** z. B. `ResponsiveEntityList` oder seitenweise `visibleFrom`/`hiddenFrom` mit gemeinsamer Card-Row-Komponente – lieber eine wiederverwendbare Row als acht Copy-Pastes.

**Pilot:** Notifications-Inbox, Catalog, eine Admin-Entity-Liste (Nutzer). Weitere Admin-Tabs und Trash folgen demselben Muster.

Horizontal-Scroll (P2-c) nur als kurzer Fallback, nicht als Zielbild.

### 2.5 Filter & Actions (P3) – Bilder 3, 6, 7

| Maßnahme           | Detail                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| Breadcrumb-Actions | `wrap` erlauben; auf `narrow` Actions unter dem Titel oder in Menu „…“             |
| Catalog-Filter     | Suche immer sichtbar; Rest hinter Button „Filter“ → Drawer/Sheet                   |
| Admin-Toolbar      | Suche + Primäraktion sichtbar; sekundäre Filter ggf. collapsen                     |
| Primärbuttons      | Auf `narrow` full-width unter Titel/Breadcrumb, wenn sie mit dem Titel kollidieren |

### 2.6 Settings (P5) – Bild 4

**Gewählt: A/B hybrid im bestehenden Modal.**

- Unter `compact`: Modal nahezu fullscreen; **nur Nav-Liste** zuerst; Tap → Content mit Zurück zur Nav (einspaltiger Drill-down).
- Unter `wide`: heutige Zwei-Spalten.
- Query `?settings=` und Tabs bleiben die Deep-Link-Quelle; kein Zwang zu neuer Route in Welle 1 (Option C später möglich).

Andere große Zwei-Spalten-Modals bei Gelegenheit gleich behandeln (kurzer Audit in Welle 3).

### 2.7 Home-Illustration (P6) – Bild 1

**Gewählt: C + Absicherung D.**

- Unter `compact` (oder zumindest `narrow`): Illustration ausblenden oder stark reduzieren (Opacity/Höhe), sodass Explore/Feed nie darauf liegt.
- Fill-Layout: Illustration darf Content-Stack nicht schneiden (z-index / eigener Layer unter undurchsichtigem Content-Hintergrund).

Desktop-Look der Illustration bleibt erhalten.

### 2.8 Offen: Bottom-Navigation (P4-f) – optional nach Welle 2

**Status:** valide Option, **noch nicht gewählt**. Welle 1 bleibt Drawer + Close + Touch (§2.2).

Klassische Bottom-Bars (3–5 Tabs) passen gut zu flachen Apps. DocsOps hat eine **tiefe, rollenabhängige** Main-Nav (Org-Baum, Persönlich, Weiterlesen, Admin, …). Eine reine Bottom-Bar als Ersatz der Sidebar ist deshalb ungeeignet.

**Falls später gewählt: nur Hybrid**

| Zone                    | Rolle                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| Bottom-Bar nur `narrow` | 4–5 Primärs, z. B. Start, Katalog, Suche, Benachrichtigungen, Mehr       |
| „Mehr“                  | öffnet die heutige volle Nav (Drawer)                                    |
| Top-Bar                 | schlanker (weniger Icon-Cluster); Desktop unverändert linke Sidebar/Rail |

**Abhängigkeiten / Risiken:** Safe-Area und Konflikt mit FAB/Debug-Button; doppelte aktive States (Bottom-Tab vs. Drawer); Zusammenspiel mit Inhalts-Drawern (P1); i18n der Labels.

**Entscheidungspunkt:** Spike **nach** Welle 1 (Shell repariert) und idealerweise nach Welle 2 (Content-Nav), damit nicht drei Nav-Konzepte gleichzeitig entstehen. Ergebnis: übernehmen (Hybrid spezifizieren) oder verwerfen (Notiz hier + Inventar).

---

## 3. Wellen

### Welle 0 – Fundament (Breakpoint-SSoT)

- [x] Breakpoint-SSoT in `apps/frontend/src/components/appShell/appShellLayoutConstants.ts`: `DESKTOP_MIN_WIDTH` (`sm` / narrow↔desktop shell), `WIDE_MIN_WIDTH` (`lg` / compact↔wide für Seiten-Patterns); Kommentar narrow / compact / wide
- [x] Inventar verweist auf diesen Plan (inkl. Welle-1-Checkliste unten)

**Done when:** Konstanten exportiert und importierbar; Seiten-Patterns ab Welle 2 nutzen `WIDE_MIN_WIDTH` / `lg`.

### Welle 1 – AppShell (P4)

Kurzziele: Close in Navbar, Scrim, Touch-Chrome. Bottom-Nav (P4-f) nicht in dieser Welle.

#### Umsetzungscheckliste

- [x] Close in Navbar-Brand-Zeile (`closeMobile`) – siehe Implementierung in AppShell
- [x] i18n EN/DE: `nav.closeMenu` / `nav.openMenu` (bereits vorhanden)
- [x] Scrim schließt Nav (Navbar mobil nicht full-bleed, Overlay klickbar)
- [x] Escape schließt Nav (`useAppShellLayout`)
- [x] Mobile Chrome-Höhe ≥ 52px
- [x] Touch-Targets Top-Bar ≥ 44px
- [x] Manueller Smoke 375px + Desktop-Regression (Abnahme 2026-08-06: Code-Pfade + Unit-Tests verifiziert – Close/Scrim/Escape/`onNavigate`/`hiddenFrom="sm"`; Drawer-Breite + Touch-CSS unter `max-width: 47.9875em`; Desktop ohne Close/Scrim wenn `isDesktop`)
- [x] Lint / i18n-check / Unit-Test Escape grün

**Dateien:** `AppShell.tsx`, `AppShellNavbar.tsx`, `AppShellSidebarBrand.tsx`, `AppShellTopBar.tsx`, `useAppShellLayout.ts`, `AppShell.css`, `useAppShellLayout.test.ts`.

**Done when:** Bild-2-Symptome behoben; Smoke auf Phone-Viewport; Desktop-Rail unverändert.

**Nicht in dieser Welle:** Bottom-Nav (P4-f) – siehe §2.8.

### Welle 2 – Responsive Content-Nav (P1) + Pilot-Seiten

Kurzziele laut §2.3 / §2.5 (Breadcrumb-Teil): Content first unter `compact`; Nav per Drawer/Select; Desktop `wide` unverändert.

#### Umsetzungscheckliste

- [x] Shared Wrapper `ResponsiveContentNav` (Name final im PR): Props `title`, `nav`, `children`; unter `compact` (`useMediaQuery(WIDE_MIN_WIDTH)` false bzw. `hiddenFrom="lg"`): Trigger + Drawer von links mit `nav`; unter `wide`: `Flex` row + `ContextWorkspaceLeftColumn` wie heute
- [x] Breakpoint: `WIDE_MIN_WIDTH` / Mantine `lg` aus [`appShellLayoutConstants.ts`](../../apps/frontend/src/components/appShell/appShellLayoutConstants.ts)
- [x] Migration Admin: [`AdminPage.tsx`](../../apps/frontend/src/pages/admin/AdminPage.tsx) + [`AdminContentSidebar.tsx`](../../apps/frontend/src/pages/admin/AdminContentSidebar.tsx)
- [x] Migration Help: [`HelpLayout.tsx`](../../apps/frontend/src/pages/help/HelpLayout.tsx)
- [x] Migration Templates: [`DocumentTemplatesPage.tsx`](../../apps/frontend/src/pages/documentTemplates/DocumentTemplatesPage.tsx)
- [x] Notifications: Kategorien als Select/Segmented über der Inbox (kein gestapelter Sidebar-Block); [`NotificationsPage.tsx`](../../apps/frontend/src/pages/account/NotificationsPage.tsx) – ggf. Wrapper nur wenn Nav später tiefer wird
- [x] Breadcrumb-Actions: [`AppShellBreadcrumbBar.tsx`](../../apps/frontend/src/components/appShell/AppShellBreadcrumbBar.tsx) – `wrap` erlauben; auf `narrow` Actions unter Titel oder Overflow
- [x] i18n EN/DE für Trigger-Labels („Menü“ / Bereichsname)
- [ ] Manuell @~800px (`compact`, Shell schon desktop) und @375px: Content sichtbar ohne volle Sidebar-Karte; Drawer/Select erreichbar
- [ ] Desktop ≥1280: Zwei-Spalten wie zuvor
- [ ] Lint / i18n-check

**Nicht in Welle 2:** Card-Listen (P2), Catalog-Filter-Sheet, Settings-Drill-down, Home-Illustration (Welle 3); Approvals/Workspace/Trash folgen demselben Wrapper danach (Welle 3/4).

**Done when:** Auf `compact` erscheint der Hauptinhalt ohne vorherige volle Sidebar-Karte; Nav über Trigger/Select erreichbar.

### Welle 3 – Listen (P2) + Filter (P3) + Settings (P5) + Home (P6)

- [ ] Card-Listen: Notifications, Catalog, Admin Nutzer (Pilot)
- [ ] Catalog-Filter-Sheet
- [ ] Settings Drill-down im Modal
- [ ] Home-Illustration mobil entschärfen
- [ ] Kurzer Audit: weitere Zwei-Spalten-Modals; Approvals/Workspace auf Wrapper umstellen (wenn noch offen)

**Done when:** Bild 1, 3, 4, 6, 7-Symptome am Pilot behoben; Templates/Help bereits aus Welle 2 nutzbar.

### Welle 4 – Restliche App-Flächen + Absicherung

- [ ] Document Reader/Editor (Toolbar, Panels) – eigener Mini-Audit + Fixes
- [ ] Context/Org Workspace, Trash/Archive, Approvals (Wrapper + Listen wo nötig)
- [ ] Login / Demo-Login Touch
- [ ] Search, What's new (kurz)
- [ ] Regression: Desktop `wide` unverändert nutzbar
- [ ] Optional: Landing Mobile-Review (§19) als separates Workstream
- [ ] Optional: Spike Bottom-Nav Hybrid (P4-f, §2.8) – Entscheidung übernehmen/verwerfen

**Done when:** Abdeckungslücken aus Inventar §6 abgearbeitet oder bewusst zurückgestellt (mit Notiz im Inventar).

---

## 4. Nicht-Ziele (Welle 1–3)

- Kein Redesign der Desktop-IA
- Kein neues Design-System / keine neuen Farben außer bestehendem Mantine-Theme
- Keine vollständige Admin-Pixel-Parität aller Untertabs vor dem Shared-Pattern
- Kein erzwungenes Help-DE
- Landing nicht in denselben Merge-Zügen wie App-Shell/Patterns
- Keine Bottom-Navigation in Welle 1–3, solange P4-f nicht explizit entschieden ist

---

## 5. Tests & Abnahme

| Art           | Vorgabe                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------- |
| Manuell       | Chrome/Firefox DevTools: 375 und 390 Breite; plus ~800px (`compact` aber Shell schon desktop) |
| Checkliste    | Zu jeder Welle: die zugehörigen Inventar-Bilder / Problemklassen                              |
| Regression    | Eine Desktop-Breite (≥ 1280): Sidebars und Tabellen wie zuvor                                 |
| Automatisiert | Kein Zwang zu neuen E2E in Welle 1; bei Shared-Wrapper ggf. leichte Component-Tests später    |

---

## 6. Umsetzungs-Todo

Siehe [Umsetzungs-Todo §20](Umsetzungs-Todo.md) – Mobile-Review verweist auf Inventar + diesen Plan. Wellen oben sind die Arbeitspakete; Checkboxen hier bei Fortschritt pflegen.

---

## 7. Änderungsprotokoll

| Datum      | Änderung                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------- |
| 2026-08-06 | Erstfassung: Entscheidungen P1–P7, Wellen 0–4                                               |
| 2026-08-06 | Offenpunkt P4-f: Hybrid-Bottom-Nav (§2.8), Spike nach Welle 1/2                             |
| 2026-08-06 | Welle 0 Konstanten + Welle-1-Umsetzungscheckliste konkretisiert                             |
| 2026-08-06 | Welle 1 Abnahme (Smoke-Checkbox); Welle-2-Umsetzungscheckliste abgeleitet                   |
| 2026-08-06 | Welle 2: `ResponsiveContentNav` + Pilot Admin/Help/Templates/Notifications; Breadcrumb wrap |
