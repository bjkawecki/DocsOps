# ADR 005: Inline-Links im Block-Dokument (geplant)

## Status

**Vorgeschlagen** (noch nicht umgesetzt).

## Kontext

- Block-Schema und TipTap-Lead-Editor unterstützen derzeit Marks `bold | italic | code` (ADR 002) und Strukturblöcke u. a. Listen, Blockquote, Horizontal Rule.
- Heading-Anker (`id` / Slugs) existieren für TOC und Kommentar-Ziele, aber **kein** klickbarer Link im Fließtext.
- Für eine Docs-Plattform sind externe URLs und In-Dokument-Anker (`#heading-slug`) üblich; Querverweise zwischen Dokumenten sind separat geplant (Umsetzungs-Todo §28a).

## Entscheidung (Ziel)

1. **Mark `link`** auf Text-Leafs mit Attributen, mindestens `href` (String).
2. Erlaubte Ziele in v1:
   - **Extern:** `http:` / `https:` (ggf. später `mailto:`)
   - **In-Dokument:** `#<heading-slug>` gegen bestehende Heading-Anker desselben Dokuments
3. Persistenz analog ADR 002: entweder Erweiterung von `meta.marks` um Objekte (`{ type: 'link', href }`) oder paralleles `meta.link`; Roundtrip über TipTap `@tiptap/extension-link`, Preview (`<a>`), Markdown-Export (`[text](href)`).
4. **Kein** stiller Fallback bei ungültigen `href` – Speichern/Import ablehnen oder klar strippen mit Fehlerpfad (Produktentscheidung im Umsetzungs-PR).
5. Cross-Document-Links (`documentId` / Picker) **nicht** Teil dieses ADR; siehe Todo §28a „Interne Links“.

## Nicht-Ziele (v1)

- Relative App-Routen ohne Schema-Whitelist
- Autolink beim Tippen ohne explizite Mark-UI
- Open-Graph-Previews / Embeds

## Konsequenzen

| Bereich  | Konsequenz                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Schema   | ADR + Zod/`meta`-Form; ggf. `schemaVersion` nur wenn Breaking Change nötig |
| Frontend | TipTap Link-Extension, Toolbar, Preview, Konverter `blockDocumentTiptap`   |
| Backend  | Markdown Import/Export, Validierung `href`, PDF über Markdown              |
| Security | Nur erlaubte Schemes; `rel`/`target` in Preview bewusst setzen             |

## Changelog

| Datum      | Änderung    |
| ---------- | ----------- |
| 2026-07-25 | Erstfassung |
