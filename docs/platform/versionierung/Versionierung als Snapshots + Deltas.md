# Versionierung als Snapshots

**Verbindlicher Ausblick:** Inhaltliche Änderungen an **veröffentlichten** Dokumenten: Scope Authors erzeugen **Inline-Vorschläge** (Track Changes) im Lead-Draft; der **Scope Lead** löst Vorschläge auf (Accept/Decline) und **published** → neuer Snapshot. Siehe [ADR 004](../adr/004-inline-draft-suggestions.md).

---

## 1. Kernidee: Versionierung als Snapshots (Full-Version)

- Dokument = logische Einheit; kanonischer Inhalt künftig als **Block-JSON** (nicht mehr ausschließlich ein Markdown-String).
- **Versionierung für veröffentlichte Dokumente:** Jede **Published**-Ausbaustufe entspricht einem **Snapshot** (vollständiger Inhalt). Speichern im Lead-Draft erzeugt **keine** neue öffentliche Version, bis der Lead **veröffentlicht** (und keine pending Inline-Vorschläge offen sind).
- **Draft (bis Publish):** Ein `draftBlocks`-JSON mit Lead-Kanon plus pending **Inline-Suggestion-Marks** auf Text-Leaf-Knoten (`meta.suggestion`); **kein** Ops-Log pro Save, **kein** Draft-Versions-Log.
- **Full-Version:** Jede gespeicherte Version enthält den **vollständigen** Dokumentinhalt (keine Delta-Speicherung als Pflicht). Optional: Policy „nur letzte N Versionen“.
- **Versionsvergleich:** Zwei Versionen in der UI vergleichen (z. B. rot/grün), indem die beiden Snapshots verglichen werden (z. B. diff-match-patch auf serialisiertem Text/Markdown).

---

## 2. Freigabe und sichtbare Inhalte

- **Unveröffentlichtes Dokument** (`publishedAt == null`): nur für Nutzer mit Schreibrecht (bzw. Lead) sichtbar, bis zur Veröffentlichung.
- **Veröffentlicht:** Leser sehen den **Snapshot** der aktuellen Version — **ohne** Suggestion-Marks.
- **Autoren** erzeugen Inline-Vorschläge im Draft; **Lead** accept/decline und löst **Publish** aus → materialisierter Kanon als neuer Snapshot.

Details: [ADR 004](../adr/004-inline-draft-suggestions.md).

---

## 3. Speicher und Archivierung

- **Full-Version pro Snapshot:** jede Zeile in `DocumentVersion` enthält den vollständigen Inhalt der Version (ohne `meta.suggestion`).
- **Optional:** Begrenzung auf die letzten N Versionen.

---

## 4. Rechte & Ownership

- **Kontextfreie unveröffentlichte Dokumente:** Veröffentlichung setzt einen **zugewiesenen Kontext** voraus; zuerst per `PATCH` `contextId` setzen, dann Publish (siehe Plattform-Regeln).
- **Ownership:** Abteilung, Team oder Nutzer → Verantwortlichkeit; Zugriff über Grants und Lead-Regeln, nicht automatisch vererbt.
- **Freigabe neuer Version:** nur **Scope-Lead** (bzw. Admin / Owner persönlicher Kontexte); Publish nur bei `pendingSuggestionCount === 0`.

---

## 5. Vorteile gegenüber echtem Git für interne Plattformen

- Kein Git-Wissen nötig; Ablauf über Web-UI.
- Explizite Rechte an Dokumenten und Freigabe.
- Versionen in der Datenbank; nachvollziehbare Snapshots.
- Klare Einbettung in Prozess/Projekt/Unterkontext.

---

## Kurz gesagt

**Snapshots + Lead-gesteuerter Publish** mit **Inline Track Changes** im Draft. Technische Umsetzung: [ADR 004](../adr/004-inline-draft-suggestions.md), Editor (Tiptap/ProseMirror) im [Edit-System-Plan](../../plan/Edit-System-Blocks-Suggestions-Lead-Draft.md).
