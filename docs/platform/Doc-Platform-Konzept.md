# DocsOps – konzeptionelle Zusammenfassung

Kurzfassung des Produktmodells. Details: [Rechtesystem](datenmodell/Rechtesystem.md), [Versionierung](versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md), [ADR 004](adr/004-inline-draft-suggestions.md). These und Abgrenzung: [Positionierung-und-Landing](../marketing/Positionierung-und-Landing.md).

## 1. Grundidee

- **Eine Instanz = eine Firma.** Kein Multi-Company innerhalb derselben Installation; Details: [Rechtesystem – Instanz und Firma](datenmodell/Rechtesystem.md#instanz-und-firma-invariante).
- Interne Dokumentationsplattform mit **Organisationshierarchie im Produkt** (Firma → Abteilung → Team).
- DocsOps **trennt Zusammenarbeit von Veröffentlichung:** Autoren arbeiten am Entwurf bzw. mit Vorschlägen; die **Leitung des Geltungsbereichs** veröffentlicht. Leser sehen den **offiziellen, versionierten Stand** – nicht den laufenden Entwurf.
- Zwei **Kontextarten:** **Prozess** („wie wir arbeiten“, dauerhaft) und **Projekt** („woran wir arbeiten“ / Ist-Stand, zeitlich gebunden). Die Wahl der Kontextart ist formbezogen; die Wahl zwischen konkreten Kontexten ist thematisch.
- Dokumente gehören **immer** genau einem **Kontext** (Prozess, Projekt oder Unterkontext) und damit genau einem **Bereich** (Unternehmen, Abteilung, Team oder persönlicher Bereich).
- **Scope (Bereich)** steuert **Leserecht**: wer die Kontexte und Dokumente eines Bereichs (und seiner übergeordneten Bereiche) lesen darf. **Kontext** steuert **Zugehörigkeit** des Wissens. **Rollen** steuern darüber hinausgehende **Rechte** (Schreiben, Publish, …); über Rechte wird u. a. **Verantwortung** gesteuert (Hierarchieprinzip). Verantwortung liegt damit bei den Rollen, nicht bei Scope oder Kontext allein.
- **Ownership** (Owner-Unit eines Kontexts) ordnet den Kontext einem Scope zu und steuert lokale Schreib-/Publish-Rechte des Scope-Leads. Keine Quer-Vererbung zwischen parallelen Units.

---

## 2. Organisationsstruktur (Scope)

Scope/Bereich = **Leserahmen** in der Organisationshierarchie (wer Kontexte/Dokumente dieses Bereichs und der Eltern-Bereiche liest) – nicht „Zuständigkeit“ und nicht thematische Ablage (das leisten Kontexte).

```
Company
└── Department
    └── Team

User-Scope (persönlich) – parallel zur Org-Hierarchie
```

| Ebene     | Rolle (engl. in API/UI) | Kurz                                                         |
| --------- | ----------------------- | ------------------------------------------------------------ |
| Firma     | Company                 | Oberste Organisationseinheit; kann Kontexte besitzen         |
| Abteilung | Department              | Enthält Teams; kann Prozesse/Projekte besitzen               |
| Team      | Team                    | Operative Einheit; kann Prozesse/Projekte besitzen           |
| Nutzer    | User                    | Zugehörigkeit siehe unten; optional persönlicher Owner-Scope |

**Nutzerzugehörigkeit:** Jeder Nutzer ist einem Unternehmen zugeordnet. Er kann einer Abteilung dieses Unternehmens angehören und zusätzlich einem Team dieser Abteilung. Gehört er einem Team an, gehört er damit auch zur Abteilung dieses Teams.

**Rollen (eine Account-Rolle: Plattform-Admin, Wissensmanager, oder genau eine organisatorische Scope-Rolle):**

- **Member** – liest im eigenen Scope (nach Vererbungsregeln); keine Kontext-/Dokument-Anlage.
- **Scope Author** (Team Author / Department Author) – arbeitet am Lead-Draft nur über **Inline-Vorschläge**; kein Create/Delete/Publish.
- **Scope Lead** (Team / Department / Company Lead) – Create/Delete im Scope, Lead-Draft direkt bearbeiten, Vorschläge Accept/Decline, **Publish**.
- **Wissensmanager** (`knowledgeManager`, EN: Knowledge Manager) – Fachrolle mit **explizit zugewiesenen** Bereichen (Company und/oder Departments und/oder Teams); in diesen Scopes Lead-äquivalent für Fachinhalt (Anlegen/Schreiben/Publish), ohne Plattformverwaltung; typischerweise unpersönlicher Arbeitsaccount; kein persönlicher Space.
- **Admin** – technischer Verwaltungsaccount (Nutzer, Org-Struktur, Plattform); liest Organisationsdokumente der Instanz-Firma; **kein** Schreiben/Anlegen von Fachdokumenten oder persönlichem Space. Facharbeit über einen zweiten Personen-Account.

Details und Ausschlüsse (Lead vs. Member, Exclusive Roles, Scope-Liste Wissensmanager): [Rechtesystem §4](datenmodell/Rechtesystem.md).

---

## 3. Kontexte

Kontexte bestimmen die **Zugehörigkeit** von Wissen (wohin es inhaltlich gehört) – nicht die Verantwortung für Veröffentlichung. Jeder Prozess/Projekt hat genau einen **Owner** (Company, Department, Team oder Nutzer), der den Kontext in einen Scope legt.

### 3.1 Prozess (Kontextart)

- Langlebig („wie wir arbeiten“): Richtlinien, Abläufe, Standards.
- Dokumente hängen direkt am Prozess.
- Unterkontexte selten nötig.

### 3.2 Projekt (Kontextart)

- Zeitlich begrenzt („woran wir arbeiten“); kann archiviert werden.
- Optional **Unterkontexte** (z. B. Protokolle, Module) unter dem Projekt.
- Dokumente am Projekt oder am Unterkontext.

### 3.3 Persönlicher Bereich (User-Scope)

- Prozesse/Projekte mit Owner = Nutzer (`ownerUserId`).
- **Standardmäßig privat;** Zugriff für andere nur über explizite Grants.
- Weder Company- noch Department-Lead erhalten automatisch Leserecht.

### 3.4 Dokumente

- Einzelne inhaltliche Einheit **im Kontext**; der Kontext gehört genau einem Bereich.
- Inhalt als **Block-JSON** (Editor TipTap); Publish erzeugt einen Snapshot ohne Suggestion-Marks. Siehe [ADR 002](adr/002-block-schema-v1-inline-marks.md), [ADR 004](adr/004-inline-draft-suggestions.md).
- Explizite **Document Grants** vor allem **Read** für Cross-Scope-Zugriff (externe Teams/Abteilungen/Nutzer); Verwaltung durch den Scope Lead.
- _Implementierung:_ Kurzlebige `contextId = null`-Zustände (z. B. Restore aus Papierkorb-Kontext) sind Übergang, nicht das Produktmodell.

---

## 4. Zugriffsrechte (Prinzip)

| Prinzip                         | Bedeutung                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Lesen im Bereich + Eltern       | Wer einem Bereich zugeordnet ist, liest dessen Kontexte/Dokumente und die der übergeordneten Bereiche                                         |
| Lesen durch übergeordnete Leads | Lead einer übergeordneten Unit liest Kontexte/Dokumente untergeordneter Units                                                                 |
| Schreibarbeit lokal             | Lead der Owner-Unit (direkt), Wissensmanager in **zugewiesenen** Scopes bzw. Scope Author (Inline-Vorschläge); kein implizites Quer-Schreiben |
| Keine Quer-Vererbung            | Team A liest Team B nicht ohne Grant                                                                                                          |
| Company als Governance          | Company Lead: Leserecht auf Organisations-Kontexte (nicht persönliche); kein globales Schreiben                                               |
| Publish Bereichsleitung / KM    | Neue Version: Leitung des Owner-Bereichs oder Wissensmanager bei zugewiesenem Scope (persönlich: Eigentümer); keine offenen Inline-Vorschläge |

**Nicht mehr gültig:** „Superuser schreibt alles im Team“ / „Schreibrechte nur über Superuser“ / „Admin pflegt alle Fachdokumente“. Fach-Bootstrap und Aufräumen: **Wissensmanager** mit Scope-Liste; Alltag: Lead + Scope Author + Read-Grants.

Vollständige Ableitung (`canRead` / `canWrite` / Publish): [Rechtesystem](datenmodell/Rechtesystem.md).

---

## 5. Scope, Ownership und Zugriff

|         | Scope (Leserecht)                                              | Ownership (Kontext → Scope)                    | Rollen (weitere Rechte)                                         |
| ------- | -------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Frage   | Wer liest Kontexte/Dokumente dieses Bereichs (und der Eltern)? | Welchem Scope ist der Kontext zugeordnet?      | Wer darf am Draft arbeiten / veröffentlichen / steuern?         |
| Träger  | Unit (Company, Department, Team) oder User-Scope               | Genau eine Owner-Unit oder Nutzer              | Lead / Author / Member / Wissensmanager (Scope-Liste) + Grants  |
| Wirkung | Lesen im eigenen Bereich und in übergeordneten Bereichen       | lokale Schreib-/Publish-Rechte des Scope-Leads | Cross-Scope-Lesen nur per Grant; Schreiben lokal bzw. KM-Scopes |

**Rollen** bündeln Rechte (technisch). Daraus folgt Verantwortung (sozial), gestaffelt nach Hierarchie. Publish/Versionen setzen Verbindlichkeit um; das ist eine Folge von Rechten, nicht der alleinige Zweck von Rollen.

---

## 6. Designprinzipien

1. Dokumente gehören immer genau einem Kontext und damit einem Bereich.
2. Struktur bestimmt Ownership; Lesen gilt im Bereich und in Eltern-Bereichen (sowie für übergeordnete Leads nach unten), Schreiben und Publish bleiben lokal.
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
