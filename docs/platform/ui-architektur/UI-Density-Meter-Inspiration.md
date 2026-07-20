# UI-Density: Meter-Inspiration

**Stand:** Juli 2026  
**Referenz:** Screenshots unter [`docs/inspiration/`](../../inspiration/) (Meter Network-Ops-UI)

Kurznotiz zu Übernahmezielen für die DocsOps-App-Shell. Umsetzung: Mantine-Theme + Sidebar + Top-Bar + Listen/Tabellen.

## Typografie (Meter vs. DocsOps)

- **Meter (Marketing/Brand):** [Suisse Int’l](https://www.swisstypefaces.com/fonts/suisse/) (Swiss Typefaces, kommerziell).
- **DocsOps:** **Inter Variable**; Nav-Labels `font-weight: 500` (active `600`).

## Shell-Layout

1. **Status-Banner** (Maintenance/Update/Live) im `AppShell.Header`.
2. **Sidebar:** Logo/Wordmark | Search (Ctrl/⌘K) | Nav | Collapse-Footer. Kein Account, keine Utility-Icons.
3. **Main Top-Bar:** Notifications, Settings, Help, Avatar-Dropdown (Name/E-Mail, Theme, What’s new, Admin, Logout).
4. **Breadcrumb-Zeile** unter der Top-Bar (wenn Seite Items setzt; Document/Context/Subcontext).
5. **Pin sidebar:** nur Startzustand; Collapse jederzeit.

## Übernehmen / Scope

| Muster       | Ziel                                              |
| ------------ | ------------------------------------------------- |
| Utilities    | Top-Bar rechts, nicht doppelt in Sidebar/Dropdown |
| Search       | Sidebar + globales Ctrl/⌘K                        |
| Breadcrumbs  | Shell-Slot (Meter), Doc/Context zuerst            |
| Listen/Cards | dichte Tabellen, Card padding `sm`                |

## Nicht übernehmen

- Dot-Grid, Suisse Int’l, Workspace-Switcher, Recent/Pins in der Sidebar
- Document-Editor-Dichte

## Bezug

- Shell: `apps/frontend/src/components/appShell/`
- Suche: `apps/frontend/src/components/search/`
- Breadcrumbs: `AppShellBreadcrumbsContext` + `DocumentDocBreadcrumbs`
