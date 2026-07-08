# Marketing & öffentliche Präsenz

Planung und Inhalte für Landing Page, Demo und öffentliche Kommunikation (§19 in [Umsetzungs-Todo](../plan/Umsetzungs-Todo.md)).

## Leitdokumente

| Dokument                                                             | Inhalt                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **[Positionierung-und-Landing.md](./Positionierung-und-Landing.md)** | **Aktueller Erkenntnisstand** – These, drei Sections, Hero, Sprache |
| **[Landing-Sections-Plan.md](./Landing-Sections-Plan.md)**           | **Umsetzungsplan** – Organisation · Kontext · Rollen (Phasen A–G)   |
| [Landing-Page-Plan.md](./Landing-Page-Plan.md)                       | Technik, Routen, Umsetzungsstand `apps/landing`                     |
| [diagramme/scope-hierarchie.mmd](./diagramme/scope-hierarchie.mmd)   | Mermaid: Scope (2 Departments, Member, User außerhalb)              |
| [diagramme/kontext-dokument.mmd](./diagramme/kontext-dokument.mmd)   | Mermaid: Kontext → Dokument                                         |
| [diagramme/rollen-dokument.mmd](./diagramme/rollen-dokument.mmd)     | Mermaid: Rechte / Rollen & Veröffentlichung                         |
| [antwort.md](./antwort.md)                                           | Roh-Notiz Positionierungsdiskussion (Referenz)                      |

## Vergleich (vorbereitet, Landing zurückgestellt)

| Dokument                                                                                   | Inhalt                                               |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| [vergleich/startseite-confluence-docmost.md](./vergleich/startseite-confluence-docmost.md) | Tabellendaten Confluence + Docmost (Landing-Kern)    |
| [vergleich/weitere-docs-plattformen.md](./vergleich/weitere-docs-plattformen.md)           | Mintlify, GitBook, Fern, Read the Docs, KnowledgeOwl |
| [Vergleich-DocsOps-Docmost.md](../platform/Vergleich-DocsOps-Docmost.md)                   | Ausführlicher interner Vergleich                     |

## Sonstiges

| Dokument                                                     | Inhalt                             |
| ------------------------------------------------------------ | ---------------------------------- |
| [Plan-Demo-Oeffentlich.md](../plan/Plan-Demo-Oeffentlich.md) | Demo-Instanz, Domains, Rechtliches |

## Landing lokal

```bash
make landing-dev
```

→ http://localhost:5174 · Demo-CTA: `VITE_DEMO_URL` (siehe `apps/landing/.env.example`)

Weitere Ziele: `make landing-build`, `make landing-preview`, `make lint-landing`
