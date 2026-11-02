# ADR 003: Scope-Author Direct Draft Edit, Draft-Change-Ops, Reviews & Presence

## Status

**Historisch** – ersetzt durch [ADR 004 – Inline Draft Suggestions](004-inline-draft-suggestions.md).

ADR 003 (Direct Author PATCH + `DocumentDraftChange`-Ops-Log) wurde durch Inline Track Changes abgelöst. Der Code aus ADR 003 ist bei Umsetzung von ADR 004 vollständig zu entfernen (siehe ADR 004 § Legacy-Entfernung).

## Kontext

- ADR 001 beschrieb Autoren-Vorschläge (Suggestions) mit Lead-Accept/Reject.
- In der Praxis war der Suggestion-Workflow zu schwerfällig; Scope Authors sollen den **gemeinsamen Lead-Draft direkt** bearbeiten.
- Leads brauchen weiterhin eine **Review-Inbox**, wenn Autoren speichern, ohne dass Accept/Reject pro Vorschlag nötig ist.
- Draft-Historie bis Publish soll **effizient** sein (Block-Ops pro Save, kein Vollsnapshot pro Save).

Siehe auch: [Rechtesystem](../datenmodell/Rechtesystem.md), [Versionierung](../versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md).

---

## 1. Direktes Draft-Editing

**Entscheidung:** Scope Authors (TeamAuthor / DepartmentAuthor) und Personal-Context-Owner dürfen `PATCH /documents/:id/lead-draft` aufrufen. Scope Lead und Admin behalten Publish.

**Nicht mehr:** `DocumentSuggestion`, Accept/Reject/Withdraw-Routen, Suggestion-UI.

---

## 2. Draft-Zyklus und Change-Log

**Modelle:**

- `DocumentDraftCycle` – ein Vollsnapshot (`baseBlocks`) beim Zyklusstart (typisch Published-Stand).
- `DocumentDraftChange` – pro Save (nur **Nicht-Lead**-Saves mit Inhaltsänderung): `ops` (Block-Ops-Array), `revisionFrom`/`revisionTo`, `savedById`, `affectedBlockIds`.

**Zyklusstart:** Erster Save nach Publish (kein Cycle vorhanden) legt `baseBlocks` an.

**Publish:** In derselben Transaktion wie bisher `DocumentDraftChange.deleteMany` + `DocumentDraftCycle.delete` für das Dokument.

**Ops:** Serverseitiger Diff `computeDraftOpsFromDocuments(before, after)` auf Top-Level-Blocks (stabile `block.id`); Anwenden via `applyDraftOpsToDocument`.

---

## 3. Reviews-Inbox

**Entscheidung:** `GET /me/reviews` aggregiert Dokumente mit mindestens einem `DocumentDraftChange` im aktiven Zyklus (`pendingForReview` für Leads). Autoren sehen eigene Saves (`myChanges`). Informativ – **kein** Accept/Reject.

---

## 4. Presence im Edit-Mode

**Entscheidung:**

- `POST /documents/:id/draft/presence` – Heartbeat (45s TTL, In-Memory-Registry).
- `GET …/draft/presence` – Polling-Fallback.
- SSE `document.draft-presence` mit `{ documentId, editors: [{ userId, name }] }`.

**Hinweis:** In-Memory reicht für Single-Node Dev/Docker; Multi-Replica später Redis o. ä.

---

## 5. ADR 001

ADR 001 (Suggestions-Basis, Stale-Regeln) ist **historisch** für das Produktmodell; technische Block-/Draft-Revision-Konzepte bleiben relevant, Suggestion-spezifische Regeln entfallen.
