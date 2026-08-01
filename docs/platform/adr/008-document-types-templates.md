# ADR 008: Document Types & Templates

## Status

**Akzeptiert** (umgesetzt).

## Kontext

§28b verlangt optionale Document Types und Templates für neue Drafts (Built-in + Custom), ohne Content bei nachträglichem Type-Wechsel zu überschreiben.

## Entscheidung

1. **Built-ins** leben als Code-Katalog (`builtinDocumentTemplates.ts`), IDs `builtin:<slug>`.
2. **Custom** Types/Templates in Prisma (`CustomDocumentType` / `CustomDocumentTemplate`), Scope Company/Department/Team oder platform (Admin).
3. **Document.documentTypeKey** speichert `builtin:<slug>` oder `custom:<cuid>`; kein Template-FK am Dokument.
4. **Create:** `templateId` → Seed `draftBlocks` + Type; nur `typeId` → Type ohne Seed.
5. **PATCH `/documents/:id/document-type`:** ändert nur `documentTypeKey`; nie Blocks/Inhalt.
6. **Permissions:** Verwenden bei Create/`canWrite`; Manage via `canManageDocumentTemplates` / `isScopeLead` / Admin.
7. **UI:** Picker in New-Document-Flows; Type-Control in Metadata; Manage unter `/templates` (Redirect von `/document-templates`).

## Nicht-Ziele (v1)

Template erneut anwenden, Versioning, Pflicht-Type, mehr als ein Default-Template pro Type.

## Changelog

| Datum      | Änderung                     |
| ---------- | ---------------------------- |
| 2026-08-01 | Erstfassung (akzeptiert, v1) |
