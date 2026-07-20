# DocsOps – konzeptionelle Zusammenfassung

Kurzfassung des Produktmodells. Details: [Rechtesystem](datenmodell/Rechtesystem.md), [Versionierung](versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md), [ADR 004](adr/004-inline-draft-suggestions.md). These und Abgrenzung: [Positionierung-und-Landing](../marketing/Positionierung-und-Landing.md).

## 1. Grundidee

- Interne Dokumentationsplattform mit **Organisationshierarchie im Produkt** (Firma → Abteilung → Team).
- DocsOps **trennt Zusammenarbeit von Veröffentlichung:** Autoren arbeiten am Entwurf bzw. mit Vorschlägen; die **Leitung des Geltungsbereichs** veröffentlicht. Leser sehen den **offiziellen, versionierten Stand** – nicht den laufenden Entwurf.
- Zwei Wissensarten: **Prozess** („wie wir arbeiten“) und **Projekt** („woran wir arbeiten“ / Ist-Stand).
- Dokumente gehören in der Regel genau einem **Kontext** (Prozess, Projekt oder Unterkontext); Ausnahme: kontextfreie Drafts (siehe §3.4).
- **Ownership** bestimmt Verantwortlichkeit und lokale Schreib-/Publish-Rechte; **Leserechte** werden nach oben vererbt. Keine Quer-Vererbung zwischen parallelen Units.

---

## 2. Organisationsstruktur (Scope)

```
Company
└── Department
    └── Team
        └── User (Mitgliedschaft)

User-Scope (persönlich) – parallel zur Org-Hierarchie
```

| Ebene     | Rolle (engl. in API/UI) | Kurz                                                       |
| --------- | ----------------------- | ---------------------------------------------------------- |
| Firma     | Company                 | Oberste Organisationseinheit; kann Kontexte besitzen       |
| Abteilung | Department              | Enthält Teams; kann Prozesse/Projekte besitzen             |
| Team      | Team                    | Operative Einheit; kann Prozesse/Projekte besitzen         |
| Nutzer    | User                    | Mitgliedschaft in Teams; optional persönlicher Owner-Scope |

**Rollen (eine organisatorische Scope-Rolle pro Person, oder Plattform-Admin):**

- **Member** – liest im eigenen Scope (nach Vererbungsregeln); keine Kontext-/Dokument-Anlage.
- **Scope Author** (Team Author / Department Author) – arbeitet am Lead-Draft nur über **Inline-Vorschläge**; kein Create/Delete/Publish.
- **Scope Lead** (Team / Department / Company Lead) – Create/Delete im Scope, Lead-Draft direkt bearbeiten, Vorschläge Accept/Decline, **Publish**.
- **Admin** – Plattformverwaltung; typischerweise volle Dokumentrechte.

Details und Ausschlüsse (Lead vs. Member, Exclusive Roles): [Rechtesystem §4](datenmodell/Rechtesystem.md).

---

## 3. Kontexte

Jeder Prozess/Projekt hat genau einen **Owner** (Company, Department, Team oder Nutzer).

### 3.1 Prozess

- Langlebig („wie wir arbeiten“): Richtlinien, Abläufe, Standards.
- Dokumente hängen direkt am Prozess.
- Unterkontexte selten nötig.

### 3.2 Projekt

- Zeitlich begrenzt („woran wir arbeiten“); kann archiviert werden.
- Optional **Unterkontexte** (z. B. Protokolle, Module) unter dem Projekt.
- Dokumente am Projekt oder am Unterkontext.

### 3.3 Persönlicher Bereich (User-Scope)

- Prozesse/Projekte mit Owner = Nutzer (`ownerUserId`).
- **Standardmäßig privat;** Zugriff für andere nur über explizite Grants.
- Weder Company- noch Department-Lead erhalten automatisch Leserecht.

### 3.4 Dokumente

- Einzelne inhaltliche Einheit im Kontext (oder als **kontextfreier Draft**: `contextId` null, nur unveröffentlicht; Lesen/Schreiben für Ersteller und explizite Grants; Publish erst nach Kontext-Zuweisung).
- Inhalt als **Block-JSON** (Editor TipTap); Publish erzeugt einen Snapshot ohne Suggestion-Marks. Siehe [ADR 002](adr/002-block-schema-v1-inline-marks.md), [ADR 004](adr/004-inline-draft-suggestions.md).
- Explizite **Document Grants** vor allem **Read** für Cross-Scope-Zugriff (externe Teams/Abteilungen/Nutzer); Verwaltung durch den Scope Lead.

---

## 4. Zugriffsrechte (Prinzip)

| Prinzip                | Bedeutung                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Leserechte nach oben   | Member der Owner-Unit **oder** Lead einer übergeordneten Unit darf lesen                                           |
| Schreibarbeit lokal    | Lead der Owner-Unit (direkt) bzw. Scope Author (Inline-Vorschläge); kein Quer-Schreiben                            |
| Keine Quer-Vererbung   | Team A liest Team B nicht ohne Grant                                                                               |
| Company als Governance | Company Lead: Leserecht auf Organisations-Kontexte (nicht persönliche); kein globales Schreiben                    |
| Publish nur Lead       | Neue veröffentlichte Version nur Scope Lead / Admin / persönlicher Owner; nur wenn keine offenen Inline-Vorschläge |

**Nicht mehr gültig:** „Superuser schreibt alles im Team“ / „Schreibrechte nur über Superuser“. Das aktuelle Modell ist Lead + Scope Author + Read-Grants.

Vollständige Ableitung (`canRead` / `canWrite` / Publish): [Rechtesystem](datenmodell/Rechtesystem.md).

---

## 5. Ownership vs. Zugriff

|         | Ownership                                                     | Zugriff                                                          |
| ------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Frage   | Wer ist organisatorisch verantwortlich?                       | Wer darf lesen / am Draft arbeiten / veröffentlichen?            |
| Träger  | Genau eine Owner-Unit (Company, Department, Team) oder Nutzer | Vererbung + Rollen + Grants                                      |
| Wirkung | Scope für Lead/Author, Create/Delete/Publish                  | Lesen für Members/übergeordnete Leads; Cross-Scope nur per Grant |

Vorteil: klare Verantwortlichkeit, vorhersehbare Transparenz nach oben, Autonomie nach unten.

---

## 6. Designprinzipien

1. Dokumente gehören in der Regel genau einem Kontext (Ausnahme: kontextfreie Drafts).
2. Struktur bestimmt Ownership; Leserechte werden nach oben vererbt, Schreiben und Publish bleiben lokal.
3. Teams sind operative Einheiten; keine impliziten Rechte quer zu parallelen Teams.
4. Kontexte: Prozesse (dauerhaft), Projekte (zeitlich, Unterkontexte möglich), persönliche Kontexte (privat).
5. Zusammenarbeit ≠ Veröffentlichung: Authors vorschlagen, Lead entscheidet und published.
6. Unterkontexte nur wo Organisation oder Filterung es braucht.
7. Struktur + Kontext + Rechte bilden ein konsistentes, vorhersehbares System.

---

## 7. Weiterlesen

| Thema                    | Dokument                                                                       |
| ------------------------ | ------------------------------------------------------------------------------ |
| Rechte im Detail         | [Rechtesystem](datenmodell/Rechtesystem.md)                                    |
| Datenmodell (Pseudocode) | [Pseudocode Datenmodell](datenmodell/Pseudocode%20Datenmodell.md)              |
| Publish / Snapshots      | [Versionierung](versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md) |
| Inline-Suggestions       | [ADR 004](adr/004-inline-draft-suggestions.md)                                 |
| UI-Routen                | [Intranet-Dashboard](ui-architektur/Intranet-Dashboard.md)                     |
| Positionierung           | [Positionierung-und-Landing](../marketing/Positionierung-und-Landing.md)       |
| Umsetzung                | [Umsetzungs-Todo](../plan/Umsetzungs-Todo.md)                                  |
