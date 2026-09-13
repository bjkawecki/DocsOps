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
| Listen-Suche (Compact) | **Search-FAB** → Sheet (§2.5.1); Count-Zeile im Content; kein Inline-Feld |
| Catalog-Filter     | Search-FAB + Filter-FAB; Filter-Rest im Drawer                             |
| Admin-Toolbar      | Search-FAB; Primäraktion im FAB-Stack (§2.9); Scope-Filter im Search-Sheet |
| Primärbuttons      | Auf `narrow` full-width unter Titel/Breadcrumb, wenn sie mit dem Titel kollidieren |

#### 2.5.1 Listen-Suche Compact – Search-FAB (Zielbild)

**Status (2026-09-13):** Plan-Ziel **bewusst geändert**. Früher Welle 3: „Suche immer sichtbar“ im Flow; kurz Sticky-Search; **final:** unter Compact **Search-FAB** → Bottom-Sheet (wie Filter), kein dauerhaftes Suchfeld im Content.

**Regel (unter `compact` / &lt; `lg`):**

| Ja | Nein |
| --- | --- |
| Search-Icon im FAB-Stack (§2.9); aktiv (blau), wenn Query gesetzt | Dauerhaftes Suchfeld / Sticky-Band im Listen-Flow |
| Suche im Bottom-Drawer (`useCompactListSearchFab`); Fokus beim Öffnen | Search hinter Shell-Top-Bar oder Ctrl/⌘K ersetzen |
| Trefferzahl als schmale Count-Zeile im Content | Wide: unverändert Inline-Toolbar |

**Flächen:** Catalog, Context-/Firmen-Dokumentlisten, Shared, Trash/Archive, Admin-Listen mit Suche.

**Shared:** [`useCompactListSearchFab`](../../apps/frontend/src/components/ui/StickySearchChrome.tsx) + Registrierung über `PageMobileActionsHost` (mehrere Registranten merge).

**Nicht:** Globale App-Suche ersetzen (Ctrl/⌘K / Search-Modal bleibt Shell).

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

### 2.8 Bottom-Navigation (P4-f) – verworfen

**Status (2026-08-07):** **verworfen**. Kein Hybrid, keine Bottom-Bar.

**Begründung:** DocsOps hat eine tiefe, rollenabhängige Main-Nav. Shell-Drawer (Welle 1) plus Content-Nav-Drawer (Welle 2+) decken Navigation und Content-first ab. Eine dritte Nav-Zone (Bottom-Bar) würde Safe-Area, Debug-FAB und doppelte Active-States verdoppeln ohne klaren Gewinn.

Historischer Optionsraum (nur Dokumentation): Hybrid mit 4–5 Primärs + „Mehr“ → Drawer war die einzige denkbare Variante; nicht umgesetzt.

### 2.9 Page Mobile Actions (FAB-Stack) – gewählt

**Status (2026-09-13):** Pattern festgelegt; Shared-Baustein + Seiten-Migration (Welle 5) im Code. **Offen:** manuelle Viewport-Abnahme.

**Regel (unter `compact` / &lt; `lg`):** Seiten-Chrome-Aktionen (nicht Modal-Footer, nicht Shell-Top-Bar, nicht Zeilen-/Listen-Inline) liegen in einem **vertikalen FAB-Stack unten rechts**, über dem Inhalt und **über** dem Debug-FAB. Breadcrumb-Trail bleibt freigeräumt (`useSetAppShellBreadcrumbActions(null)` unter Compact).

**Abgrenzung zu §2.8:** Das ist **keine** App-Bottom-Nav. Content-Nav bleibt Drawer von links; nur der **Trigger** (und sonstige Page-Actions) wandert in den Stack.

| Rein in den FAB-Stack | Nicht in den FAB-Stack |
| --- | --- |
| Breadcrumb-CTAs (Create / Save / …) | Shell-Top-Bar (Bell, Settings, Help, Burger, Account) |
| `ResponsiveContentNav`-Trigger | Modal-/Drawer-Footer (Cancel/Create im Dialog) |
| Primäre Objekt-Aktionen der Seite (z. B. Delete des aktuellen Typs) | Listen-/Tabellen-Zeilenaktionen, Toolbar in Filter-Sheets |
| Max. ~3 sichtbare Icons; Rest in `⋯`-Menü | Ungebündelte Admin-Toolbars mit vielen Text-Buttons |

**Shared Baustein:** [`PageMobileActionBar`](../../apps/frontend/src/components/ui/PageMobileActionBar.tsx) (+ CSS). Position/Größe/`z-index`/Debug-Offset nur dort.

**Konventionen:**

- Stack-Reihenfolge oben → unten: sekundär (z. B. Nav-Trigger, Delete) → primär (Create/Save) **unten**, nah am Debug-FAB.
- Modal offen → FAB `hidden`; Modal `zIndex` ≥ 1100 (über Debug).
- Wide (`lg+`): bisherige Breadcrumb-Actions / Inline-Buttons unverändert.
- Document Edit / Templates / View / Admin / Workspace / Catalog / Notifications nutzen `PageMobileActionBar` (ggf. dünne Seiten-Wrapper).
- **Farben:** Semantische Tones in [`pageMobileFabTokens.ts`](../../apps/frontend/src/components/ui/pageMobileFabTokens.ts) – gleiches Icon/Role → gleicher Tone app-weit (`nav`, `search`, `filter`, `create`, `edit`, `save`, `more`, `danger`, `secondary`, `active`). Chrome (`nav`/`more`/`search`/`filter`) als `light`, Primaries als `filled` (Dark-Mode-lesbar).

**Nicht:** Globale Bottom-Bar; FABs in Landing; Touch-Target-Regression auf Shell-Top-Bar (≥44px bleibt); ad-hoc `color:` an FAB-Call-Sites.

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
- [x] Lint / i18n-check

**Nicht in Welle 2:** Card-Listen (P2), Catalog-Filter-Sheet, Settings-Drill-down, Home-Illustration (Welle 3); Approvals/Workspace/Trash folgen demselben Wrapper danach (Welle 3/4).

**Done when:** Auf `compact` erscheint der Hauptinhalt ohne vorherige volle Sidebar-Karte; Nav über Trigger/Select erreichbar.

### Welle 3 – Listen (P2) + Filter (P3) + Settings (P5) + Home (P6)

- [x] Card-Listen: Notifications, Catalog, Admin Nutzer (Pilot) – `EntityListCard` + `WIDE_MIN_WIDTH`
- [x] Catalog-Filter-Sheet (Search + Count sichtbar; Rest im Drawer unter compact) – **Search-Verhalten später Sticky (§2.5.1 / Welle 6)**
- [x] Settings Drill-down im Modal (fullscreen + Nav/Content; Deep-Link öffnet Content)
- [x] Home-Illustration mobil entschärfen (`visibleFrom="lg"` + opaque Feed-Hintergrund)
- [x] Kurzer Audit: weitere großen App-Modals einspaltig (kein P5); Approvals + Context Workspace auf `ResponsiveContentNav` (Trash/Shared/MostRead → Welle 4)
- [ ] Manuell @375 / ~800 / ≥1280 Regression
- [x] Lint / i18n-check

**Done when:** Bild 1, 3, 4, 6, 7-Symptome am Pilot behoben; Templates/Help bereits aus Welle 2 nutzbar.

### Welle 4 – Restliche App-Flächen + Absicherung

#### Umsetzungscheckliste

- [x] Trash/Archive + MostRead → `ResponsiveContentNav`
- [x] Shared → `ResponsiveContentNav`
- [x] Listen-Cards: Trash/Archive, Drafts, ContextDocuments, Approvals (`EntityListCard` + `WIDE_MIN_WIDTH`)
- [x] Document: Breakpoint `lg` (75em), Chrome via `ResponsiveContentNav` unter compact, Toolbar Touch ≥44px auf narrow
- [x] Login/Demo Touch-Targets (≥44px)
- [x] Search Modal narrow fullscreen; What's new Collapse Hit-Area ≥44px
- [x] P4-f als verworfen dokumentiert (§2.8); Landing unberührt (§19)
- [ ] Manuell 375 / ~800 / ≥1280 (Abnahme durch Reviewer)
- [x] Lint / i18n-check (`pnpm run lint`, `pnpm run check:i18n`)

**Done when:** Abdeckungslücken aus Inventar §6 abgearbeitet oder mit Notiz zurückgestellt; Desktop `wide` unverändert nutzbar.

### Welle 5 – Page Mobile Actions (FAB-Stack, §2.9)

Kurzziele: Shared `PageMobileActionBar` nutzen; unter Compact Breadcrumb-CTAs und Content-Nav-Trigger in den FAB-Stack; Modals ausgenommen.

#### Umsetzungscheckliste

- [x] Pattern §2.9 + Inventar in Umsetzungs-Todo §20
- [x] Shared Baustein `PageMobileActionBar` (+ CSS); Menu/Slot + `PageMobileActionsHost` / `useCompactContentNavFab`
- [x] Document Edit + Templates auf Shared umstellen (bestehende lokalen Bars entfernen)
- [x] Content-Nav-Trigger flächendeckend via `compactNavOpenRef` + FAB (Admin, Help, Approvals, Workspace, Trash, MostRead, Shared, Document View)
- [x] Breadcrumb-Create/Save-Seiten laut Inventar §20 migrieren
- [x] Document View (Lesen): Toolbar-Actions in FAB / Overflow
- [x] Notifications: Mark-all + Unread-Filter-Strategie (Switch ggf. im Inhalt lassen)
- [x] Catalog: Filter-Button als FAB-Kandidat prüfen
- [x] Modal offen → FAB hidden; Modal z-index über Debug (Best Practice)
- [ ] Manuell @375 / ~800 / ≥1280
- [x] Lint / i18n-check

**Done when:** Unter Compact keine langen Text-CTAs in der Breadcrumb-Zeile auf inventarisierten Seiten; Wide unverändert.

### Welle 6 – Compact Listen-Suche als Search-FAB (§2.5.1)

Kurzziele: Kein dauerhaftes Suchfeld unter Compact; Search-FAB → Sheet; Filter weiter FAB/Drawer.

#### Umsetzungscheckliste

- [x] Pattern §2.5.1 + Eintrag Umsetzungs-Todo §20
- [x] Shared `useCompactListSearchFab` (+ Host merge mehrerer Registranten)
- [x] Catalog, Context-Docs/Shared, Trash/Archive
- [x] Admin Users + Entity-Toolbars (Teams/Departments)
- [ ] Manuell @375 / ~800 / ≥1280
- [x] Lint / i18n-check

**Done when:** Unter Compact keine Inline-Listen-Suche; Search-FAB öffnet Sheet; Wide unverändert.

---

## 4. Nicht-Ziele (Welle 1–3)

- Kein Redesign der Desktop-IA
- Kein neues Design-System / keine neuen Farben außer bestehendem Mantine-Theme
- Keine vollständige Admin-Pixel-Parität aller Untertabs vor dem Shared-Pattern
- Kein erzwungenes Help-DE
- Landing nicht in denselben Merge-Zügen wie App-Shell/Patterns
- Keine Bottom-Navigation (P4-f verworfen, §2.8)
- Keine FAB-Migration in Welle 5 für Zeilenaktionen / Modal-Footer / Shell-Top-Bar (§2.9)
- Kein dauerhaftes Compact-Listen-Suchfeld im Content (Search-FAB §2.5.1)

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

| Datum      | Änderung                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| 2026-08-06 | Erstfassung: Entscheidungen P1–P7, Wellen 0–4                                                             |
| 2026-08-06 | Offenpunkt P4-f: Hybrid-Bottom-Nav (§2.8), Spike nach Welle 1/2                                           |
| 2026-08-06 | Welle 0 Konstanten + Welle-1-Umsetzungscheckliste konkretisiert                                           |
| 2026-08-06 | Welle 1 Abnahme (Smoke-Checkbox); Welle-2-Umsetzungscheckliste abgeleitet                                 |
| 2026-08-06 | Welle 2: `ResponsiveContentNav` + Pilot Admin/Help/Templates/Notifications; Breadcrumb wrap               |
| 2026-08-07 | Welle 3: Card-Listen, Catalog-Filter, Settings-Drill-down, Home-Illustration, Approvals/Workspace Wrapper |
| 2026-08-07 | Welle 4: Restflächen Wrapper/Cards/Document/Login/Search; P4-f verworfen                                  |
| 2026-09-13 | Checkbox-Drift: Welle-2 Lint abgehakt; §20 Mobile App vs Landing getrennt                              |
| 2026-09-13 | §2.9 Page Mobile Actions (FAB); Welle 5; Shared `PageMobileActionBar`; Inventar Umsetzungs-Todo §20   |
| 2026-09-13 | Welle 5 Code: Shared-Bar, Content-Nav-FABs, Admin/Workspace/Document/Catalog/Notifications Migration |
| 2026-09-13 | §2.5.1 Sticky-Search: Plan-Ziel ersetzt „Suche immer sichtbar“; Welle 6; kein Search-FAB |
| 2026-09-13 | §2.5.1 final: Search-FAB → Sheet statt Sticky; Welle 6 Code umgestellt |
| 2026-09-13 | §2.9 FAB-Farben: semantische Tones (`pageMobileFabTokens`); Dark-Mode light/filled |
