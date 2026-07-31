# ADR 006: Cross-Document-Links (Dokument↔Dokument)

## Status

**Akzeptiert** (umgesetzt).

## Kontext

- ADR 005 deckt Inline-Links als `meta.link: { href }` ab (http(s) und In-Dokument-`#heading-slug`).
- Querverweise zwischen Dokumenten sollen strukturiert persistiert werden, ohne App-Routen (`/documents/…`) als href und ohne Titel im Link-Meta zu speichern.
- TipTap nutzt weiterhin eine Link-Mark; Attachment-Bilder verwenden bereits synthetische Tokens (`docsops-attachment:`).

## Entscheidung

1. **Persistenz:** `meta.link` ist eine **diskriminierte** Form:
   - Extern/Anker (ADR 005): `{ href: string }` mit Whitelist http(s) / `#slug`
   - Intern (dieses ADR): `{ documentId: string }` (kein Titel; optional später `headingSlug`)
2. **TipTap:** interne Links bleiben Link-Marks mit synthetischem `href`:
   - `docsops-doc:<documentId>`
   - Roundtrip Blocks ↔ TipTap mappt beidseitig (analog `docsops-attachment:`)
3. **Kein** Speichern von `/documents/…` als `href` (bleibt verboten).
4. **Save-Assert:** `assertBlockDocumentLinksValid` prüft für `documentId` Existenz + Leserecht über die Permissions-Layer (`canRead`) – kein Inline-Recht.
5. **Markdown-Export:** `[label](docsops-doc:ID)`. Markdown-Import der Token ist nicht Teil von v1.
6. **UI v1:** Dokument-Picker (Search-API); kein Heading-Picker im Cross-Doc-Flow; kein Backlinks-Index.
7. **`schemaVersion`:** bleibt v1 (wie bei `meta.link` / Marks).

## Nicht-Ziele (v1)

- Backlinks-Index
- Cross-Doc-`#heading` / Heading-Picker
- Relative App-Routen als persistierter `href`
- Markdown-Import von `docsops-doc:`-Tokens
- Wiki-Syntax-only (`[[title]]`) als Persistenzformat

## Konsequenzen

| Bereich  | Konsequenz                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| Schema   | `blockTextLinkSchema` als Union `{ href }` \| `{ documentId }`                    |
| Backend  | Assert mit `canRead`; MD-Export Token                                             |
| Frontend | Token parse/serialize, TipTap `Link.validate`, Picker, Preview → `/documents/:id` |
| Security | Nur lesbare Ziele speicherbar; Preview ohne Titel-Leak aus fremden Docs           |

## Changelog

| Datum      | Änderung                     |
| ---------- | ---------------------------- |
| 2026-07-31 | Erstfassung (akzeptiert, v1) |
