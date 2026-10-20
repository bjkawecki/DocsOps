# ADR 007: Company PDF Branding

## Status

**Akzeptiert** (umgesetzt).

## Kontext

- PDF-Export läuft asynchron im Job-Worker: Blocks → Markdown → `typst compile input.md` ([`typstPdfExport.ts`](../../../apps/backend/src/infrastructure/pdf/typstPdfExport.ts)).
- §28a verlangt optionales Company-Theme (Logo, Primärfarbe, Margins), Plattform-Default zuerst, kein freies Firmen-CSS; Konfiguration durch Admin und Company-Lead.

## Entscheidung

1. **Schema (`Company`):** optional `pdfPrimaryColor` (`#RRGGBB`), `pdfMarginMm` (12–40), `pdfLogoObjectKey` + `pdfLogoContentType` (PNG/JPEG, max 2 MB), `pdfLogoPosition` (`left` | `right`, Default links), `pdfFontFamily` (`sans` | `serif`, Default sans).
2. **Plattform-Default:** Farbe `#1c7ed6`, Margin 20 mm, kein Logo, Logo-Position links, Schrift sans (Liberation Sans) – wenn Dokument ohne Company-Owner (personal/kein Kontext) oder Felder null/ungültig. Serif nutzt Liberation Serif (Worker-/Dev-Images).
3. **Company-Auflösung beim Export:** Document → Context → Owner → `companyId` (direkt oder über Department/Team); personal Owner → Default.
4. **Typst:** Entry `main.typ` (Margins, Link-Farbe, Schriftfamilie, optionales Logo im **Page-Header** links/rechts, explizite Heading-Größen H1–H4) + CommonMark-Body in `content.md` via `@preview/cmarker` (`#render(read("content.md"))`). Typst kompiliert Markdown **nicht** nativ als Hauptdatei. Package-Cache im Dev-Image unter `/var/cache/typst`.
5. **API:** `GET/PATCH …/pdf-branding`, `GET/POST/DELETE …/pdf-logo`. Verwalten: Admin oder Company-Lead (`canManageCompanyPdfBranding`). Lesen Logo: `canViewScope`.
6. **UI:** Admin → Company → Tab „PDF branding“ (kein Org-Nav-Eintrag unter Company).

## Nicht-Ziele (v1)

- Department/Team-Themes, SVG-Logo, Schrift-Upload, freier Footer-Text, PDF-Live-Vorschau in der UI.
- eIDAS / kryptografische Signatur (AES/QES).

## Erweiterungen (nach v1)

7. **Logo-Upload:** PNG/JPEG, max. 2 MB; Seitenverhältnis Breite:Höhe **2:1–6:1** (empfohlen 3:1–5:1); Skalierung im Header auf 12 mm Höhe.
8. **Versionierte PDFs:** Bei Publish wird `documents.export.pdf` für die neue `DocumentVersion` enqueued; Speicherung in `pdfObjectKey` + `pdfResponsibleLabel` (Scope-Leads zum Erzeugungszeitpunkt). Download im Versionsverlauf ohne Neu-Rendern. Manueller Export regeneriert die aktuelle Version.
9. **Sichtbare Meta-Zeile** unter dem Titel: `Name(n), Datum, Version n` (ohne Lead-Namen: nur Datum und Version). Datum nach Locale des Export-Anforderers (`en`: `YYYY-MM-DD`, `de`: `TT.MM.JJJJ`).
10. **Schreibschutz:** nach Typst `qpdf` mit leerem User-Passwort, Modify/Annotate aus (kein Öffnungs-Passwort; kein eIDAS).

## Konsequenzen

| Bereich  | Konsequenz                                                                           |
| -------- | ------------------------------------------------------------------------------------ |
| Prisma   | Migration Company-PDF-Felder; `DocumentVersion.pdfObjectKey` / `pdfResponsibleLabel` |
| Worker   | Theme + Logo vor `typst compile`; qpdf Write-Protect                                 |
| Org-API  | Branding-Endpunkte + Permissions                                                     |
| Frontend | Shared `CompanyPdfBrandingForm`; Versions-PDF-Download                               |

## Changelog

| Datum      | Änderung                                                           |
| ---------- | ------------------------------------------------------------------ |
| 2026-08-01 | Erstfassung (akzeptiert, v1)                                       |
| 2026-08-01 | Logo im Page-Header (links/rechts), explizite H1/H2-Skalierung     |
| 2026-10-20 | Logo-Aspekt, Publish-PDF pro Version, Lead-Zeile, qpdf-Permissions |
| 2026-10-20 | Admin: `pdfFontFamily` sans/serif (Liberation)                     |
| 2026-10-20 | Meta-Zeile: Datumsformat nach Nutzer-Locale (de/en)                |
