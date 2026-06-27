# Umsetzungs-Todo

Phasen und Abschnitte für die Umsetzung der internen Dokumentationsplattform. Siehe [Technologie-Stack](Technologie-Stack.md), [Infrastruktur & Deployment](Infrastruktur-und-Deployment.md) und [Doc-Platform-Konzept](../platform/Doc-Platform-Konzept.md).

**Empfohlener Einstieg:** Abschnitt 1 + 2 (Grundgerüst + Datenmodell), dann 3–4 (Auth, Rechte), danach 5–14 (Kern-API, Frontend, Layout, Settings, Admin-UI, Kontexte-Verwaltung, Company Page, Department/Team Pages, Dashboard, Catalog, Dokumente-UI). **Phase 2** (später): Abschnitte 15–20 (Versionierung, MinIO, Async Jobs, Volltextsuche, Deployment-Doku, Layout- & UX-Ergänzungen). **Optional:** Abschnitt 21 (KI-Assistent / Dokumenten-Frage), Abschnitt 22 (Kommentar-Sektion pro Dokument). **Notifications (Konzept & Ausbau):** Abschnitt 23; **Live-Updates (SSE):** Abschnitt 23a. **Referenz:** [Dokument-Lifecycle-Analyse](Dokument-Lifecycle-Analyse.md) – Zustandsmaschine, Events, Permissions, Seiteneffekte und Inkonsistenzen.

**Geplante Großumstellung Edit-/Kollaborationsmodell:** [Edit-System: Blocks (JSON), Suggestions, Lead-Draft (Variante A)](Edit-System-Blocks-Suggestions-Lead-Draft.md) – ersetzt Markdown-first-Editing schrittweise. **Umgesetzt (ADR 003):** Scope Authors bearbeiten den Lead-Draft direkt; Draft-Change-Ops + Reviews-Inbox + SSE-Presence; Suggestions entfernt. Siehe [ADR 003](../platform/adr/003-scope-author-direct-draft.md). **PR-/Epic-Aufteilung:** [Edit-System-Blocks-PR-Epics.md](Edit-System-Blocks-PR-Epics.md). **EPIC-9 (Legacy abschalten):** `DOCUMENT_LEGACY_DRAFT_ENABLED` und HTTP 410 für persönlichen Markdown-Entwurf / Draft-Requests; Details im Epic-Abschnitt EPIC-9.

---

## 1. Grundgerüst / Infrastruktur

[x] Repo-Struktur anlegen (Backend, Frontend, `docker-compose.yml`, `docs/`, `scripts/`)
[x] `docker-compose.yml`: App, PostgreSQL, MinIO, Caddy (ggf. separater Worker später)
[x] Dev-Setup: **Schnell-Dev** (nur DB + MinIO in Docker, App/Frontend auf Host) und **Prod-nah** (vollständiger Stack mit Caddy, App per Volume + Watch; Zugriff über [http://localhost:5000](http://localhost:5000)) – siehe [Infrastruktur §9](Infrastruktur-und-Deployment.md#9-entwicklungsumgebung)
[x] `install.sh`: Voraussetzungen prüfen (Docker/Podman), Stack starten
[x] Caddy-Beispiel-Config (Reverse Proxy auf App)
[x] Minimale App startet und ist über Caddy erreichbar
[x] **CI:** Job zum Test des Install-Skripts (frischer Runner, `install.sh` ausführen, Health-Check) – siehe [Infrastruktur §10](Infrastruktur-und-Deployment.md#10-test-des-install-skripts)

---

## 2. Datenmodell & Backend-Basis

[x] Prisma-Schema: Firma, Abteilung, Team, Nutzer, Kontexte (Prozess, Projekt, Unterkontext), Owner optional mit ownerUserId für persönliche Kontexte, Dokument, Zugriffsrechte (n:m)
[x] Migrationen anlegen und ausführen (`prisma migrate`)
[x] Fastify-Skelett (TypeScript), Prisma anbinden
[x] Health-Route (DB-Erreichbarkeit)
[x] Erste Lese-Route gegen DB (z. B. Liste Firma/Abteilungen) zum Abgleich mit Schema
[x] Logger-Konfiguration (Level über `LOG_LEVEL`, Format Dev/Prod; Pino, optional pino-pretty in Dev)
[x] Zentraler Error-Handler (Fastify `setErrorHandler`; Zod → 400, Prisma NotFound → 404, sonst 500; einheitliches Fehlerformat)

---

## 3. Auth

[x] Login (lokal oder LDAP/SSO-Anbindung)
[x] **Sessions** (Postgres, httpOnly-Cookie); Middleware „Nutzer aus Request“
[x] Geschützte Routen nur mit gültiger Auth
[x] **Login-Seite (UI/UX):** Aktuell minimales zentriertes Paper mit E-Mail/Passwort und Button. Vorschläge zur besseren Gestaltung:
[x] **Layout:** Volle Viewport-Höhe nutzen, Formular vertikal zentrieren (`minHeight: 100vh`, Flexbox); dezenter Hintergrund (z. B. helles Grau oder subtiler Verlauf), damit die Karte sich abhebt; leichter Schatten auf dem Paper.
[x] **Branding & Kontext:** Produktname/Logo oberhalb des Formulars; kurzer Untertitel (z. B. „Internal documentation“); bei SSO optional Hinweis „Use your company account“ oder „Sign in with SSO“.
[x] **Formular:** Autofocus auf E-Mail-Feld; Fehlermeldung nach Login-Fehler als Alert oder klar hervorgehoben; Submit-Button optisch betonen (Primary, ggf. größer); optional „Remember me“, falls Backend persistente Session unterstützt.
[x] **Barrierefreiheit:** Nach fehlgeschlagenem Login Fokus auf E-Mail oder Fehlermeldung setzen; Labels mit Inputs verbinden (for/id); Fehlermeldung per aria-describedby anbinden.
[x] **Optionale Inhalte:** „Forgot password?“-Link, falls Reset-Flow existiert; Hinweis „Contact IT for access“ für neue Nutzer, falls kein öffentliches Sign-up.
[x] **Konsistenz:** Login-Seite an gleiches Theme (Hell/Dunkel) wie die App anbinden (z. B. ThemeFromPreferences), damit der Übergang nach dem Login stimmig ist; gleiche Mantine-Variablen (Schrift, Abstände) wie im Rest der App.

---

## 4. Rechte

[x] Logik `canRead(userId, dokumentId)` / `canWrite(userId, dokumentId)` (vgl. [Rechtesystem](../platform/datenmodell/Rechtesystem.md))
[x] Middleware für Dokument-Routen (z. B. `requireDocumentAccess('read'|'write')`)
[x] Anbindung an Prisma (User inkl. Teams, Abteilungen, Superuser; Dokument inkl. Leser/Schreiber)

---

## 5. Kern-API

[x] CRUD Organisation (Firma, Abteilung, Team)
[x] CRUD Kontexte (Projekt, Prozess, Unterkontext); Prozesse/Projekte mit Owner = Nutzer (ownerUserId) für persönlichen Bereich
[x] CRUD Dokumente (Titel, Markdown-Inhalt, Kontext, Tags)
[x] Zuweisung Leser/Schreiber pro Dokument (Nutzer, Team, Abteilung)
[x] API für Zuordnungen (TeamMember, Team Lead, Department Lead) – GET/POST/DELETE pro Ressource; Berechtigung: Admin alles, Department Lead für Teams seiner Abteilung (Member + Team Lead), Team Lead für sein Team (nur Member)
[x] Validierung (Zod), Fehlerbehandlung

---

## 6. Frontend-Basis

[x] Component-/Style-Library: **Mantine**
[x] React (Vite, TypeScript), React Router, TanStack Query
[x] Layout (Hauptnavigation), Routing-Struktur (/, /team/, /catalog, … vgl. [Intranet-Dashboard](../platform/ui-architektur/Intranet-Dashboard.md))
[x] **Caddy/Proxy (Szenario B):** Routing `/api` → Backend, `/` → Frontend (eine Origin, Cookie ohne CORS); Frontend als Service im Stack (Dev-Server oder Build)
[x] API-Client (Base-URL = gleiche Origin), Typen aus Backend/Prisma teilen
[x] Einfache Seiten pro Bereich (Platzhalter oder erste Listen)

---

## 7. Layout & Navigation

[x] **Struktur (Backstage-orientiert):** Zweiteiliges Layout ohne Nav-Kopfleiste: nur **Sidebar** (links) + **Main** (rechts). Main immer: (1) Seiten-Header oben (Titel, ggf. Metadaten/Aktionen), (2) bei Unterbereichen Tabs, sonst direkt (3) Content.
[x] **Tab-Bereich:** Auf **jeder Page außer Catalog** gibt es einen Tab-Bereich unter dem Seiten-Header. Gibt es keine weiteren Tabs, heißt der einzige Tab **„Overview“**. (Catalog hat keinen Tab-Bereich.)
[x] **Sidebar (neu):** Logo oben. Haupt-Navigation in dieser Reihenfolge:
[x] **Home (Dashboard):** Einstieg `/` (Dashboard/Überblick; vgl. §10); Label in der Sidebar aktuell **Dashboard**.
[x] **Catalog:** Entry-Point `/catalog` für alle Dokumente als **Tabelle**, filter-, such- und sortierbar.
[x] **Team / Department / Company** – **Rollenabhängige Darstellung** (Zwischenüberschrift **Organization**; Nutzer ohne geladene `me`-Identity sehen zunächst generische Company/Department/Team-Links; nach Laden rollenspezifische Struktur):
[x] **Team-Member:** Links **Company**, **Department** (eigene Abteilung, falls bekannt), **Team** (eigenes Team, falls bekannt); sonst Platzhalter-Routen `/department`, `/team`.
[x] **Department-Lead:** **Company**, **Department** (klickbar), Zwischenüberschrift **Teams** mit aufklappbarer Liste der Team-Namen der Abteilung.
[x] **Company-Lead / Admin:** **Company**; aufklappbar **Departments** (Abteilungen mit Count); aufklappbar **Teams** (nach Abteilung gruppierte Team-Links mit Count).
[x] **Personal:** Entry-Point `/personal` für eigene Prozesse, Projekte und Dokumente (Owner = Nutzer); Struktur analog zu Company/Department/Team (Tabs, Overview mit Recent Items, Karten); siehe §11a.
[x] **Shared:** Entry-Point `/shared` für per Grant geteilte Inhalte; Struktur analog zu Company/Department/Team (Tabs, Overview mit Recent Items, Karten); siehe §11a.
[x] **Reviews** (bedingt): NavLink **Reviews** `/reviews` nur wenn der Nutzer Review-Rechte hat (`hasReviewRights` in `AppShell`).
[x] **Sidebar unten:** Account-Dropdown (Trigger: E-Mail oder Name) mit **Admin** (nur bei `isAdmin`, z. B. `/admin/users`), **Help** (`/help/overview`), **Settings**, Trennlinie, **Log out**. Kein Admin in der Haupt-Navigation.
[x] **Main-Content:** Thematische Karten/Cards, einheitliche Abstände; Loading States (Skeletons/Spinner), Fehlerbehandlung (API-Fehler, 404, Fehlerseite), Toasts/Notifications für Erfolg und Fehler.

---

## 8. Settings-Seite

Vor Admin umgesetzt, damit Theme (Hell/Dunkel/Auto) früh app-weit gilt. Einstellungen von Anfang an im Backend persistieren (kein localStorage als Übergang).

[x] **Route & Layout**
[x] Einstiegsseite unter z. B. `/settings`, erreichbar aus der Sidebar (unten, wie in Abschnitt 7).
[x] Seiten-Header „Settings“, darunter **Tabs:** General | Account | Security | Storage | Notifications (`SettingsPage.tsx`) – Inhalte, die früher als eine „General“-Card-Fläche beschrieben waren, sind auf Tabs verteilt (u. a. Profile/Appearance/Identity im Tab **General**).
[x] **Backend: Me & Preferences**
[x] GET `/api/v1/me` – erweiterte Nutzerdaten inkl. Zugehörigkeiten (Teams mit Rolle Mitglied/Team Lead, Abteilung(en), Department Lead) für DocsOps-Identity; nur eigener User (Session); inkl. `hasLocalLogin` (Account-Card nur bei lokalem Login).
[x] PATCH `/api/v1/me` – eigenes Profil bearbeiten (**nur Anzeigename**); nur eigener User; Validierung (Zod). E-Mail/Passwort über Account (PATCH `/api/v1/me/account`).
[x] GET/PATCH `/api/v1/me/preferences` – User-Preferences: u. a. `theme`, `sidebarPinned`, `locale`, `primaryColor`, `textSize`, `recentItemsByScope` (Zod in `routes/schemas/me.ts`); Persistenz im Backend; eine Quelle der Wahrheit für alle Clients.
[x] POST `/api/v1/me/deactivate` – Self-Deactivate (setzt `deletedAt`); nur für Nicht-Admins (letzter Admin darf nicht); alle Sessions des Users löschen.
[x] PATCH `/api/v1/me/account` – E-Mail und/oder Passwort ändern (nur bei lokalem Login, d. h. `passwordHash` gesetzt); Zod: `email?`, `currentPassword?`, `newPassword?` (Mindestlänge 8); E-Mail-Uniqueness, Verifizierung aktuelles Passwort.
[x] GET `/api/v1/me/sessions` – Liste der Sessions (id, createdAt, expiresAt, isCurrent aus Session-Cookie); DELETE `/api/v1/me/sessions/:sessionId` (nur eigene Session); optional DELETE `/api/v1/me/sessions` = alle anderen Sessions beenden.
[x] **UI-Inhalte (verteilt auf Tabs General / Account / Security / Storage / Notifications)**
[x] **Profile (Tab General):** Anzeige User (Name, E-Mail read-only, isAdmin). **Dreipunkt-Menü** (Mantine Menu): „Edit“ → Modal nur **Anzeigename**, PATCH `/api/v1/me`; „Deactivate“ (rot, nur wenn `!user.isAdmin`) → Bestätigungs-Modal, POST `/me/deactivate`, dann Logout + Redirect zu Login, Toast.
[x] **Account (Tab Account):** Nur bei lokalem Login (`hasLocalLogin`): E-Mail read-only, Buttons „Change email“ / „Change password“ mit Modals; PATCH `/api/v1/me/account`. Bei SSO: Hinweis „Login managed by SSO“, keine Bearbeitung.
[x] **Appearance (Tab General):** Theme **Light / Dark / Auto**, „Pin Sidebar“, **Primary color**, **Text size**, **Interface-Sprache** (en/de); Persistenz über PATCH `/api/v1/me/preferences`; Theme app-weit (`ThemeFromPreferences`, `createAppTheme`).
[x] **Notifications (Tab Notifications):** Platzhalter („Notification preferences will be available here …“); konkrete Optionen später (vgl. §17, §20).
[x] **Sprache:** in **Appearance** integriert (nicht eigene „Language-Card“); PATCH `/api/v1/me/preferences` mit `locale`.
[x] **Security / Sessions (Tab Security):** Liste der Sessions (Created, Expires, „Current session“-Badge), Revoke pro Zeile (außer aktueller Session), „Revoke all other sessions“.
[x] **Storage (Tab Storage):** Speicherübersicht pro Scope (u. a. personal / Team / Department / Company); ergänzend zur ursprünglichen Planliste umgesetzt.
[x] **DocsOps-Identity (Tab General):** User-Entity und Ownership-/Zugehörigkeits-Entitäten (Teams inkl. Rolle, Abteilung(en), Department Lead). Daten aus GET `/api/v1/me`.

---

## 9. Admin-UI / Nutzerverwaltung

**Stand Backend:** `requireAdmin` ist vorhanden (`auth/middleware.ts`), wird in Organisation- und Assignments-Routen genutzt. **Nutzer-API** unter `/api/v1/admin/users` ist umgesetzt (GET/POST/PATCH, reset-password).

[x] **Zugang & Struktur**
[x] Admin-Bereich nur für Nutzer mit `isAdmin` (`AdminGuard.tsx`: Redirect zu `/` für Nicht-Admins; Anzeige erst nach geladenem `useMe`).
[x] Route `/admin` mit Unterrouten: `/admin/users`, `/admin/teams`, `/admin/departments`, `/admin/company` (Organisation-Tab entfällt; `App.tsx` + `AdminPage.tsx`).
[x] Menüpunkt „Admin“ in der Sidebar nur anzeigen, wenn aktueller Nutzer `isAdmin` (`AppShell.tsx`, Nutzerdaten aus `useMe`).
[x] **Einheitliches Tab-Design (vier Tabs):** Jeder Tab nutzt dasselbe UX-Muster: **Filter/Suche** (scope-spezifisch), **Liste/Tabelle** aller Einträge, **Create-Button** immer sichtbar und klickbar (Parent z. B. Company/Department im Modal), **Zeile auswählen** → Detailbereich (Members, Leads, Edit, Delete). Company-Tab: Bei nur einer Firma eine **einzelne Karte** (Name, Company leads, Edit); bei mehreren Firmen gleiches Listen-/Filter-Pattern. **Umgesetzt** in `AdminUsersTab`, `AdminTeamsTab`, `AdminDepartmentsTab`, `AdminCompanyTab` (Auswahl öffnet Card/Detail mit Tabs inkl. Zuordnungen wo vorgesehen).
[x] **Backend: Nutzer-API (neu)**
[x] GET `/api/v1/admin/users` – Nutzerliste (paginiert); Filter optional, inkl. **Filter „nur Aktive“ / „inkl. Deaktivierte“** (Query `includeDeactivated=true`); nur für Admins (`routes/admin.ts`, `requireAdmin`).
[x] POST `/api/v1/admin/users` – Nutzer anlegen (Name, E-Mail, Passwort, optional `isAdmin`); nur für Admins.
[x] PATCH `/api/v1/admin/users/:userId` – Nutzer bearbeiten (Name, E-Mail, `isAdmin`); **Deaktivierung:** `deletedAt` setzen (Soft Delete); **Reaktivierung:** `deletedAt` auf `null` setzen (Admin kann deaktivierte Nutzer wieder aktivieren). Kein Hard-Delete.
[x] **Passwort-Reset:** Nur Admin setzt für andere Nutzer ein neues Passwort (POST `/api/v1/admin/users/:userId/reset-password` mit Body `{ newPassword }`); keine Anzeige des bestehenden Passworts. Kein Self-Service „Passwort vergessen“ in dieser Phase.
[x] **Frontend: Nutzerverwaltung**
[x] Seite „Nutzer“ (`/admin/users`, `AdminUsersTab.tsx`): Tabelle mit Name, E-Mail, Admin-Flag, Status; Filter „Aktive“ / „Alle (inkl. deaktiviert)“; Suche, Sortierung, Pagination.
[x] Nutzer anlegen: Formular (Name, E-Mail, Passwort, Checkbox isAdmin); Validierung; Toasts bei Erfolg/Fehler.
[x] Nutzer bearbeiten: Formular (Name, E-Mail, isAdmin); **Deaktivieren** / **Reaktivieren**; Admin-**Passwort setzen** (Reset) über UI.
[x] **Frontend: Zuordnungen (TeamMember, Team Lead, Department Lead)**
[x] Anbindung an API: `GET/POST/DELETE /api/v1/teams/:teamId/members`, `GET/POST/DELETE /api/v1/teams/:teamId/team-leads`, `GET/POST/DELETE /api/v1/departments/:departmentId/department-leads` (siehe `assignments.ts`; Admin nutzt u. a. `GET /api/v1/admin/teams/:teamId/members` für Listen).
[x] Pro Team: Mitglieder sowie Team Leads in den Admin-Tabs (Team-Detail in `AdminTeamsTab`) anzeigen, hinzufügen, entfernen; Rechte wie Backend.
[x] Pro Abteilung: Department Leads in `AdminDepartmentsTab` (Detail) verwalten.
[x] UI: Team-Zeile in `/admin/teams` auswählen → Card/Detail mit Tabs inkl. Members & Team leaders (analog Departments/Company mit Leads).
[x] **Admin Tab „Teams“ (einheitliches Design):** Alle Teams listen (aus allen Departments), Filter (Name, Department); Create Team immer möglich (Department im Modal); Zeile auswählen → Members/Team leaders, Edit, Delete. (`AdminTeamsTab.tsx`, Route `/admin/teams`.)
[x] **Admin Tab „Departments“:** Alle Abteilungen listen, Filter (Name, Company); Create Department (Company im Modal); Zeile auswählen → Department leads, Edit, Delete. (`AdminDepartmentsTab.tsx`, Route `/admin/departments`.)
[x] **Admin Tab „Company“:** Company-Verwaltung (Tabelle, Zeile → Detail mit Stats/Leads) + Company leads; Create Company per Modal (auch bei mehreren Companies). (`AdminCompanyTab.tsx`, Route `/admin/company`.)
[x] **Organisation-Tab entfernen:** Inhalte auf Tabs Company, Departments, Teams verteilt; es gibt keine Route `/admin/organisation` und keine `AdminOrganisationTab` mehr (nur noch `AdminPage` mit Tabs Users / Teams / Departments / Company).
[x] **Dev-Feature (Admin): Ansicht „als Nutzer X“** – Admins können die Oberfläche bzw. Daten so sehen, als wären sie ein anderer Nutzer (ohne sich auszuloggen); nur für Admins, z. B. zur Prüfung von Rechten oder Support.

---

## 10. Kontexte-Verwaltung (Company Page)

Kontexte (Projekt, Prozess, Unterkontext) in der UI verwalten; Backend-CRUD existiert (Abschnitt 5). Einstieg auf der **Company-Seite** (`/company`). Company-Lead und Admin können Kontexte erstellen, aktualisieren und löschen.

### 1. Einheitliche Context-Komponenten

[x] **Wiederverwendbare Bausteine** für alle Kontext-Seiten (Company, später Department, Team): **ContextCard** (eine Karte pro Kontext: Titel, Typ-Badge, optional Metadaten, Link zur Detail-Seite, bei Berechtigung Actions-Menü), **ContextGrid** (SimpleGrid/Flex aus ContextCards), **NewContextModal** (Modal zum Anlegen; Inhalt/Scope pro Seite).
[x] Gleiche Komponenten auf Company-, Department- und Team-Seiten nutzen; nur Scope (companyId/departmentId/teamId) und Berechtigungen unterscheiden sich.

### 2. Modal „New Context“

[x] **Button „New context“** (bzw. „Kontext anlegen“) in den Page-Actions; nur für Company-Lead und Admin.
[x] **Modal-Aufbau:** (1) **Typ wählen:** zwei Optionen – **Prozess** oder **Projekt** (mit kurzem Hinweis zur Bedeutung). (2) **Name:** Pflichtfeld (max. 255 Zeichen). Owner auf Company Page fest = aktuelle Company (`effectiveCompanyId`); kein Auswahlfeld. Actions: Cancel / Create (POST `/processes` oder POST `/projects` mit `companyId`).

### 3. Darstellung der Kontexte: Card-Grid

[x] **Card-Grid** pro Tab (Prozesse, Projekte): eine **ContextCard** pro Kontext mit Titel, **Typ-Badge** („Prozess“ / „Projekt“), optional Dokumentenanzahl/letzte Aktivität; Klick auf Karte → Kontext-Detail (später Dokumentenliste). Bei Berechtigung: **Dreipunkt-Menü** (Name bearbeiten, Löschen mit Bestätigung; PATCH/DELETE an bestehende Routen).

### 4. Company Page: Tabs und Overview-Cards

[x] **Tabs:** **Overview** (Standard) | **Prozesse** | **Projekte** | **Dokumente**. Overview = Einstieg; die anderen Tabs je ein volles Card-Grid (bzw. Dokumente-Tab: Liste/Tabelle, Ausbau in Abschnitt 14).
[x] **Overview-Tab – Inhalt (Vorschau + Recent):**
[x] **„Zuletzt angesehene Inhalte“** – gemischt Kontexte und Dokumente, klickbar → Detail; Persistenz in User-Preferences als `recentItemsByScope` pro Scope. **UI:** rechte Spalte `ScopeRecentColumn` in `PageWithTabs` (md+, optional einklappbar `scopeRecentPanelOpen`), nicht als erste Karte im Overview-Grid; `recentViewMoreHref` z. B. `/catalog` auf der Company-Page.
[x] **Vorschau-Karte Prozesse** (`ScopeCard`) – bis zu fünf neueste Prozesse (klickbar → Kontext-Detail); **„View more“** → Tab **Prozesse** (`CompanyPage` / analog Department, Team).
[x] **Vorschau-Karte Projekte** – bis zu fünf neueste Projekte; **„View more“** → Tab **Projekte**.
[x] **Vorschau-Karte Dokumente** – bis zu fünf neueste Dokumente; **„View more“** → Tab **Dokumente** (voller Tab inkl. Pagination, vgl. §14). Zusätzlich **DraftsCard** im Overview-Grid (Company mit Schreibrechten).
[x] Leere Zustände in den Karten berücksichtigen („Noch keine Prozesse“ etc.; ggf. CTA oder „View more“ führt in den Tab mit „New context“).

### 5. Backend-Hinweis

[x] **Filter Company-Kontexte:** Aktuell liefern `GET /processes` und `GET /projects` alle lesbaren Kontexte. Für Company Page: entweder **clientseitig** nach `owner.companyId === companyId` filtern (einfach, bei wenig Daten ausreichend) oder **serverseitig** erweitern (z. B. Query-Parameter `?companyId=...`), um nur Company-Kontexte zu laden und Pagination sinnvoll zu machen.
[x] **„Zuletzt angesehene Inhalte“:** Dafür Backend-Persistenz vorsehen (z. B. in User-Preferences oder eigener Endpoint), damit die Liste geräteübergreifend und sessionübergreifend funktioniert.

---

## 11. Department- und Team-Pages (analog zu Company Page)

Department-Seite (`/department/:departmentId`) und Team-Seite (`/team/:teamId`) mit derselben Struktur und denselben Bausteinen wie die Company Page (§10): Tabs (Overview | Prozesse | Projekte | Dokumente), Card-Grids, „Zuletzt angesehene“, New-Context-Modal (Owner = Department bzw. Team), Kontext-Karten mit Bearbeiten/Löschen bei Berechtigung. Nur Scope und API-Filter (departmentId/teamId) sowie Berechtigungen (Department Lead / Team Lead) unterscheiden sich.

[x] **Department Page:** Route, Tabs, Overview mit Recent-Items-Karte + neueste Prozesse/Projekte/Dokumente (gefiltert nach Owner = diese Abteilung); Prozesse-/Projekte-Tabs mit ContextGrid; „New context“ (Owner = Department); Berechtigung: Department Lead, Company Lead, Admin.
[x] **Team Page:** Route, Tabs, Overview analog; Prozesse/Projekte mit Owner = dieses Team; „New context“ (Owner = Team); Berechtigung: Team Lead, Department Lead, Company Lead, Admin.
[x] Wiederverwendung der Kontext-Komponenten aus §10 (ContextCard, ContextGrid, NewContextModal); Backend: ggf. Query-Parameter `?departmentId=...` / `?teamId=...` für Prozesse/Projekte, falls noch nicht vorhanden.

---

## 11a. Personal- und Shared-Pages (analog zu Company/Department/Team)

Personal-Seite (`/personal`) und Shared-Seite (`/shared`) mit derselben Struktur wie Company-, Department- und Team-Pages: Tabs (Overview | …), Overview mit RecentItemsCard und Vorschau-Karten, „View more“ in die Tabs. Scope nutzerbezogen (eigene Prozesse/Projekte/Dokumente bzw. per Grant geteilte Dokumente).

[x] **Recent-Scope:** `RecentScope` um `personal` und `shared` erweitert; `scopeToKey` und Nutzung in Personal/Shared-Seiten.
[x] **Personal Page:** Route `/personal`, Tabs (Overview | Processes | Projects | Documents), Overview mit RecentItemsCard (Scope personal) + Karten Prozesse/Projekte/Dokumente mit „View more“; Tab Processes/Projects = ContextGrid mit Prozessen/Projekten mit Owner = Nutzer (GET `/processes?ownerUserId=me`, GET `/projects?ownerUserId=me`), „Create“ öffnet NewContextModal mit Scope personal; Tab Documents = Dokumente aus eigenen Prozessen/Projekten (GET `/me/personal-documents`). Keine UserSpaces; persönliche Kontexte = Prozesse/Projekte mit Owner.ownerUserId.
[x] **Shared Page:** Route `/shared`, Tabs (Overview | Documents), Overview mit RecentItemsCard (Scope shared) + Vorschau geteilter Dokumente; Backend GET `/me/shared-documents` (Dokumente mit Grant-Zugriff für den Nutzer).
[x] **Einheitliche Bausteine:** RecentItemsCard, ContextGrid, NewContextModal (Scope personal), gleiche Tab-Struktur und leere Zustände wie bei Company/Department/Team.

---

## 12. Catalog (Dokumenten-Tabelle)

[x] **Backend:** `GET /api/v1/documents` (Catalog-Liste) mit Pagination und Filtern (contextType, owner, tagIds, search); nur Dokumente zurückgeben, die der Nutzer lesen darf (canRead: Kontext + Grants); Response inkl. Kontext-Typ, Kontext-Name, Owner-Anzeige, Tags.
[x] **Frontend:** Catalog-Seite mit Filter-Panel (Context type, Owner, Tags), Titelsuche, Tabelle (Title, Context, Context type, Owner, Tags, Updated, Actions), Pagination; Filter in URL-Query; alle Texte auf Englisch.
[x] **Catalog-Sortierung nach Kontext/Owner (DB):** Context und Owner haben gecachte Anzeigenamen (Context: displayName, contextType, ownerDisplayName; Owner: displayName). Sortierung nach contextName, contextType, ownerDisplay erfolgt in der DB (orderBy auf Context), kein 2000er-Limit mehr. Sync bei Create/Update von Process, Project, Subcontext sowie bei Namensänderung Company/Department/Team/User (siehe [Prisma-Schema-Entwurf §2](Prisma-Schema-Entwurf.md#2-kontexte), [Pseudocode Datenmodell Kontext](../platform/datenmodell/Pseudocode%20Datenmodell.md)).

---

## 13. Dashboard / Home

Startseite ohne Quick Links (redundant zur Sidebar). **Suchleiste** auf dem Dashboard für **Normal-Suche** (Quick-Search-Modal → FTS/Catalog) ist umgesetzt. **KI-Schalter** (Normal/KI) bleibt optional in **§21**. Drei Blöcke (weitere Blöcke siehe §15e, §17):

[x] **Pinned:** Nur **Dokumente** (Flag am Document: „in Liste von Scopes gepinnt“). Team Lead kann für sein Team anpinnen, Department Lead für sein Department, Company Lead für alle (es gibt nur eine Company). Nur Scope-Lead (und Admin) darf anpinnen; Anzeige für Nutzer: Pins aus eigenem Team, eigenem Department, Company-weit. Datenmodell: DocumentPinnedInScope (documentId, scopeType, scopeId, order, pinnedById); siehe [Prisma-Schema-Entwurf §7 (Pinned)](Prisma-Schema-Entwurf.md#7-pinned-geplant); danach API und Dashboard-Block.
[x] **Recent:** Zuletzt angesehene Einträge (aus bestehender recentItemsByScope, auf dem Dashboard aggregiert, z. B. Top 10 über alle Scopes).
[x] **Latest:** Neueste Dokumente, die der Nutzer lesen darf (z. B. Slice aus Catalog, sortiert nach updatedAt, Limit 10).

---

## 14. Dokumente in der UI

[x] **Catalog:** Listen/Filter nach Kontext, Kontexttyp, Owner, Tags (umgesetzt in §13).
[x] **Tag-Verwaltung:** Tags anzeigen, Tags anlegen (POST `/api/v1/tags`), Tags löschen (DELETE `/api/v1/tags/:tagId`), Dokumenten zuweisen, nach Tags filtern (Backend + Frontend: Multi-Select, „Create tag“, „Manage tags“).
[x] **Tags mit Scope:** Tags sind an einen Scope (Owner) gebunden (`Tag.ownerId`); Eindeutigkeit pro Scope `(ownerId, name)`. GET/POST/DELETE Tags erfordern Scope (Query `ownerId` oder `contextId`; ohne Parameter → 400). Dokumente dürfen nur Tags desselben Kontext-Scopes zugewiesen bekommen (Validierung bei POST/PATCH Document). Rechte: Lesen = canReadScopeForOwner; Anlegen/Löschen = canCreateTagForOwner (Scope-Lead/Admin, bei Personal der Nutzer selbst).
[x] **Markdown-Editor + Vorschau:** Markdown-Quelltext (Textarea), Vorschau per react-markdown (Tab „Preview“); Darstellung konsistent mit Lese-Ansicht.
[x] **Anzeige mit Rechte-Checks:** GET `/documents/:id` liefert `canWrite`/`canDelete`; GET Process/Project liefert `canWriteContext`; UI zeigt Edit/Delete bzw. „New document“ nur bei Berechtigung.
[x] **Anlegen/Bearbeiten/Löschen von Dokumenten in Kontexten:** Dokumentenliste auf Kontext-Detail-Seite (Process/Project), „New document“-Modal, DocumentPage mit Lese-/Bearbeiten-Modus, PATCH/DELETE; Recent Items beim Öffnen eines Dokuments. Create-Button als Menu (Process | Project | Document); bei Document nur Kontext + Titel im Modal, **kein Redirect** nach Anlegen – Nutzer bleibt auf der Seite.
[x] **Subcontext-UI (Unterkontexte unter Projekten):** Auf Projekt-Detailseite Block „Unterkontexte“ mit Liste und „Unterkontext anlegen“; Subcontext-Detailseite (`/subcontexts/:subcontextId`) mit Dokumentenliste, „Neues Dokument“, Bearbeiten/Löschen; GET Subcontext liefert `canWriteContext`; Breadcrumb/Link „Unterkontext von [Projektname]“.
[x] **Kontextfreie Drafts (Teil 2):** Document.contextId optional (Prisma + Migration). Rechte: bei contextId null nur Creator (createdById) und Grants (canRead/canWrite); getWritableCatalogScope um documentIdsFromCreator erweitern; POST /documents mit optionalem contextId (ohne = Draft ohne Kontext); PATCH contextId (null → Kontext) erlauben; Publish nur mit Kontext. Frontend: „Draft ohne Kontext“ im Create-Menü (Personal), Anzeige in Drafts-Tab/Card, DocumentPage „Assign to context“, Catalog.
[x] **Trash & Archive (Personal & Organization):** Trash-Tab (soft-deleted documents/drafts), GET `/me/trash`, POST `/documents/:id/restore`; Archive-Tab (archivierte Dokumente), Document.archivedAt (Prisma + Migration), GET `/me/archive`, PATCH document.archivedAt; Catalog/Listen filtern archivierte Dokumente aus; Tabs auf Personal-, Company-, Department- und Team-Seite (Sichtbarkeit: Admin oder Scope-Lead, Rechte nach unten).
[x] **Kontext Trash & Archive (Variante B):** Schema: Process/Project mit `archivedAt`; Soft-Delete (DELETE Kontext → deletedAt + Kaskade auf Dokumente, Pins entfernen); POST restore/unarchive für Kontexte; POST documents/restore bei trashed Kontext = Abkoppeln (contextId null). GET /me/trash und /me/archive inkl. Kontexte (items mit type document|process|project, displayTitle, Filter/Sort), Scopes **personal**, **company**, **department**, **team**. **Rechte §4b:** Schreib-Tabs (Drafts, Trash, Archive) nur für Admin oder Scope-Lead (Company/Department/Team Lead; Rechte gelten nach unten); GET /me/drafts – ausstehende Reviews nur für Schreiber (writable); bei fehlendem Zugriff leere Liste (kein 403). Frontend: Trash/Archive als Tabelle (Filter Typ, Sort, Restore/Unarchive pro Zeile); „Move to trash“ und „Archive“ an Kontexten; Archive/Unarchive auf DocumentPage. Einheitliche Regel: `canShowWriteTabs(me, canManage)` (lib/canShowWriteTabs.ts).

---

## 15. Versionierung & Ausblick

**Versionierung für veröffentlichte Dokumente:** Jede neue **Published**-Ausbaustufe entspricht einem **Snapshot** (`DocumentVersion`). Unveröffentlichte Dokumente (`publishedAt == null`) erzeugen keine öffentliche Versionskette.

**Zielbild Bearbeitung:** Autoren arbeiten mit **Suggestions**, der **Scope-Lead** mit **Lead-Draft** und **Publish** – verbindlich beschrieben in [Edit-System: Blocks, Suggestions, Lead-Draft](Edit-System-Blocks-Suggestions-Lead-Draft.md), ergänzend [Versionierung als Snapshots + Deltas](../platform/versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md) und [Prisma-Schema-Entwurf §8](Prisma-Schema-Entwurf.md#8-versionierung-bearbeitung).

Die folgenden Unterabschnitte **15a–15e** fassen den **bereits umgesetzten** Grundstock (Publish, Versionen, Sichtbarkeit, Übersichten) zusammen und markieren, wo das Edit-System-Plan die nächste Ausbaustufe definiert.

### 15a. Datenmodell, Rechte, Sichtbarkeit (Draft/Published)

Detaillierter Plan (Meilenstein): [Plan-15a-Datenmodell-Rechte-Sichtbarkeit](Plan-15a-Datenmodell-Rechte-Sichtbarkeit.md).

[x] **Prisma-Schema:** Document um `currentPublishedVersionId` (→ DocumentVersion) ergänzt; **DocumentVersion** angelegt; Migration ausgeführt. Übergangshilfen im Schema können bis zur Edit-System-Migration noch existieren – Zielmodell §8.
[x] **Rechte:** `canPublishDocument(prisma, userId, documentId)` (über `canWriteContext`); Export und Tests. Freigabe neuer Versionen: [Rechtesystem 6b](../platform/datenmodell/Rechtesystem.md#6b-freigabe-publish).
[x] **Sichtbarkeit Draft:** Dokumente mit `publishedAt == null` nur für Nutzer mit `canWrite` (oder isAdmin) sichtbar. **Catalog** und **GET `/documents/:id`** sowie **Listen in Kontexten** angepasst. Bei GET document (Draft, Nutzer ohne canWrite): **403 Forbidden**. Response GET document um `canPublish` ergänzt.
[x] **Dokument-Status:** `publishedAt: DateTime?` (null = Draft). [Prisma-Schema-Entwurf §3](Prisma-Schema-Entwurf.md#3-dokumente).

**Ergebnis 15a:** Unveröffentlichte Dokumente nur für Schreiber/Lead sichtbar; Leser sehen nur Veröffentlichtes; Basis für Publish und späteres Suggestion-Modell.

### 15b. Publish & Versionen (Snapshot, History, Diff)

[x] **Snapshots/Full-Version:** Snapshot mit vollem Inhalt bei **Publish** (jeweils neue Versionsnummer). Optional: Policy „nur letzte N Versionen“.
[x] **API:** POST `/documents/:id/publish` (Scope-Lead), GET `/documents/:id/versions`, GET `/documents/:id/versions/:versionId`.
[x] **DocumentPage:** Badge Draft/Published, Button **„Publish“** (wenn canPublish), **History** (Versionsliste), **Versionsvergleich** (zwei Versionen, Diff rot/grün, z. B. diff-match-patch).

**Ergebnis 15b:** Erstes Veröffentlichen erzeugt Version 1; Nutzer können Versionen ansehen und zwei Versionen vergleichen.

### 15c. Bearbeitung veröffentlichter Inhalte (Ziel: Suggestions & Lead-Draft)

[x] **Ist (Übergang):** Bearbeitung und Freigabe-Pfade im Code bis zur vollständigen Umstellung; fachliches Zielbild ausschließlich im [Edit-System-Plan](Edit-System-Blocks-Suggestions-Lead-Draft.md) (kein paralleles Volltext-Modell mehr als Produktkonzept).

**Ergebnis 15c (Ziel):** Autoren sehen Published und (optional) Lead-Draft-Stand; sie erstellen **Suggestions**; Lead wendet zu, **veröffentlicht** → neuer Snapshot.

**v0.2.0 (umgesetzt):** Reviews-Inbox (`/reviews`), Autor-UX „Suggest change“, Block schema v1 (Inline-Marks), Typst-PDF, SSE statt Dauer-Polling – siehe [Edit-System-Blocks-PR-Epics.md](Edit-System-Blocks-PR-Epics.md) Post-EPIC Polish.

**Scope Author + Read-Grants (umgesetzt):** `TeamAuthor` / `DepartmentAuthor` statt Document Write-Grants; Authors-Panel auf Team-/Department-Page; Document Access Tab nur Read-Grants (Cross-Scope) + Hinweis; PDF-Export-Toast persistent bis Download; Typst-Dev-Doku/`make worker`.

### 15d. Konflikte & „auf neuesten Stand“

Im **Zielmodell** lösen sich Konflikte aus **überlappenden Suggestions** (fachliche Entscheidung durch Lead), nicht durch automatisches Zusammenführen paralleler Volltext-Entwürfe – siehe Edit-System-Plan Abschnitt zu Überlappung und Lead-Entscheid.

**Ergebnis 15d:** Kein Pflicht-Schritt „Volltext manuell zusammenführen“ für Autoren im Soll-Produkt.

### 15e. Drafts-Listen-UI (Tab, Card, Dashboard)

[x] **API:** GET `/api/v1/me/drafts` (Query: scope, companyId, departmentId, teamId; optional scope=shared). Response liefert unveröffentlichte Dokumente; Legacy-Review-PR-Einträge entfallen seit EPIC-9.
[x] **Drafts-Tab:** Auf Scope-Pages Tab „Drafts“ mit unveröffentlichten Dokumenten (ohne Legacy-PR-Liste).
[x] **Drafts-Card:** Auf Overview-Seiten Card „Drafts“ (z. B. neueste 5 unveröffentlichte Dokumente).
[x] **Dashboard-Block:** Startseite mit Draft-Übersicht; alte Pending-Review-PR-Anzeige ist abgelöst.

**Ergebnis 15e:** Zentrale Übersicht über unveröffentlichte Dokumente; Legacy-Review-PRs wurden in EPIC-9 durch Suggestions/Lead-Draft abgelöst.

**Nächste große Ausbaustufe:** Datenmodell und APIs für **Blocks**, **Lead-Draft**, **Suggestions** gemäß [Edit-System-Plan](Edit-System-Blocks-Suggestions-Lead-Draft.md); bestehende Hilfsrouten schrittweise zurückfahren oder auf das Zielmodell mappen.

---

## 16. Objekt-Speicher (MinIO)

Basis für PDF-Export-Downloads (§17); Dokumentinhalte liegen im Edit-System als Block-JSON (Lead-Draft/Versionen), Binärdateien in MinIO.

[x] S3-Client (MinIO) im Backend anbinden
[x] Upload/Download für Anhänge, Bilder und Exporte (z. B. PDF aus §17) in Dokumenten
[x] Speicherorte in DB referenzieren (z. B. `Document.pdfUrl` für Export-PDFs; vgl. §17); Berechtigungen vor Download prüfen
[x] **Speicherübersicht (Assets aus MinIO):** Nutzung/Speicher pro Nutzer sichtbar – **Nutzer:** nur eigene Nutzung; **Team-Lead:** Nutzung aller Team-Mitglieder; **Department-Lead:** Nutzung aller Members der Abteilung (alle Teams der Abteilung); **Company-Lead / Admin:** Nutzung aller Abteilungen.
[x] **Speicherübersicht im Frontend:** Settings-Tab „Storage“ mit Scope-Auswahl (Personal, Team/Department/Company für Leads/Admin), Anzeige von genutzten Bytes und Anhänge-Anzahl; bei Lead-Scope Tabelle „pro Nutzer“.

---

## 17. Async Jobs

[x] **Abgeschlossen:** `pg-boss` + Worker, zentrale Job-Registry mit Zod-Payloads, PDF-Export (`documents.export.pdf`), inkrementeller/scheduler-gesteuerter Suchindex (`search.reindex.*`), asynchrone Benachrichtigungen (`notifications.send`), Admin-Jobs/Scheduler-UI, Polling mit Hintergrund-Drosselung, Health/Alerts, Runbook ([Runbook-Async-Jobs-Betrieb](Runbook-Async-Jobs-Betrieb.md)), Batch-Retry (`POST /api/v1/admin/jobs/retry-failed`), Admin-Audit (`/api/v1/admin/jobs/audit`), bei Queue-Ausfall `503` + `Retry-After`, Lasttest-Skript `pnpm --filter backend run loadtest:jobs`. Verträge: [Plan-17a-Async-Jobs-Architektur-und-Vertraege](Plan-17a-Async-Jobs-Architektur-und-Vertraege.md).

---

## 18. Volltextsuche & Suchseite

[x] **PostgreSQL Full-Text-Search:** Produktiv über den Suchindex `document_search_index` und Roh-SQL im Backend (`documentSearchService`); kein separates MVP mit externer Engine (Meilisearch/Typesense).
[x] **Such-API:** `GET /api/v1/search/documents` mit Query `q`, Pagination und optionalen Scope-Filtern; Nutzung im **Katalog** (Relevanzsortierung) und im **Dashboard-Quick-Search-Modal** auf der Startseite.
[x] **Dashboard (Normal):** Nach Submit der Startseiten-Suchleiste öffnet ein Quick-Search-Modal; Treffer über dieselbe Such-API wie der Katalog.

[x] **§18 Normal-Suche abgeschlossen** (FTS, API, Catalog, Dashboard). Kein separates Sidebar-Suchfeld – redundant zu Catalog-NavLink und Dashboard-Suche. Offen bleibt nur der **KI-Schalter** (optional **§21**).

---

## 19. Deployment & Doku

**Ziel (Intranet-Self-hosted):** Nach `curl | sudo bash` läuft DocsOps im **Prod-Stack** unter **Port 80** (HTTPS optional später). Dev: `docker compose` + Override → Port 5000.

**Status:** **Production-Install v2** – Release-Bundle + GHCR (`docker compose pull`), kein Monorepo auf der VM, kein lokaler Build.

### Erledigt (Production-Install v2)

[x] **Release-Pipeline:** Git-Tag `v*` → CI: Images nach **GHCR** (`ghcr.io/bjkawecki/docsops-{app,worker,frontend}:vX.Y.Z`) + Release-Asset `docsops-vX.Y.Z.tar.gz` (Workflow `.github/workflows/release.yml`).
[x] **Compose & Env:** `docker-compose.prod.yml` mit `image:` + Tag aus `/etc/docsops/docsops.env` (`DOCSOPS_VERSION`, `DOCSOPS_IMAGE_PREFIX`); `build:` nur Dev (`docker-compose.override.yml`).
[x] **Install:** Bundle statt `git clone`; Release-URL `curl …/releases/download/vX.Y.Z/install.sh`; `pull` + `up -d`; `main` abgewiesen; Doku README + [install.md](../install.md).
[x] **Update:** `scripts/update.sh` – Bundle tauschen + `pull` + `up -d` + Rollback-Hinweis in install.md. Admin-UI: **§26** (offen).
[x] **CI Install-Test:** Release-Workflow – Bundle-Install mit `pull` + Health-Check (Port 8080).

**Erstes Release:** Git-Tag `v0.1.0` manuell setzen, wenn Images auf GHCR veröffentlicht werden sollen.

**Später (optional):** HTTPS/443 (Caddy ACME / `tls internal`); private GHCR + PAT; Air-gap (`docker save`/`load`); eigenes CDN; CI Frontend-/E2E-Tests.

### Demo & öffentliche Präsenz (getrennt von Self-hosted)

[ ] **Demo online** – eigene Instanz, `DEMO_MODE`, Reset: [Plan-Demo-Oeffentlich](Plan-Demo-Oeffentlich.md)
[ ] **Landing + i18n** – statische DE-Landing (`docsops.de`); App EN/DE optional; Release Notes **§24**

**Betrieb (Releases, Backup, Update, Migration):** [Plan-Betrieb-Releases-Backup-Update](Plan-Betrieb-Releases-Backup-Update.md); Umsetzung **§24–§27**. **Managed Hosting (später):** [Plan-Managed-Hosting](Plan-Managed-Hosting.md).

---

## 20. Layout- & UX-Ergänzungen (Phase 2)

[ ] **Optionale öffentliche Seiten (Demo):** Siehe **§19** (Demo & Landing) und [Plan-Demo-Oeffentlich](Plan-Demo-Oeffentlich.md).
[x] **Pin Sidebar:** Sidebar ein-/ausklappbar (Desktop Mini-Rail ~72px oder expanded 260px), Option in Settings („Pin“); Mobile Overlay-Drawer mit Burger.
[x] **Notifications (Inbox & Navigation):** Erledigt in **§23** (Route `/notifications`, Sidebar, Unread-Zähler). Dieser §20-Punkt diente als Sammelwunsch; Details und weitere Ausbauten nur noch in **§23** pflegen.
[x] **Notifications-UI in Settings:** Tab **Notifications** mit In-App-/E-Mail-Schaltern pro Kategorie (u. a. `documentChanges`, dokumentbezogene Review-Kategorien laut Backend-Schema, `reminders`) und Anbindung an `PATCH /me/preferences` sowie Dispatch (vgl. §8, §17, **§23**).
[x] **Responsiv:** Sidebar auf kleinen Viewports (Overlay/Hamburger) umgesetzt; Desktop Mini-Rail + Toggle.
[x] **Icons & A11y:** Tabler-Icons in Sidebar; Skip-Link, Nav-Landmarks, Collapsible-/Account-ARIA, PageWithTabs `aria-label`, Notifications-Kategorien-Nav (Scope: Shell + Tabs + Notifications, kein app-weiter Audit).

---

## 21. Optional: KI-Assistent (Dokumenten-Frage)

**Ziel:** Auf der Startseite (oder eigener Block) eine **KI-Suche**, mit der Nutzer ihre **zugreifbaren Dokumente** in natürlicher Sprache befragen können (z. B. „Welche Prozesse gibt es für Onboarding?“). Antworten basieren nur auf Dokumenten, auf die der Nutzer Leserecht hat. **Jede Antwort enthält Quellen:** Links zu den Dokumenten, aus denen die Antwort abgeleitet wurde. **Sichere DB-Nutzung:** Die KI darf nur über definierte Wege auf Daten zugreifen – siehe [KI – Datenbank sicher durchsuchen](../platform/KI-Datenbank-sicher-durchsuchen.md) (RAG, optional Agent mit nutzerabhängigen Tools/MCP; nur Dokument-Fragen erlauben; semantische/Volltextsuche für natürlichsprachige Fragen).

[ ] **Abhängigkeiten:** Volltext- oder Vektorsuche über Dokumentinhalte (vgl. §18); Rechtefilter (lesbare Kontexte + Grant-Dokumente, analog `getReadableCatalogScope`) – nur diese Dokumente dürfen in die KI-Anfrage.
[ ] **Backend:** Endpoint (z. B. `POST /api/v1/ask`): Frage entgegennehmen, lesbare Dokument-IDs für den Nutzer ermitteln, **Retrieval** (relevante Passagen nur aus diesen Dokumenten; pro Passage Dokument-ID und ggf. Titel mitführen), **RAG**: Prompt aus Treffern bauen, Aufruf einer LLM-API; Response enthält **Antworttext** und **Quellen** (z. B. `sources: [{ documentId, title, excerpt? }]`), damit das Frontend Links zu `/documents/:id` anzeigen kann.
[ ] **Sicherheit:** Rechteprüfung ausschließlich im Backend; keine Dokumentinhalte an die KI senden, auf die der Nutzer keinen Zugriff hat. Keine Rechte-Logik im Frontend. **Kein direkter DB-Zugriff durch die KI** – nur über Backend-APIs und feste Retrieval-Pfade (vgl. Plattform-Doku oben).
[ ] **Startseite / Suchseite:** Suchleiste mit Schalter Normal/KI (§13); KI-Modus führt zur **Suchseite mit KI-Chat** (§18): Konversationsverlauf, Antwort + Quellen, Fortsetzung des Dialogs. Optional: Rate-Limits, Caching, Audit-Log.
[ ] **Chat-History & Token pro User:** Backend speichert Chat-Verläufe pro Nutzer (für Suchseite und Admin-Übersicht); Token-Verbrauch pro Anfrage erfassen und pro User aggregieren – Anzeige in Admin (§9: Chat-History pro User, Token-Verbrauch pro User).
[ ] **Kosten/Betrieb:** LLM-API-Kosten und Latenz pro Anfrage; Konfiguration über Umgebungsvariablen (API-Key, Endpoint); **Admin: KI-Settings** (§9) für Feature-Flag und Konfiguration.
[ ] **Admin: KI-Settings** – Konfiguration des KI-Assistenten (vgl. §21): API-Endpoint, Modell, Feature-Flag ein/aus, ggf. globale Rate-Limits; nur für Admins; Persistenz in Config/DB.
[ ] **Admin: Chat-History pro User** – Übersicht der KI-Chat-Verläufe pro Nutzer (z. B. Liste der Sitzungen/Threads, letzte Frage, Datum); nur für Admins; dient Support und Audit; Backend speichert Chat-Verläufe pro User (vgl. §21).
[ ] **Admin: Token-Verbrauch pro User** – Anzeige des verbrauchten Token-Volumens (Input/Output) pro Nutzer (aggregiert oder pro Zeitraum); nur für Admins; Backend trackt Token-Nutzung je Anfrage (vgl. §21).
[ ] **Suchleiste mit Schalter (Normal/KI-Modus):** Einheitliches Suchfeld auf dem Dashboard mit Schalter oder Tabs „Normal“ / „KI“. Normal: Eingabe führt zu klassischer Suche (Catalog mit Treffern). KI: Eingabe öffnet bzw. fokussiert Suchseite im KI-Chat-Modus (vgl. §18).
[ ] **Suchseite:** Dedizierte Route (z. B. `/search`) mit einheitlicher Such-UI; Anbindung an Volltextsuche (Filter, Tags). Bei Aufruf aus dem Dashboard im **KI-Modus** (vgl. §13): gleiche Suchseite, aber **KI-Chat-Ansicht** – Nutzer sieht Konversation (Frage → Antwort + Quellen), Fortsetzung des Dialogs möglich. Normal-Modus: klassische Trefferliste (Dokumente, Kontexte). Eine Suchseite, zwei Darstellungsmodi (Listen- vs. Chat-UI) je nach Herkunft oder expliziter Umschaltung.

**Ergebnis:** Nutzer können (Dashboard/Suchseite) im KI-Modus Fragen in natürlicher Sprache stellen und erhalten eine Antwort mit **Links zu den Quell-Dokumenten**, ausschließlich aus Dokumenten, die sie lesen dürfen. Admin hat Übersicht über KI-Settings, Chat-History und Token-Verbrauch pro User.

---

## 22. Optional: Kommentar-Sektion pro Dokument

**Ziel:** Diskussion und Feedback direkt am Dokument. Kommentar-Rechte = Leserechte: Jeder mit Leserecht darf Kommentare lesen, anlegen sowie eigene bearbeiten/löschen; Scope-Lead/Admin dürfen beliebige Kommentare löschen (Moderation). Konzept: [Pseudocode §3b](../platform/datenmodell/Pseudocode%20Datenmodell.md#3b-kommentar-sektion-geplant), [Rechtesystem §6c](../platform/datenmodell/Rechtesystem.md#6c-kommentare-geplant), [Prisma-Schema-Entwurf §9](Prisma-Schema-Entwurf.md#9-kommentar-sektion-geplant).

[x] **Datenmodell:** Tabelle **DocumentComment** (id, documentId, authorId, text, parentId?, createdAt, updatedAt?); Indizes documentId, parentId. Migration.
[x] **Rechte:** canReadComment / canCreateComment / canEditOwnComment / canDeleteOwnComment = canRead(documentId); canDeleteAnyComment = canWriteContext(contextId) oder isAdmin.
[x] **Backend:** CRUD-API für Kommentare (z. B. GET/POST `/documents/:documentId/comments`, PATCH/DELETE `/documents/:documentId/comments/:commentId`); Pagination optional; Rechteprüfung bei jedem Zugriff.
[x] **Frontend:** Auf der Dokument-Detailseite eine Kommentar-Sektion (unter dem Inhalt oder Sidebar): Liste, Formular zum Anlegen, Bearbeiten/Löschen eigener Kommentare; bei canDeleteAnyComment Löschen-Button für alle. Optional: Threads (Antworten via parentId).
[x] **Später (optional):** Inline-/Absatz-Kommentare (Anker auf Block/Zeile); Benachrichtigungen bei neuen Kommentaren (enge Policy + Mentions, siehe §23 Dispatch).

---

## 23. Notifications (In-App-Kanal, Inbox, Ausbau)

**Kurz:** In-App zuerst; **Info** und **Aufgaben** gelten als „Notifications“; ein **erwartbarer Ort** (Inbox `/notifications`) plus **sichtbarer Einstieg** in der Sidebar. Policy und Todos werden **in dieser Liste** gepflegt (kein separates Plan-23a-Dokument).

### Reihenfolge (Überblick)

1. Policy & Begriffe in §23 (Checkboxen unten).
2. Sidebar + Unread-Zähler (API existiert).
3. Dispatch / Empfänger im Code an Policy anbinden, schrittweise testen.
4. Inbox zweispaltig + API-Filter nach Typ/Kategorie.
5. Retention / Aggregation bei Bedarf (Retention + Coalescing + Hard-Cap umgesetzt; siehe **Wachstum** unten).
6. Admin-System-Meldungen, Zugriffs-/Rollen-Events, Kommentare (§22) nachziehen.
7. Live-Updates per SSE (**§23a**) – Badge/Wartungsbanner ohne Polling; Inbox-Liste bleibt Pull.

### Zielbild & Navigation

[x] **Zielbild:** In-App-Inbox; optional später Glocke in globaler Kopfzeile über dem Main.
[x] **Sidebar:** NavLink **Notifications** unter **Personal** (vor **Reviews**) + Unread-Zähler (`GET /me/notifications?unreadOnly=true…`); Profil-Menü-Eintrag **Notifications** ergänzend beibehalten.

### Begriffe & Annahmen (Policy – hier pflegen)

[x] **Sichtbar für Leser:** Dokument hat `publishedAt` und ist für Leser nicht nur als Draft für Schreiber verborgen.
[x] **Sichtbare Aktualisierung:** Änderung an **publizierter** Fassung bzw. für Leser relevante Metadaten – z. B. nach **Publish** oder anderem für Leser sichtbaren Schritt; **kein** Ping pro Autosave an Entwürfen an die Leser-Community.
[x] **Auslöser:** Nutzer, der die Aktion ausführt (z. B. Publish).
[x] **Annahmen:** „Scope“ = Kontext-/Owner-Bereich des Dokuments; **Leser** = `canRead` inkl. Grants; **Freigabe** neuer veröffentlichter Versionen = Scope-Lead bzw. Regeln im [Rechtesystem](../platform/datenmodell/Rechtesystem.md).

### Dispatch / In-App-Empfänger (Code an Policy anbinden)

[x] **Publish (erste Sichtbarkeit):** In-App an alle **Leser** (`canRead`), Trigger **nach erster Veröffentlichung**; optional Auslöser ausschließen; **kein** Breiten-Ping bei Draft ohne Publish.
[x] **Update (publiziert):** In-App an **Leser** bei **sichtbarer Aktualisierung**; **eine** einheitliche Backend-Regel; kein Spam bei reinem Entwurfs-Speichern.
[x] **Review / ausstehende Freigabe (falls im Code noch alte Event-Typen):** In-App an **Scope-Lead** bzw. berechtigte Freigabe-Rollen; Zielbild Suggestions siehe [Edit-System-Plan](Edit-System-Blocks-Suggestions-Lead-Draft.md).
[x] **Review abgeschlossen (falls im Code noch alte Event-Typen):** In-App an **beteiligte Autoren**; Event-Typen und Zielgruppe mit Zielmodell abstimmen.
[x] **Archiviert / wiederhergestellt / Trash:** In-App an gewählte Zielgruppe (Leser+Schreiber oder enger laut Produktentscheid); Rechte beachten.
[x] **Grants am Dokument:** In-App an **betroffene** Nutzer nach persistierter Änderung (Policy: einzeln vs. gebündelt festlegen).
[x] **Rollen / Mitgliedschaft** (Team, Abteilung, Firma, Leads): In-App an Betroffene bei Zuweisungs-APIs; Kategorie **Org** in Inbox + Settings `orgChanges`.
[x] **Kommentare / Mentions:** enge Policy (Thread-Beteiligte + `@[userId]`-Mentions); kein Breiten-Ping an alle Leser; Mention-Candidates-API + UI.
[x] **System / Wartung:** Admin-Broadcast (`POST /admin/notifications/broadcast`, Audit-Tabelle, Event `admin-broadcast`); Admin-Tab **Broadcast**.

### Bewusst kein Leser-Ping

[x] **Draft ohne Publish:** kein Fluten aller Leser mit jedem Speichern.
[x] **Selbst-Aktion:** optional keine Notification an den Auslöser (z. B. eigener Publish) – bei Bedarf Produktentscheid nachziehen.

### Inbox-UI (`/notifications`)

[x] **Layout:** links Vorauswahl / Filter nach Typ (**All**, **Documents**, **Reviews**, **System**, **Org**, …); rechts Liste mit Pagination, Lesestatus, Link zur **Quelle** (Dokument, Kontext, Admin bei System).
[x] **Semantik:** Sidebar-Zähler = **ungelesene** In-App-Einträge; optional von **Reviews-Aufgaben**-Badge klar trennen (unterschiedliche Bedeutung).

### Wachstum, Settings, Abgleich

[x] **Retention:** alte Einträge nach **X Tagen** (Policy + Job/Cleanup). Umsetzung: Env `NOTIFICATION_RETENTION_DAYS` (Default 90, `0` = aus), Job `maintenance.cleanup` mit Task `user-notifications-retention` (`[notificationRetentionService.ts](../apps/backend/src/services/notificationRetentionService.ts)`); Worker muss den Job ausführen.
[x] **Coalescing:** mehrere `document-updated` für dasselbe Dokument + Nutzer im Zeitfenster → eine Zeile (Payload/`created_at` aktualisiert, wieder ungelesen). Env `NOTIFICATION_COALESCE_WINDOW_MINUTES` (Default 15, `0` = aus) in `[notificationDispatchService.ts](../apps/backend/src/services/notificationDispatchService.ts)`.
[x] **Pagination** in der UI (bereits üblich); **Hard cap** optional per Env `NOTIFICATION_HARD_CAP_PER_USER` (älteste Zeilen pro Nutzer, `0` = aus).
[x] **Settings / E-Mail:** wenige Kategorien statt Matrix pro Event-Typ (parallel §8, §17, §20) – UI `[SettingsNotificationsTab.tsx](../apps/frontend/src/pages/settings/SettingsNotificationsTab.tsx)`, Backend-Kategorien in `resolveCategory`; Kurztext zu Grant-/Lifecycle-Events ergänzt.
[x] **§20:** Punkte „Notifications (Inbox & Navigation)“ / Settings mit §23 konsolidieren, wenn Zielbild umgesetzt ist.

**Lieferung zum Browser:** Persistenz und Dispatch wie oben (Worker → PostgreSQL). Push zum Client (Sidebar-Badge, Banner) siehe **§23a** – dort kein Intervall-Polling als Standard.

---

## 23a. Live Events (SSE – Push zum Browser)

**Kurz:** Ein **Server-Sent-Events**-Kanal pro eingeloggter Session für zeitnahe UI-Updates. Ergänzt §23 (In-App-Inbox in der DB), ersetzt sie **nicht**. **Kein Redis** – Brücke Worker → API über **PostgreSQL `LISTEN`/`NOTIFY`** (Stack-konform: pg-boss, eine DB). **Polling nur Fallback** (Tab hidden, SSE aus, Reconnect-Backoff).

### Zielbild & Abgrenzung

[x] **Ein Stream:** `GET /api/v1/me/events` (SSE, Session-Cookie wie REST); ein Hook in der App-Shell hält die Verbindung.
[x] **Pull bleibt:** Inbox `/notifications` (Liste, Pagination, Filter) weiter per `GET /me/notifications`; SSE invalidiert nur Cache / Badge-Zähler.
[x] **Kein zweites Messaging-System:** Events sind **Signale** („unread count geändert“, „Wartung an/aus“), keine Duplikation der Inbox-Payloads auf dem Draht.
[x] **Worker schreibt, API pushed:** `notifications.send` → `dispatchNotificationEvent` (PostgreSQL) → danach `**pg_notify`** mit `userId`(n); API-Prozess(e) `**LISTEN**` und leiten an offene SSE-Clients weiter.
[x] **Mehrere API-Instanzen:** Jede Instanz `LISTEN` + eigene In-Memory-Registry offener Streams; kein Redis nötig.
[x] **Caddy/Proxy:\*\* SSE ohne Response-Buffering (Stream durchreichen).

### Event-Typen (v1 → Ausbau)

[x] `**notification.unread-changed`** – Invalidate-only; Sidebar + optional offene Inbox.
[x] `**maintenance.status-changed**`–`{ active, reason? }`; App-Shell-Banner (ersetzt §25-Follow-up „Maintenance-Broadcast“).
[x] **`document.collaboration-changed`\*\* – `{ documentId }`; Invalidate für Lead-Draft, Suggestions und Dokument-Detail (Near-Realtime für [Edit-System §5.4](Edit-System-Blocks-Suggestions-Lead-Draft.md#54-near-realtime)); Empfänger: Kollaborations-Audience bei Draft/Suggestions, alle Leser bei Publish.

### Backend (Komponenten)

[x] **SSE-Route** in Fastify (API-Prozess): Auth, Heartbeat/Keep-Alive, sauberes Schließen bei Logout.
[x] **Connection registry:** Map `userId → Set<SseReply>`; beim NOTIFY nur betroffene User; `**getStats()`** + `/ready`.
[x] **Notify-Hook** am Ende von `[notificationDispatchService.ts](../apps/backend/src/domains/notifications/services/notificationDispatchService.ts)` (pro betroffenem User nach INSERT/Coalesce).
[x] **Wartungsmodus:** `maintenance.status-changed` per NOTIFY an alle Clients bei Statuswechsel (Lock + Export ohne Lock).
[x] **Admin-Broadcast (§23):\*\* über `dispatchNotificationEvent` → NOTIFY (kein separater Hook).

### Frontend (Komponenten)

[x] `**useLiveEvents` / `EventSource`:** in App-Shell; Reconnect mit Exponential Backoff; Tab hidden → Verbindung schließen.
[x] **React Query:** bei `notification.unread-changed` → `invalidateQueries(['me','notifications',…])`; bei `maintenance.status-changed` → Maintenance-Query setzen.
[x] **Fallback:** Wenn SSE nach N Versuchen fehlschlägt → optional langsames Polling **nur\*\* für Unread-Count (Feature-Flag / Env); Standard bleibt SSE.

### Betrieb & Tests

[x] **Env (optional):** `LIVE_EVENTS_ENABLED` (Default an in Prod); `LIVE_EVENTS_FALLBACK_POLL_SECONDS` / `VITE_LIVE_EVENTS_FALLBACK_POLL_SECONDS` (0 = aus).
[x] **Tests:** Unit für NOTIFY-Payload, Registry, Maintenance-Dedupe; Route-Auth + `/ready`-Metriken.
[x] **Doku:** Env-Liste; §25 Maintenance-Broadcast → §23a.

### Reihenfolge (empfohlen)

1. SSE-Endpoint + Registry + Frontend-Hook (Echo/Heartbeat).
2. `notification.unread-changed` + Hook in `dispatchNotificationEvent`.
3. `maintenance.status-changed` (Banner + Admin; §25-Follow-up ablösen).
4. Admin-Broadcast aus §23 an NOTIFY anbinden.
5. [x] `document.collaboration-changed` (Edit-System Near-Realtime).

---

## 24. What's new (Release Notes)

**Ziel:** Release Notes zur installierten App – Route `/whats-new`, **nicht** unter `/help`. Plan: [Plan-Betrieb-Releases-Backup-Update](Plan-Betrieb-Releases-Backup-Update.md) §2. `**APP_VERSION`** hier und in **§26\*\* (Admin) gemeinsam nutzen.

[x] **Inhalt & Release-Prozess (v1):** `content/releases/manifest.json` + `content/releases/0.1.0.md`; Release-Ritual in [Plan-Betrieb-Releases-Backup-Update](Plan-Betrieb-Releases-Backup-Update.md) §1 (Git-Tag/GitHub Release: **§19**).
[x] **API:** `GET /api/v1/system/version` (`APP_VERSION` im Build); `GET /api/v1/releases`, `GET /api/v1/releases/:version`.
[x] **Frontend:** Route `/whats-new` (Markdown); Account-Menü – **What's new** als erster Eintrag; Badge via `lastSeenReleaseVersion` + PATCH `/me/preferences`. Kein „Installed“-Badge, keine Subline „You're on v…“ (Version für Admins: §26).

---

## 25. Backup & Restore (Betrieb)

**Ziel:** Operational Backup für Disaster Recovery – **wieder einspielbar** (PostgreSQL **und** MinIO in einem Archiv). Getrennt von Plattform-Export/Migration (§27). Plan: [Plan-Betrieb-Releases-Backup-Update](Plan-Betrieb-Releases-Backup-Update.md) §3–§4.

### Phase 1 – Backup v1 (Bundle, Ziele, Upload im selben Job)

[x] **Wartungsmodus:** Kurz Writes sperren während Backup; API liefert klare Meldung (503); nach Job wieder aufheben.
[x] **Bundle:** Ein Archiv pro Lauf (`tar.zst`) mit `manifest.json`, `postgres/dump.custom` (`pg_dump -Fc`), `minio/objects/`; Checksummen vor `succeeded`.
[x] **Job:** `maintenance.backup` (pg-boss, **Worker** – kein Sidecar); Worker-Image: `postgresql-client`, `zstd`, `tar`.
[x] **Ablauf im Job:** Wartungsmodus → Dump + MinIO-Export → Archiv → **Upload an Admin-Ziel** (falls konfiguriert) → Metadaten → Wartungsmodus aus.
[x] **Destinations (Admin):** CRUD für Backup-Ziele; Typen v1: `S3_COMPATIBLE`, `SSH` (SFTP); Credentials verschlüsselt (`BACKUP_ENCRYPTION_KEY`); SSRF-Schutz bei URLs.
[x] **Admin-API:** `GET /api/v1/admin/backups/status`, Settings, Destinations-CRUD; `POST/GET /api/v1/admin/backups`, `GET …/:id/download`; nur `requireAdmin`; Audit-Log.
[x] **Admin-UI:** `/admin/backup` → Status, Retention, Default-Destination, Destinations, „Create backup“, Historie (Started/Finished, externes Ziel inkl. Typ), Download (API-Proxy); Automatik nur im Backup-Tab, Cron im Scheduler; Tab pollt bei sichtbarem Fenster (schnell bei laufendem Job, sonst ~15 s).
[x] **Retention:** `BackupSettings.retentionCount` (UI); Env `BACKUP_RETENTION_COUNT` nur Install-Default; älteste Backups am Ziel und in Metadaten löschen.
[x] **Scheduler:** Cron-Feintuning im Scheduler-Tab (`maintenance.backup` → „Disaster recovery backup“); **Ein/Aus nur im Backup-Tab**; Scheduler-Zeile ausgegraut bis erstes Auto-Backup dort konfiguriert.
[x] **Benachrichtigungen:** In-App an alle Admins bei Erfolg/Fehler (`backup-succeeded` / `backup-failed`); Kategorie `system` in Inbox und Einstellungen. _(Webhook bewusst nicht in v1.)_
[x] **Doku/Runbook:** [Runbook-Backup-Restore.md](Runbook-Backup-Restore.md); `.env` nicht im Backup; Restore auf leerem Stack manuell testen.

### Phase 2 – Restore-UI & WebDAV

[x] **WebDAV-Ziel:** Admin-Typ `webdav`; Upload per HTTP `PUT` im selben Job nach Archiv-Fertigstellung.
[x] **Restore (DR):** Im Tab **Admin → Backup**: Archiv aus **Historie** (nur bei lokaler Kopie) oder **Upload**; Job `maintenance.restore` mit Wartungsmodus, `pg_restore` + MinIO-Import; **kein** Remote-Fetch vom externen Ziel. **Nicht** Plattform-Import (§27).
[x] **Maintenance-Broadcast:** **§23a** (`maintenance.status-changed` per SSE); `[useMaintenanceStatus.ts](../apps/frontend/src/hooks/useMaintenanceStatus.ts)` + SSE `setQueryData`.

---

## 26. Update & Version (Admin)

**Ziel:** Admins sehen installierte vs. verfügbare Version; kontrolliertes Update (Backup-Gate). Skript/Pipeline: **§19**; Version-API/Release Notes: **§24**. Plan: [Plan-Betrieb-Releases-Backup-Update](Plan-Betrieb-Releases-Backup-Update.md) §5.

**Abgrenzung §24:** Endnutzer lesen Release Notes **aus dem Image** (`/whats-new`, Menü-Badge = ungelesene Notes der **laufenden** Version). §26 = „gibt es ein **deploybares** Update?“ und Betrieb – **nur Admin**.

### Phase 1 – Update-Status & Admin-UI

[x] **Env & Doku:** `DOCSOPS_UPDATE_GITHUB_REPO` (`owner/repo`, optional) in [Env-und-Config](Env-und-Config.md); ohne Env kein externer Check.
[x] **API:** `GET /api/v1/admin/system/update-status` – `installedVersion`, `updateCheckEnabled`, `latestVersion`, `updateAvailable`, `releaseUrl`, `checkedAt`, `checkError`; GitHub Releases mit Cache.
[x] **API (optional):** `POST /api/v1/admin/system/check-updates` – Refresh; bei `latest > installed` In-App an alle Admins (`update-available`, Kategorie `system`).
[x] **Admin-UI:** Tab **`/admin/system`** – installiert vs. latest, „Update available“, Release-Link, Hinweis `scripts/update.sh` (**§19**), Backup-Gate → Link **§25**; Tab-Badge wenn Update verfügbar.
[x] **Notifications:** Formatter + Inbox-Link `/admin/system` für `update-available`.
[x] **Tests:** Admin-Route (401/403), Mock GitHub-Response, SemVer-Vergleich.

### Phase 1 – Polish (abgeschlossen)

[x] **Default-Repo:** Backend-Fallback `bjkawecki/docs-ops` wenn Env fehlt; Dev-Compose + `.env.example`.
[x] **Admin-Toggle:** `SystemSettings.updateCheckEnabled`; `GET/PATCH /admin/system/settings`.
[x] **UI:** Schlanke Status-Card; Modal „View update steps“ mit Backup-Gate; kein Env-/Shell-Text auf Hauptseite.
[x] **Sidebar:** Update-Badge neben `vX.Y.Z` für Admins (Link `/admin/system`).
[x] **Cache:** Default-TTL 24h; Frontend `staleTime` 30 Min.
[x] **Upcoming release preview:** `content/releases/{version}.md` vom GitHub-Tag; optional `## For operators` (in `/whats-new` gefiltert); Accordion im System-Tab.

### Phase 2 – Ein-Klick-Update (Updater-Sidecar)

[x] **Updater-Sidecar:** Image `docsops-updater`; interne API `POST /internal/apply`; Docker-Socket + `/opt/docsops`; Env `DOCSOPS_UPDATER_URL` / `DOCSOPS_UPDATER_TOKEN` (Install generiert Token).
[x] **Auto-Backup:** `POST /admin/updates/apply` → `maintenance.backup` (`pre_update`) → bei Erfolg `maintenance.apply-update`.
[x] **UpdateRun** + Wartungsmodus `reason: update`; Startup-Reconciliation; Notifications `update-succeeded` / `update-failed`.
[x] **Admin-UI:** „Apply update“ wenn `canApplyUpdate`; Fortschritt `backing_up` → `applying`; Stepper, Status-Seite (`/update-status.html`), SSH-Fallback im Modal wenn Sidecar fehlt.
[x] **Tests:** Apply-Route, Reconciliation; Doku Env-und-Config.

### Phase 3 – Host-Agent (Go)

Plan: [Plan-Host-Agent](Plan-Host-Agent.md). Ersetzt Sidecar + `updater-exec-update.sh` durch `docsops-agent` (systemd, Go-Binary auf dem Host).

[x] **Agent MVP (3a):** `apps/agent`, API `/v1/status|apply|preflight`, State Machine, Install/systemd, Backend `hostAgentClient`.
[x] **Sidecar entfernen (3b):** `docsops-updater` aus Compose, Doku.
[x] **UX & Härtung (3c):** `UpdateRun.agentPhase`, Apply-Modal mit Stepper, Status-Seite `/update-status.html`, globaler Update-Banner, Doku.

---

## 27. Plattform-Export & Migration

**Ziel:** Strukturierter Export/Import für Umzug, Klon, Testinstanz – getrennt von Operational Backup (§25). Plan: [Plan-Betrieb-Releases-Backup-Update](Plan-Betrieb-Releases-Backup-Update.md) §4.

### Phase 1 – Export, Import (leere Instanz)

[x] **Format:** `exportFormatVersion` + Manifest; Domänen-JSON (Organisation, User, Kontexte, Dokumente, Grants) + `files/`; stabile Export-IDs für ID-Remapping beim Import.
[x] **Jobs:** `maintenance.platform-export`, `maintenance.platform-import` (Worker); Metadaten + Status in DB; Audit.
[x] **Export-Service:** Serialisierung über Domänen-Layer; MinIO-Dateien ins Archiv; ohne Sessions/pg-boss/Backup-Metadaten (v1).
[x] **Import-Service:** Preflight (Format, Version); Import nur in **leere** Instanz; Phasen mit ID-Map; Default **Passwort-Reset** für importierte User.
[x] **Admin-API:** `POST/GET /api/v1/admin/platform-exports`, `POST /api/v1/admin/platform-imports`, Upload + Status; nur `requireAdmin`.
[x] **Admin-UI:** Tab **Migration** (`/admin/migration`) – letzter Export-Status, Export-/Import-Wizard (Stepper-Modals, Auto-Download), **keine** Historie-Tabellen. Dev-only: Debug-Menü „Reset platform data“. **Nicht** im Backup-Tab.
[x] **Wartungsmodus** während Import; danach `search.reindex.full` anstoßen.
[x] **Benachrichtigungen:** In-App an Admins (`platform-export-succeeded` / `-failed`, `platform-import-succeeded` / `-failed`); Kategorie `system`.
[x] **Doku:** Abschnitt in Plan-Betrieb §4; Hinweis im [Runbook-Backup-Restore](Runbook-Backup-Restore.md), dass DR-Restore ≠ Plattform-Import.

### Phase 2 – Erweiterungen

[ ] **Cross-Version:** Importer-Adapter bei `APP_VERSION`- / Block-`schemaVersion`-Wechsel.
[ ] **Push an Ziel-Instanz:** Ziel erzeugt URL + Token; Quell-Wizard liefert Export-Paket direkt (ohne Download/Upload); TTL, single-use, Bestätigung auf Ziel.
[ ] **Selektiver Export:** eine Company / Tenant (Managed Hosting).
[ ] **Merge-Import:** Konfliktregeln (E-Mail, Slug); explizit opt-in, nicht v1-Default.
[ ] **CLI:** optionales Offline-Import-Skript für air-gapped Restore.
