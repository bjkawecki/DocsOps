# ADR 005: Inline-Links im Block-Dokument

## Status

**Akzeptiert** (umgesetzt).

## Kontext

- Block-Schema und TipTap-Lead-Editor unterstützen Marks `bold | italic | code` (ADR 002) und Strukturblöcke u. a. Listen, Blockquote, Horizontal Rule, Tabellen.
- Heading-Anker (`id` / Slugs) existieren für TOC und Kommentar-Ziele.
- Für eine Docs-Plattform sind externe URLs und In-Dokument-Anker (`#heading-slug`) üblich; Querverweise zwischen Dokumenten sind separat geplant (Umsetzungs-Todo §28a).

## Entscheidung

1. **Persistenz:** Text-Leafs tragen optional **`meta.link: { href: string }`** parallel zu `meta.marks` (ADR 002 bleibt String-Array). TipTap nutzt intern die Link-Mark mit `attrs.href`; Konverter mappt beidseitig.
2. Erlaubte Ziele in v1:
   - **Extern:** `http:` / `https:`
   - **In-Dokument:** `#<heading-slug>` (nicht-leerer Slug ohne Whitespace)
3. Roundtrip: TipTap `@tiptap/extension-link` (ohne Autolink), Preview (`<a>`), Markdown-Export (`[text](href)`). PDF über bestehende Markdown→Typst-Pipeline.
4. **Ungültige `href`:** kein stiller Strip beim Speichern – `assertBlockDocumentLinksValid` lehnt ab. Im TipTap→Blocks-Konverter werden disallowed Schemes weggelassen (kein Persistieren unsicherer Links aus dem Editor).
5. Cross-Document-Links (`documentId` / Picker) **nicht** Teil dieses ADR; siehe Todo §28a „Interne Links“.
6. **`schemaVersion`:** bleibt **v1**, sobald Marks, `meta.link` oder Suggestions vorhanden sind.

## Nicht-Ziele (v1)

- Relative App-Routen ohne Schema-Whitelist
- Autolink beim Tippen ohne explizite Mark-UI
- `mailto:`
- Open-Graph-Previews / Embeds
- Markdown-Import von Inline-Links (Export ja; Import von Inline-Marks folgt getrennt)

## Konsequenzen

| Bereich  | Konsequenz                                                               |
| -------- | ------------------------------------------------------------------------ |
| Schema   | `blockTextLinkSchema` / `meta.link`; Validierung auf Save-Pfaden         |
| Frontend | TipTap Link-Extension, Toolbar, Preview, Konverter `blockDocumentTiptap` |
| Backend  | Markdown-Export, `assertBlockDocumentLinksValid`                         |
| Security | Nur erlaubte Schemes; Preview: `rel`/`target` für http(s)                |

## Changelog

| Datum      | Änderung                                      |
| ---------- | --------------------------------------------- |
| 2026-07-25 | Erstfassung (vorgeschlagen)                   |
| 2026-07-31 | Akzeptiert: `meta.link`, Whitelist, Umsetzung |
