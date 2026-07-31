# ADR 007: Company PDF Branding

## Status

**Akzeptiert** (umgesetzt).

## Kontext

- PDF-Export läuft asynchron im Job-Worker: Blocks → Markdown → `typst compile input.md` ([`typstPdfExport.ts`](../../../apps/backend/src/infrastructure/pdf/typstPdfExport.ts)).
- §28a verlangt optionales Company-Theme (Logo, Primärfarbe, Margins), Plattform-Default zuerst, kein freies Firmen-CSS; Konfiguration durch Admin und Company-Lead.

## Entscheidung

1. **Schema (`Company`):** optional `pdfPrimaryColor` (`#RRGGBB`), `pdfMarginMm` (12–40), `pdfLogoObjectKey` + `pdfLogoContentType` (PNG/JPEG, max 2 MB), `pdfLogoPosition` (`left` | `right`, Default links).
2. **Plattform-Default:** Farbe `#1c7ed6`, Margin 20 mm, kein Logo, Logo-Position links – wenn Dokument ohne Company-Owner (personal/kein Kontext) oder Felder null/ungültig.
3. **Company-Auflösung beim Export:** Document → Context → Owner → `companyId` (direkt oder über Department/Team); personal Owner → Default.
4. **Typst:** Entry `main.typ` (Margins, Link-Farbe, optionales Logo im **Page-Header** links/rechts, explizite Heading-Größen H1–H4) + CommonMark-Body in `content.md` via `@preview/cmarker` (`#render(read("content.md"))`). Typst kompiliert Markdown **nicht** nativ als Hauptdatei. Package-Cache im Dev-Image unter `/var/cache/typst`.
5. **API:** `GET/PATCH …/pdf-branding`, `GET/POST/DELETE …/pdf-logo`. Verwalten: Admin oder Company-Lead (`canManageCompanyPdfBranding`). Lesen Logo: `canViewScope`.
6. **UI:** Admin → Company → Tab „PDF branding“ (kein Org-Nav-Eintrag unter Company).

## Nicht-Ziele (v1)

- Department/Team-Themes, SVG-Logo, Schrift-Upload, freier Footer-Text, PDF-Live-Vorschau in der UI.

## Konsequenzen

| Bereich  | Konsequenz                       |
| -------- | -------------------------------- |
| Prisma   | Migration Company-PDF-Felder     |
| Worker   | Theme + Logo vor `typst compile` |
| Org-API  | Branding-Endpunkte + Permissions |
| Frontend | Shared `CompanyPdfBrandingForm`  |

## Changelog

| Datum      | Änderung                                                       |
| ---------- | -------------------------------------------------------------- |
| 2026-08-01 | Erstfassung (akzeptiert, v1)                                   |
| 2026-08-01 | Logo im Page-Header (links/rechts), explizite H1/H2-Skalierung |
