# Plan: App-i18n (EN + DE)

Vorgaben für die Mehrsprachigkeit der internen Webapp (`apps/frontend`). Ergänzt [Plan-Demo-Oeffentlich §4](Plan-Demo-Oeffentlich.md#4-sprache--i18n) und [Umsetzungs-Todo §19](Umsetzungs-Todo.md) (App-i18n).

**Status:** Phasen 1–4 umgesetzt (Gerüst, Daily UX, Workspace-Rest, Admin-Tiefe). Help-DE / Demo-Seed DE / E-Mail-Templates bewusst separat.

---

## 1. Zielbild

- UI der App in **Englisch und Deutsch**
- **Englisch** ist Quellsprache und Fallback (Keys, fehlende DE-Einträge)
- Landing (`apps/landing`) bleibt **statisch Deutsch** und **nicht** Teil des App-i18n-Katalogs
- Help in der App darf vorerst **EN** bleiben (kein Blocker für Demo); Help-DE ist ein eigener späterer Punkt

---

## 2. Stack & Dateistruktur

| Entscheidung  | Vorgabe                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| Bibliothek    | `i18next` + `react-i18next`                                                     |
| Katalogformat | JSON pro Locale und Namespace                                                   |
| Ablage        | `apps/frontend/src/i18n/locales/{en,de}/<namespace>.json`                       |
| Provider      | App-weit (nahe Preference-/Theme-Wiring); Login vor Session ebenfalls abgedeckt |

Namespaces: `common`, `shell`, `auth`, `settings`, `admin`, `documents`, `approvals`, `notifications`, `contexts`, `templates`.

---

## 3. Keys & Texte

- Keys **semantisch**, nicht der EN-Satz: z. B. `admin.users.create`, nicht `t('Create user')`
- Keine Roh-UI-Strings in Komponenten für übersetzbare Labels/Buttons/Toasts/Meldungen
- Fehlender DE-Key → **EN anzeigen** (kein leerer String, keine stille andere Sprache)
- User-generierte Inhalte, Routen, API-Pfade, technische IDs und Log-Keys **nicht** übersetzen

---

## 4. Locale-Auflösung

Reihenfolge (fest):

1. Eingeloggt: `userPreferences.locale` (`en` \| `de`) aus Settings
2. Query `?lang=en` / `?lang=de` (u. a. Landing → Demo)
3. Browser (`Accept-Language` / `navigator.languages`)
4. Fallback **`en`**

Nach Login gilt die Preference als Wahrheit; vor Login Browser/`?lang=`. Settings „Interface language“ bleibt die Persistenz (bereits vorhanden).

---

## 5. Backend-Fehler & Formate

- Backend liefert weiterhin stabile **englische** Fehlertexte bzw. Codes
- Frontend mappt bekannte Codes auf `t('errors…')`; unbekannte Meldungen EN belassen
- Datums-/Zahlenformat über `Intl` (bzw. dayjs mit Locale) an der **aktiven App-Locale**
- Mantine (z. B. `DatesProvider`) an dieselbe Locale koppeln

---

## 6. Phasen (Umsetzung)

### Phase 1 (vor öffentlicher Demo) – umgesetzt

Gerüst + Locale-Wiring; UI-Texte für:

- AppShell (Nav, Account-Menü, Chrome)
- Login / Demo-Login
- Settings (Appearance inkl. Language-Label selbst)
- Häufige Toasts/Dialoge
- Home / Catalog-Kern
- Admin-Nav und häufige Admin-Primary-Actions

### Phase 2 – Daily UX – umgesetzt

Alles, was eingeloggte Nutzer täglich sehen (ohne Admin-Ops-Tiefe):

- `documents` stark erweitern: Document Editor/Viewer (Toolbar, Lifecycle, Comments, Draft/Suggestions, Modals, Toasts)
- Approvals / Reviews (`approvals`)
- Notifications Inbox: Kategorien + Event-Formatter (`notifications` Namespace)
- Settings-Resttabs (General, Account, Security, Notifications, Pulse, Storage)
- `common`: Shared Toasts/Status („Error“, „Saved“, „Untitled“, …)

### Phase 3 – Workspace & Restkern – umgesetzt

- Context/Org Workspace (`contexts`): Sidebar, CRUD, New draft/process/project
- Catalog-/Home-/Search-Reste (Spalten, Pulse-Kind-Labels, Relativzeiten)
- Templates (`templates`); Trash/Archive/Drafts-Chrome
- Scope People; What's-new-Chrome (Release-Markdown bleibt EN)

### Phase 4 – Admin-Tiefe – umgesetzt

- Admin Backup komplett (Overview, Destinations, History, Restore, Schedule, Toasts)
- Migration Export/Import-Wizards + Status/Preflight
- System-Detail (Update-Steps, Alerts, Mail-Form), Jobs/Scheduler, Org-Forms/Tabellen-Rest (Primary-Actions schon Phase 1)

### Bewusst separat (nicht Phasen 2–4)

- Help-DE (Topic-Prosa)
- Demo-Seed-Inhalte DE (optional)
- E-Mail-Templates (wenn SMTP-Texte user-facing)
- Landing (`apps/landing`)
- Backend-Fehlertexte umstellen; User-generierte Inhalte

---

## 7. Pflege & Schutz vor Lücken

- Jeder neue UI-Text: EN-Key anlegen; DE zeitnah oder bewusst TODO (nur unkritische Labels)
- CI/Verify: `pnpm run check:i18n` (`apps/frontend/scripts/check-i18n-keys.mjs`) stellt sicher, dass **DE-Keys ⊆ EN-Keys**
- ESLint `i18next/no-literal-string` noch **nicht** app-weit (zu laut); Review: migrierte Surfaces nur mit `t()`
- Review-Checkliste: keine neuen hardcoded Labels ohne `t()` auf bereits migrierten Surfaces (Phasen 1–4)

---

## 8. Explizit nicht

- Strings-as-Keys
- Soft-Fallback über weitere Sprachen hinaus EN
- Backend-Responses auf DE umstellen
- Landing in denselben i18n-Katalog ziehen

---

## 9. Bezug

- Persistenz: `GET/PATCH /api/v1/me/preferences` → `locale`
- Demo/Landing-Hinweis: [Plan-Demo-Oeffentlich](Plan-Demo-Oeffentlich.md)
- Stack-Hinweis: [Technologie-Stack](Technologie-Stack.md) §3 Frontend
