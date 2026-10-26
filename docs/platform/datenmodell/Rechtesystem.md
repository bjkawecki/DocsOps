# DocsOps – Rechtesystem

Einheitliche Beschreibung des Rechtesystems: Konzeption (Grundprinzipien, Units, Rollen) und Rechteableitung (Implementierung canRead/canWrite).

---

## Instanz und Firma (Invariante)

**Eine DocsOps-Instanz betreibt genau eine Firma.** Es gibt kein Multi-Company und keinen Multi-Tenant innerhalb derselben Instanz. Weitere Firmen bedeuten weitere Instanzen, nicht eine zweite `Company` in derselben Datenbank als Produktfeature. Die Admin-UI legt höchstens die erste Firma an; ein weiterer Create ist abgelehnt.

---

## Teil I – Konzeption

### 1. Grundprinzip

Das Rechtesystem basiert auf einer hierarchischen Organisationsstruktur.

- Dokumente gehören **immer** genau einem Kontext (Projekt, Prozess oder Unterkontext) und damit genau einem Bereich (Unternehmen, Abteilung, Team oder persönlicher Bereich).
- Kontexte gehören genau einer organisatorischen Einheit (Unit).

**Prinzipien:**

- **Lesen im Bereich und in Eltern-Bereichen.** Wer einem Bereich zugeordnet ist, liest Kontexte/Dokumente dieses Bereichs und der übergeordneten Bereiche (Team → Abteilung → Unternehmen).
- **Übergeordnete Leads lesen nach unten.** Lead einer übergeordneten Unit liest Kontexte/Dokumente untergeordneter Units.
- **Schreibrechte sind lokal.** (Nur Lead der Owner-Unit oder expliziter Grant.)
- **Keine Quer-Vererbung** zwischen parallelen Units.

---

### 2. Organisationsstruktur (Units)

Die Plattform kennt folgende hierarchische Units:

```
Company
└── Department
    └── Team
```

**Unit:** Organisatorische Ebene mit klarer Zugehörigkeit (Parent-Unit), eigener Ownership, eigenen Lead-Rollen und eigenem Scope. Units bilden eine gerichtete Hierarchie (Baum).

**Nutzerzugehörigkeit:** Jeder Nutzer ist einem Unternehmen zugeordnet. Er kann einer Abteilung dieses Unternehmens angehören und zusätzlich einem Team dieser Abteilung. Gehört er einem Team an, gehört er damit auch zur Abteilung dieses Teams. Persönlicher Scope steht parallel zur Org-Hierarchie.

**Implementierung (Ableitung):** Operative Mitgliedschaft liegt als `TeamMember` (Team ↔ User). Zugehörigkeit zur Abteilung bzw. zum Unternehmen für Leserechte und Sichtbarkeit wird daraus abgeleitet (Team → Abteilung → Unternehmen), ergänzt um Department Lead/Author und Company Lead. Es gibt keine eigene Junction „DepartmentMember“ / „CompanyMember“.

---

### 3. Scope, Kontext und Ownership

Drei Ebenen nicht vermengen:

| Ebene               | Bedeutet                                                                                                | Bedeutet nicht                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Scope** (Bereich) | **Leserecht:** wer Kontexte/Dokumente dieses Bereichs und seiner Eltern-Bereiche liest                  | Zuständigkeit oder „wer verantwortlich ist“; thematische Ablage                                |
| **Kontext**         | **Zugehörigkeit:** wohin Wissen inhaltlich gehört (Prozess oder Projekt; konkreter Kontext = Thema)     | Verantwortung für Freigabe/Publish                                                             |
| **Rollen**          | weitere **Rechte** (Schreiben, Publish, …); darüber u. a. **Verantwortung** (sozial, Hierarchieprinzip) | ersetzt nicht Scope oder Kontext; Verbindlichkeit über Versionen/Publish ist Folge von Rechten |

**Scope** ist der Lese- und Verwaltungsbereich einer Unit (Team-Scope, Department-Scope, Company-Scope, User-Scope).

**Kontextart** (Prozess vs. Projekt) ist die Form des Kontexts (dauerhaftes Arbeitswissen vs. zeitlich gebundenes Vorhaben-Wissen). Die Wahl **zwischen konkreten Kontexten** ist thematisch.

**Ownership** (Owner-Unit eines Kontexts) ordnet den Kontext einem Scope zu und steuert damit die Ableitung lokaler Schreib-/Publish-Rechte des Scope-Leads – nicht die fachliche „Verantwortung“ im Sinne von Zuständigkeit:

- Jeder Kontext hat genau eine Owner-Unit.
- Owner-Unit definiert Schreibrechte (Lead dieser Unit darf schreiben).
- Ownership ist eindeutig (keine Mehrfach-Owner).
- Ownership bestimmt nicht automatisch Leserechte quer.

**Persönliche Kontexte** (User-Scope): Prozesse und Projekte mit Owner = Nutzer (Owner.ownerUserId). Sie sind **standardmäßig privat**; Zugriff nur für den Besitzer oder über explizite Lese-/Schreib-Grants.

**Kontextzuordnung:** Jedes Dokument hat einen Kontext; der Kontext hat genau einen Owner-Bereich. _Implementierung:_ `contextId = null` nur als kurzlebiger Übergang (z. B. Restore eines Dokuments aus einem Kontext im Papierkorb = Abkoppeln, bis neu zugeordnet) – nicht das dauerhafte Produktmodell.

**Trash (Papierkorb):** Soft-gelöschte Dokumente (`deletedAt` gesetzt) sind nur für Nutzer sichtbar, die das Dokument löschen dürfen (canDeleteDocument). Wiederherstellen (Restore) darf derselbe Nutzerkreis. **Kontexte (Variante B):** Beim Soft-Delete eines Kontexts (Process/Project) werden alle zugehörigen Dokumente mitgelöscht (Kaskade). Restore eines Dokuments aus einem Kontext im Papierkorb setzt vorübergehend `contextId = null`, bis das Dokument einem Kontext neu zugeordnet ist.

**Archive:** Archivierte Dokumente (`archivedAt` gesetzt) werden aus normalen Listen ausgeblendet. Archivieren/Entarchivieren (PATCH archivedAt) darf, wer Schreibrecht hat (canWrite). Kontexte (Process/Project) haben ebenfalls `archivedAt`; beim Archivieren kaskadiert der Status auf alle Dokumente des Kontexts.

**Sichtbarkeit Drafts / Trash / Archive (§4b):** Die Tabs Drafts, Trash und Archive werden angezeigt, wenn der Nutzer **Scope-Lead** ist (Company Lead, Department Lead, Team Lead; Rechte gelten nach unten: Company Lead sieht die Tabs auch in Departments/Teams seiner Firma) oder **Wissensmanager** für einen **zugewiesenen** Scope (geplant; keine automatische Vererbung auf nicht zugewiesene Kinder). **Plattform-Admin allein** sieht diese Schreib-Tabs nicht (kein Lead-Workflow). Leser ohne Lead-/Wissensmanager-Rolle sehen diese Tabs nicht. Einträge in **Drafts**, die auf Review oder Freigabe warten, nur für Nutzer mit Schreibrecht (writable). GET /me/trash und GET /me/archive unterstützen die Scopes **personal**, **company**, **department** und **team**; bei fehlendem Zugriff liefern sie eine **leere Liste** (kein 403).

---

### 4. Rollen

Pro Unit (Team, Department, Company) existieren Rollen:

- **Member:** Kann innerhalb der eigenen Unit lesen; kann keine Kontexte erstellen oder verwalten.
- **Lead:** Kann Kontexte innerhalb der eigenen Unit erstellen und Dokumente im eigenen Scope bearbeiten; Schreibrechte nur im eigenen Scope.

**Company-Lead** ist eine Governance-Rolle: Leserecht auf alle Organisations-Kontexte (siehe unten), kein automatisches globales Schreibrecht.

**Plattform-Admin (`isAdmin`):** Technischer Verwaltungsaccount für Installation, Betrieb, Nutzer, Organisationsstruktur (Company/Department/Team anlegen und löschen) und plattformweite Einstellungen (inkl. Document Types/Templates). **Kein** Fach-Schreibaccount: kein `canWrite` auf Dokumente oder Kontexte, kein Anlegen von Prozessen/Projekten/Dokumenten (auch keine context-freien Drafts), kein Publish, kein persönlicher Nutzerspace, kein Author/Lead/Member. **Lesen:** wie ein Firmen-Leser nur die **Company-Unit** und **company-eigene** Kontexte/Dokumente; **nicht** Department-/Team-Scopes oder -Dokumente ohne echte Org-Mitgliedschaft; **nicht** persönliche Kontexte (`ownerUserId`). Org-Struktur-APIs unter `/admin` bleiben davon getrennt. Facharbeit derselben natürlichen Person läuft über einen **zweiten Personen-Account** mit Nutzerrolle. Impersonation ist nur Entwicklungs-/Debug-Hilfsmittel, kein Betriebs-Support-Pfad.

**Wissensmanager (`knowledgeManager`, EN: Knowledge Manager) – geplant:** Fachrolle für strukturiertes Anlegen und Pflegen von Organisationswissen (z. B. Umzug/Aufräumen aus einem Wiki), **ohne** Plattformverwaltung. **Nicht** `isAdmin`, **nicht** Company-/Department-/Team-Lead. Typischerweise ein **unpersönlicher Arbeitsaccount** (wie Admin: kein persönlicher Nutzerspace); eine natürliche Person kann parallel einen normalen Nutzer-Account haben.

- **Scope-Zuweisung (feingliedrig):** Admin weist dem Account eine **explizite Liste** von Bereichen zu – Company und/oder einzelne Departments und/oder einzelne Teams. Keine automatische Vererbung „Company zugewiesen ⇒ alle Teams“; untergeordnete Bereiche nur, wenn sie selbst in der Liste stehen.
- **Rechte in zugewiesenen Scopes:** Lead-äquivalent für **Fachinhalt** – Kontexte (Prozess/Projekt/Unterkontext) und Dokumente lesen, anlegen, bearbeiten, löschen, Publish; Drafts-/Trash-/Archive-Tabs und Pins für diese Scopes. **Nicht** persönliche Kontexte (`ownerUserId`).
- **Nicht:** Nutzer anlegen/löschen, Org-Units (Company/Department/Team) anlegen/löschen, Plattform-Settings, Backup/Migration-Technik, SMTP, Impersonation.
- **Vergabe/Entzug:** nur Plattform-Admin; nach Bootstrap/Migration Scopes streichen oder den Account deaktivieren.

**Eine Rolle pro Account:** Plattform-**Admin** (`isAdmin`) **oder** **Wissensmanager** (`knowledgeManager`) **oder** genau **eine** organisatorische Scope-Rolle (`CompanyLead`, `DepartmentLead`, `TeamLead`, `TeamMember`) – nicht kombinierbar. Team Lead erfordert keine Team-Mitgliedschaft; Lead und Member sind auf Team-Ebene mutual exclusive. Zuordnungs-APIs und Admin-User-`isAdmin`-Grant enforced das per 409 (Analog für `knowledgeManager`).

**Anzeige-Labels (kein Rechtewechsel):** Plattform-Admins können unter Admin → Platform → Roles Singular/Plural-Bezeichnungen für `companyLead`, `departmentLead`, `teamLead`, `teamMember` und (geplant) `knowledgeManager` setzen (eine Sprache für die gesamte Instanz). Capability-Keys und Permissions bleiben unverändert; leere Felder nutzen die i18n-Defaults. Labels erreichen Clients über `GET /api/v1/system/public-config` (`orgRoleLabels`).

---

### 5. Leserechte (Prinzip)

**Regel:** Ein Nutzer darf ein Dokument lesen, wenn er dem Owner-Bereich des Kontexts zugeordnet ist (einschließlich Zuordnung über untergeordnete Bereiche: Team-Mitglied liest auch Abteilungs- und Unternehmens-Kontexte) **oder** Lead einer übergeordneten Unit ist.

**Aus Nutzersicht:** Wer einem Bereich zugeordnet ist, liest die Kontexte/Dokumente dieses Bereichs und der Eltern-Bereiche.

**Beispiele:**

- **Team-Dokument:** Team-Mitglieder lesen; Department-Lead liest; Company-Lead liest. Anderes Department: kein Zugriff.
- **Department-Dokument:** Wer der Abteilung angehört (über Team-Mitgliedschaft in einem Team der Abteilung bzw. als Department Lead/Author), liest; Company-Lead liest.
- **Company-Dokument:** Wer dem Unternehmen zugeordnet ist (über Zugehörigkeit zu Abteilung/Team bzw. als Company Lead), liest.

**Keine Quer-Vererbung:** Team A kann Team B nicht lesen.

**Persönliche Kontexte (ownerUserId):** Immer privat, sofern kein expliziter Lese-Grant. Weder Company Lead noch Department Lead noch Wissensmanager erhalten automatisch Leserecht auf persönliche Prozesse/Projekte.

**Wissensmanager:** Liest nur Kontexte/Dokumente, deren Owner-Scope in seiner zugewiesenen Scope-Liste liegt (keine Lead-Vererbung nach unten über nicht zugewiesene Kinder-Scopes).

---

### 6. Schreibrechte (Prinzip)

Schreibrechte sind nicht vererbbar.

**Regel:** Ein Scope Author darf im **gemeinsamen Lead-Draft** arbeiten, indem er **Inline-Vorschläge** (Track Changes) erstellt — nicht durch direktes Überschreiben des Lead-Kanons. Scope Lead schreibt direkt in den Kanon, löst Vorschläge auf (Accept/Decline) und **published**. Siehe [ADR 004](../adr/004-inline-draft-suggestions.md).

**Scope Author:** Exklusive Stufe neben Member und Lead (Member **oder** Author **oder** Lead pro Team). Team Lead befördert bestehende Team Members zu Authors auf der Team-Seite; Department Lead analog.

**Document Grants:** Nur noch **Read** – für Cross-Scope-Zugriff (externe Teams/Departments). Verwaltung durch Scope Lead im Document-Access-Tab.

**Erstellen und Löschen** (Dokumente anlegen oder löschen, fachliche Kontexte Prozess/Projekt anlegen oder löschen) sind dem **Scope-Lead**, dem **Wissensmanager in zugewiesenen Scopes** (geplant) und dem Owner von persönlichem Prozess/Projekt via ownerUserId vorbehalten. **Admin** legt keine fachlichen Kontexte oder Dokumente an. Scope Authors berechtigen **nicht** zum Anlegen, Löschen oder Publish.

**Beispiel:** Department-Lead liest Team-Dokument (Vererbung), bearbeitet es nicht (kein Team-Author). Ein Team Author im Owner-Team kann Inline-Vorschläge im Draft anlegen; der Lead entscheidet Accept/Decline und published.

---

### 6a. Reader / Writer / Create-Delete

- **Reader:** Expliziter Lese-Grant (GrantRole Read) für Cross-Scope-Zugriff.
- **Author (Scope Author):** TeamAuthor / DepartmentAuthor — Inline-Vorschläge im Lead-Draft (Insert/Delete-Marks); Accept/Decline nur Lead; **nicht** Publish/Create/Delete.
- **Create/Delete/Publish (Fachinhalt):** Scope Lead, Wissensmanager in zugewiesenen Scopes (geplant), persönlicher Owner (nicht Plattform-Admin).

---

### 6b. Freigabe / neue Version (veröffentlicht)

<span id="6b-freigabe-publish"></span>

**Veröffentlichen** bzw. **Freigabe einer neuen Version** (Lead-Draft wird zur nächsten **Published**-Version mit neuem Snapshot) darf die **Leitung des Owner-Bereichs** (Team Lead, Department Lead oder Company Lead der Owner-Unit), der **Wissensmanager**, wenn der Owner-Scope in seiner Zuweisungsliste liegt (geplant), bzw. im persönlichen Bereich der Owner (`ownerUserId`). Autoren und Plattform-Admin nicht. Publish nur wenn **keine pending Inline-Vorschläge** (`pendingSuggestionCount === 0`). Scope Authors erzeugen Inline-Vorschläge; die Freigabe erfolgt durch Publish durch Leitung bzw. Wissensmanager im zugewiesenen Scope. Details siehe [Versionierung als Snapshots + Deltas](../versionierung/Versionierung%20als%20Snapshots%20+%20Deltas.md) und [ADR 004](../adr/004-inline-draft-suggestions.md).

---

### 6c. Kommentare (geplant)

Eine **Kommentar-Sektion** pro Dokument ermöglicht Diskussion und Feedback am Dokument. Es gibt keine separaten Rollen für Kommentare; die Rechte leiten sich vom Dokument ab.

- **Lesen:** Wer das Dokument lesen darf (`canRead`), darf alle Kommentare zu diesem Dokument lesen.
- **Kommentieren (Anlegen, eigene bearbeiten/löschen):** Wer das Dokument lesen darf (`canRead`), darf Kommentare anlegen sowie **eigene** Kommentare bearbeiten und löschen. Kommentar-Rechte gelten damit überall dort, wo Leserechte gelten.
- **Löschen (fremde Kommentare):** Nur **Scope-Lead** des Kontexts des Dokuments (Team Lead, Department Lead, Company Lead der Owner-Unit), **Wissensmanager** bei Owner-Scope in der Zuweisungsliste (geplant) bzw. Owner von persönlichem Prozess/Projekt (ownerUserId) dürfen beliebige Kommentare löschen (Moderation). Plattform-Admin nicht.

Implementierung: `canReadComment(userId, documentId)` = canRead(documentId); `canCreateComment` / `canEditOwnComment` / `canDeleteOwnComment` = canRead(documentId); `canDeleteAnyComment` = canWriteContext(contextId). Datenmodell siehe [Pseudocode §3b](Pseudocode%20Datenmodell.md#3b-kommentar-sektion-geplant) und [Prisma-Schema-Entwurf §9](../../plan/Prisma-Schema-Entwurf.md#9-kommentar-sektion-geplant).

---

### 7. Company-Level (Governance)

Company-Lead besitzt **Leserecht auf alle Kontexte** – mit Ausnahme von persönlichen Kontexten (Prozesse/Projekte mit ownerUserId), die standardmäßig privat sind.

- Leserecht auf alle Prozesse, Projekte und Unterkontexte (unabhängig von Owner-Unit).
- Kein automatisches globales Schreibrecht; Schreiben nur bei Company-Owner-Kontexten oder explizitem Grant.
- Governance-Rolle (Transparenz ermöglichen, Autonomie erhalten).

---

### 8. Designprinzipien und mentales Modell

1. Eindeutige Ownership
2. Leserechte nach oben
3. Keine Quer-Transparenz
4. Schreibrechte lokal (Ausnahme: Wissensmanager nur über **explizite** Scope-Liste, keine implizite Quer-Macht)
5. Company als Governance-Layer
6. Persönliche Kontexte (ownerUserId) standardmäßig privat
7. Fach-Bootstrap ≠ Plattform-Admin: Wissensmanager pflegt Organisationswissen in zugewiesenen Bereichen; Admin betreibt die Instanz

**Mentales Modell:** Team = operative Einheit, Department = koordinierende Einheit, Company = Governance-Ebene. Transparenz nach oben, Autonomie nach unten, keine seitlichen Leaks. Wissensmanager = optionale Fachredaktion mit Auftrag und Scope-Liste, nicht „Chef“ und nicht „Admin“.

**Optional (Ausblick):** Sensible Kontexte können als „restricted“ markiert werden; dann keine automatische Lesevererbung, Zugriff nur über explizite Freigabe.

---

## Teil II – Rechteableitung (Implementierung)

Der Zugriff wird über **explizite Zuweisung** (Grants) und **abgeleitete Rollen** (isAdmin, Knowledge Manager / zugewiesene Scopes, Company Lead, Department Lead, Team Lead, Owner von persönlichem Prozess/Projekt via ownerUserId) bestimmt. Im Schema: DocumentGrantUser, DocumentGrantTeam, DocumentGrantDepartment mit `GrantRole` (Read oder Write); geplant zusätzlich Zuordnung Wissensmanager ↔ Scope-Liste. Technisch: Department Lead = DepartmentLead, Team Lead = TeamLead, Company Lead = CompanyLead, Wissensmanager = `knowledgeManager`.

### Voraussetzungen

- Nutzer mit gesetztem `deletedAt` (Soft Delete) haben keinen Zugriff.
- Die Implementierung nutzt `canRead(userId, documentId)` bzw. `canWrite(userId, documentId)` (Englisch im Code).

---

### Leserecht (canRead)

Ein Nutzer hat Leserecht auf ein Dokument, wenn eine der folgenden Bedingungen zutrifft (in dieser Reihenfolge geprüft):

1. **isAdmin:** Leserecht nur auf Dokumente mit **Company-Owner** (nicht Department-/Team-Owner, nicht persönlich). **Kein** Leserecht auf persönliche Kontexte (`ownerUserId`) und kein Schreibrecht über diese Rolle.

2. **Knowledge Manager (geplant):** Leserecht auf Dokumente, deren Owner-Scope (Company / Department / Team) in der dem Account zugewiesenen Scope-Liste liegt. **Kein** Leserecht auf persönliche Kontexte (`ownerUserId`). Keine automatische Vererbung auf nicht zugewiesene Kind-Scopes.

3. **Company Lead:** Der Nutzer ist Company Lead der Instanz-Firma. **Zielmodell:** Leserecht auf alle Dokumente in Organisations-Kontexten (Prozesse, Projekte, Unterkontexte) – unabhängig davon, ob Owner Company, Department oder Team ist. **Kein** Leserecht auf persönliche Kontexte (Prozesse/Projekte mit ownerUserId; immer privat, sofern kein expliziter Grant).  
   _Hinweis: Aktuell prüft die Implementierung für Company Lead nur Kontexte mit Company-Owner; die Erweiterung auf alle Organisations-Kontexte ist vorgesehen._

4. **Department Lead:** Leserecht auf alle Dokumente in Kontexten, die seiner Abteilung oder einem ihrer Teams als Owner gehören (Prozesse, Projekte, Unterkontexte). Kein Leserecht auf persönliche Kontexte (ownerUserId).

5. **Owner von persönlichem Prozess/Projekt (ownerUserId):** Das Dokument gehört zu einem Prozess oder Projekt, dessen Owner der Nutzer ist (Owner.ownerUserId); dann Leserecht (und Schreibrecht).

6. **Explizite Grants:** Dokument dem Nutzer (DocumentGrantUser Read), einem seiner Teams als Mitglied (DocumentGrantTeam Read) oder seiner Abteilung (DocumentGrantDepartment Read) zugestanden.

Prüfreihenfolge: deletedAt → isAdmin (nur Company-Owner-Read) → Knowledge Manager (zugewiesene Scopes) → Company Lead → Department Lead → Owner persönlicher Kontext (ownerUserId) → explizite Grants.

---

### Schreibrecht (canWrite)

**canWrite** berechtigt zur **Bearbeitung** des Dokuments (z. B. PATCH). **Nicht** zum Löschen des Dokuments – dazu siehe Löschen (Dokument).

Ein Nutzer hat Schreibrecht auf ein Dokument, wenn:

1. **Owner von persönlichem Prozess/Projekt (ownerUserId):** Besitzer des Kontexts; Schreibrecht auf alle Dokumente in diesem Prozess/Projekt.

2. **Knowledge Manager (geplant):** Schreibrecht, wenn der Owner-Scope des Kontexts in der Zuweisungsliste liegt (Lead-äquivalent für Fachinhalt in diesen Scopes).

3. **Scope Author / Scope Lead / Company Lead** nach den lokalen Regeln der Owner-Unit (siehe Teil I).

4. **Explizite Grants:** DocumentGrantUser mit Write; DocumentGrantTeam mit Write nur, wenn Nutzer **Team Lead** dieses Teams ist; DocumentGrantDepartment mit Write für Nutzer dieser Abteilung.

**isAdmin verleiht kein Schreibrecht** auf Dokumente.

---

### Löschen (Dokument)

Ein Nutzer darf ein Dokument (Soft-Delete) nur löschen, wenn er **Scope-Lead** des zugehörigen Kontexts ist, **Knowledge Manager** mit Owner-Scope in der Zuweisungsliste (geplant), bzw. Owner von persönlichem Prozess/Projekt via ownerUserId. **isAdmin** berechtigt nicht zum Löschen von Fachdokumenten. Ein **expliziter Writer-Grant** berechtigt **nicht** zum Löschen. Implementierung: `canDeleteDocument(prisma, userId, documentId)` – entspricht der Prüfung, ob der Nutzer den Kontext schreiben darf (`canWriteContext` auf den Kontext des Dokuments).

---

### Beispiel

Dokument D1 liegt im Projekt P1; Owner von P1 ist Team T1. Zugriffsrechte am Dokument: Leser T1, Schreiber T1 (nur Team Lead von T1 darf schreiben). Nutzer Z ist nur Mitglied von T1 – darf D1 lesen, nicht schreiben. Nutzer M ist Mitglied und Team Lead von T1 – darf D1 lesen und schreiben.

---

### Kontext- und Organisations-Rechte

Zusätzlich zu canRead/canWrite gelten **hierarchische Rechte** für Kontexte und die Organisationsstruktur („Lesen/schreiben“ inkl. Anlegen der Ressource):

- **Admin (isAdmin):** Liest die Company-Unit und company-eigene Kontexte/Dokumente. Legt Company, Department und Team an und löscht sie (Org-Struktur unter `/admin`). **Kein** Anlegen/Schreiben/Löschen fachlicher Prozesse, Projekte oder Dokumente; kein persönlicher Scope; keine Navigation in Department/Team ohne Org-Rolle.

- **Knowledge Manager (geplant):** In **zugewiesenen** Scopes (Company und/oder Departments und/oder Teams) Prozesse und Projekte lesen, schreiben, anlegen, löschen und publishen; kein persönlicher Scope; keine Org-Unit-Verwaltung unter `/admin`.

- **Company Lead:** Darf für seine Company Prozesse und Projekte mit Company-Owner lesen, schreiben und anlegen. (Governance: Zielmodell siehe Teil I – Leserecht auf alle Organisations-Kontexte.)

- **Department Lead:** Darf für sein Department Prozesse und Projekte lesen, schreiben und anlegen. Keine Erstellung/Löschung von Companies, Departments oder Teams.

- **Team Lead:** Darf für sein Team Prozesse und Projekte lesen, schreiben und anlegen.

- **Unterkontexte:** Wer ein Projekt lesen/schreiben darf (Company Lead, Department Lead, Team Lead oder Knowledge Manager je nach Owner/Zuweisung), darf dessen Unterkontexte anlegen, bearbeiten und löschen.

### Pinned

An- und Abpinnen von Einträgen (Dokumente, Prozesse, Projekte) pro Scope (Team, Department, Company) dürfen **Scope-Lead** (Team Lead für Team-Scope, Department Lead für Department-Scope, Company Lead für Company-Scope) sowie **Knowledge Manager**, wenn der Scope zugewiesen ist (geplant). Pins lesen (z. B. im Dashboard anzeigen) dürfen alle, die den jeweiligen Scope sehen (Team-Mitglieder sehen Team-Pins, Department-Mitglieder Department-Pins, usw.). Schema siehe [Prisma-Schema-Entwurf §7 (Pinned)](../../plan/Prisma-Schema-Entwurf.md#7-pinned-geplant).

Dokument-Erstellung (POST) prüft `canWriteContext` (Scope-Lead / Knowledge Manager in zugewiesenem Scope / persönlicher Owner). Dokument-Löschen (DELETE) prüft `canDeleteDocument` (dieselbe Gruppe, nicht Writer-Grant, nicht Admin).

Die Implementierung liegt unter `apps/backend/src/domains/*/permissions/` (canRead, canWrite, canDeleteDocument, canReadContext, canWriteContext, requireDocumentAccess). Dokument-Routen nutzen die Middleware `requireDocumentAccess('read'|'write')` bzw. für DELETE die Prüfung `canDeleteDocument`; Kontext-Routen prüfen canReadContext/canWriteContext (Kern-API Abschnitt 5).
