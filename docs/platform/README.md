# docs/platform – Plattform-Konzept & Architektur

Konzept und Architektur der internen Dokumentationsplattform DocsOps.

**Einstieg:** [Doc-Platform-Konzept.md](Doc-Platform-Konzept.md)

Verwandte Bereiche außerhalb dieses Ordners:

| Bereich                                   | Inhalt                                                                                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [docs/marketing/](../marketing/README.md) | Positionierung, Landing (These, Abgrenzung) – Einstieg: [Positionierung-und-Landing.md](../marketing/Positionierung-und-Landing.md) |
| [docs/plan/](../plan/Umsetzungs-Todo.md)  | Umsetzungsplan, Stack, API, Betrieb                                                                                                 |

## Ordnerstruktur

| Ordner / Datei                                                               | Inhalt                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Doc-Platform-Konzept.md](Doc-Platform-Konzept.md)**                       | Grundidee, Organisationsstruktur, Kontexte, Rechte (Hauptdokument)                                                                                                                                                                    |
| **[Vergleich-DocsOps-Docmost.md](Vergleich-DocsOps-Docmost.md)**             | Gegenüberstellung mit Docmost; Stärken, Rechte, wann der DocsOps-Ansatz passt                                                                                                                                                         |
| **[KI-Datenbank-sicher-durchsuchen.md](KI-Datenbank-sicher-durchsuchen.md)** | Sichere DB-Nutzung für KI-Suche (RAG; kein direkter LLM-DB-Zugriff)                                                                                                                                                                   |
| **datenmodell/**                                                             | [Pseudocode Datenmodell](datenmodell/Pseudocode%20Datenmodell.md), [Rechtesystem](datenmodell/Rechtesystem.md)                                                                                                                        |
| **versionierung/**                                                           | [Versionierung als Snapshots](versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md) (Full-Version bei Publish), Lead-gesteuerte Freigabe, Inline-Suggestions; zugehörige SVG-Diagramme                                       |
| **ui-architektur/**                                                          | [Intranet-Dashboard](ui-architektur/Intranet-Dashboard.md) (Routen, Seiten), [Architektur und Workflow](ui-architektur/Architektur-und-Workflow.md), [UI-Density (Meter-Inspiration)](ui-architektur/UI-Density-Meter-Inspiration.md) |
| **diagramme/**                                                               | Strukturelle Übersichten als SVG (Hierarchie/Kontexte/Zugriffe, Struktur- und Kontextdiagramm)                                                                                                                                        |
| **adr/**                                                                     | [Architecture Decision Records](adr/README.md) – verbindliche Architekturentscheidungen (aktuell u. a. [ADR 004 – Inline Draft Suggestions](adr/004-inline-draft-suggestions.md))                                                     |

## Lesereihenfolge (empfohlen)

1. **[Doc-Platform-Konzept.md](Doc-Platform-Konzept.md)** – Konzept verstehen.
2. **[Positionierung-und-Landing.md](../marketing/Positionierung-und-Landing.md)** (optional) – These und Abgrenzung für Produkt/Marketing.
3. **datenmodell/** – Datenmodell und Rechte.
4. **versionierung/** und **adr/** – Publish, Snapshots, Edit-System (Blocks / Inline-Suggestions).
5. **ui-architektur/** – Dashboard-Routen und Workflow.
6. **[Vergleich-DocsOps-Docmost.md](Vergleich-DocsOps-Docmost.md)** – Einordnung gegenüber Wiki-/KB-Alternativen.
7. **[Umsetzungs-Todo.md](../plan/Umsetzungs-Todo.md)** – was umgesetzt bzw. geplant ist.
