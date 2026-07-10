# Dokument-Templates – Ideensammlung

**Stand:** Juli 2026  
**Bezug:** [Umsetzungs-Todo §28](Umsetzungs-Todo.md) (Interne Tech-Docs & Dokument-Templates, Phase 2)

Templates sind **Starter-Inhalte** beim Anlegen eines neuen Drafts: vorgegebener **Titel**, kurze **Beschreibung** (Zweck / wann verwenden), **Unterkapitel** mit **Leitfragen** als Ausfüllhilfe. Keine eigenen Entitäten in v1; Zuordnung zu Kontext-Typ optional (Prozess vs. Projekt).

**Produkt-Sprache (UI):** Englisch für Template-Namen und Platzhalter im Editor.  
**Doku & Autoren-Hilfe:** Deutsch-Englisch-Mapping unten – für Help-Texte, Picker-Beschreibungen (optional lokalisiert später) und interne Abstimmung.

---

## Deutsch ↔ Englisch (Begriffe & Template-Labels)

| Deutsch (häufig in Firmen)     | UI-Label (EN)            | `templateId` (Vorschlag)   | Verbindlichkeit            | Kurz                                                             |
| ------------------------------ | ------------------------ | -------------------------- | -------------------------- | ---------------------------------------------------------------- |
| Richtlinie                     | Policy                   | `policy`                   | Verbindlich, strategisch   | Was gilt organisationweit – Ziele, Pflichten, Geltung            |
| Standard                       | Standard                 | `standard`                 | Verbindlich, prüfbar       | Messbare Mindestanforderung („so muss es sein“)                  |
| Baseline                       | Baseline                 | `baseline`                 | Verbindlich, konkret       | Ausgangszustand / Mindest-Konfiguration (Security, IT, Qualität) |
| Leitlinie, Richtschnur         | Guideline                | `guideline`                | Empfehlung                 | Soll-Vorgehen; Abweichungen möglich mit Begründung               |
| Verfahren, Arbeitsanweisung    | Procedure                | `procedure`                | Verbindlich, operativ      | Schrittfolge für wiederkehrende Tätigkeit                        |
| Standardarbeitsanweisung (SOP) | Procedure                | `procedure`                | wie Procedure              | SOP = übliches EN-Synonym; kein separates Template nötig         |
| Runbook                        | Runbook                  | `runbook`                  | Verbindlich unter Incident | Reaktiv, zeitkritisch, Störung/Wiederherstellung                 |
| Playbook                       | Playbook                 | `playbook`                 | Verbindlich im Ablauf      | Proaktiv, wiederkehrender Workflow mit Rollen                    |
| Repository-Dokumentation       | Repository documentation | `repository-documentation` | Projektbezogen             | Repo-Überblick für Entwickler:innen                              |

**Hierarchie (typisch, von oben nach unten):**

```
Policy  →  Standard  →  Baseline  →  Guideline  →  Procedure  →  Runbook / Playbook
  │           │              │            │              │              │
 strategisch  messbar    Mindest-      Empfehlung    Schrittfolge    operativ /
              Anforderung  konfiguration              wiederkehrend   incident
```

- **Policy** begründet **Standards**; **Standards** können **Baselines** konkretisieren.
- **Guidelines** unterstützen die Einhaltung, sind aber weicher als Policy/Standard.
- **Procedures** setzen Policy/Standard in wiederholbare Schritte um.
- **Runbooks/Playbooks** sind operative Ausprägungen (Incident vs. wiederkehrender Ablauf).

**UI-Hinweis:** Im Template-Picker nur **englische Labels**; optional Tooltip mit deutschem Begriff aus der Tabelle (z. B. „Policy (Richtlinie)“).

---

## Konzept (gemeinsam)

| Feld            | Inhalt                                                                          |
| --------------- | ------------------------------------------------------------------------------- |
| **Title**       | Template-Name als Dokumenttitel (editierbar)                                    |
| **Description** | 1–2 Sätze im Draft-Intro oder als erster Absatz: wofür das Template gedacht ist |
| **Sections**    | H2-Unterkapitel; je Abschnitt 1–3 Leitfragen als Platzhalter oder Aufzählung    |

Leitfragen sind **Ausfüllhilfen**, keine Pflichtfelder. Autor:in ersetzt sie durch Inhalt oder löscht überflüssige Abschnitte.

### Template-Quellen & Berechtigung

| Quelle                 | Wer pflegt                          | Sichtbarkeit (Ziel)                                |
| ---------------------- | ----------------------------------- | -------------------------------------------------- |
| **Built-in**           | Plattform (Repo/Config)             | Alle Scopes; nicht löschbar                        |
| **Custom (Scope)**     | Scope Lead (Firma, Abteilung, Team) | Nutzer:innen im jeweiligen Geltungsbereich         |
| **Custom (Plattform)** | Admin (`isAdmin`)                   | Organisationsweit oder als Vorlage für alle Scopes |

**Anforderung:** Scope Leads und Admins dürfen **eigene Templates erstellen** (und bearbeiten/löschen), nicht nur Built-ins beim Draft-Anlegen auswählen.

- **Scope Lead:** Templates für den eigenen Geltungsbereich – z. B. Team-Runbook-Vorlage, Abteilungs-Policy-Layout.
- **Admin:** Zusätzlich plattformweite Templates oder Vorlagen, die in mehreren Scopes sichtbar sind.
- **Autor:innen ohne Lead-Rolle:** Templates **verwenden** (bei `canWrite` im Kontext), nicht definieren.

Berechtigung über Permissions-Layer (`isScopeLead`, `isAdmin`) – keine parallele Rollenlogik in Routes.

---

## Prozess-Kontext

### Runbook

|                       |                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**             | `Runbook`                                                                                                                                         |
| **Description**       | Step-by-step guide for responding to a specific incident or operational situation. Use when readers need a reliable sequence under time pressure. |
| **Typischer Einsatz** | Incident, Störung, Wiederherstellung, geplanter Notfall-Schritt                                                                                   |

**Unterkapitel (Leitfragen):**

1. **Purpose & scope**
   - What situation or alert triggers this runbook?
   - What is in scope – and what is explicitly out of scope?

2. **Prerequisites**
   - What access, tools, or permissions are required before starting?
   - Who must be notified before or during execution?

3. **Severity & escalation**
   - How is severity classified?
   - When do you escalate – and to whom?

4. **Procedure**
   - What are the steps in order (numbered)?
   - What is the expected outcome after each critical step?

5. **Verification**
   - How do you confirm the issue is resolved or the system is healthy?
   - What signals or metrics should you check?

6. **Rollback / recovery**
   - What if a step fails or makes things worse?
   - How do you roll back safely?

7. **References**
   - Links to dashboards, related SOPs, architecture docs, or contacts.

---

### Playbook

|                       |                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Title**             | `Playbook`                                                                                                                                                               |
| **Description**       | Structured guide for a recurring operational workflow – proactive, not only incident-driven. Use for repeatable processes that teams execute on a schedule or on demand. |
| **Typischer Einsatz** | Onboarding eines Services, Release-Ablauf, Audit-Vorbereitung, wiederkehrende Wartung                                                                                    |

**Unterkapitel (Leitfragen):**

1. **Purpose & audience**
   - What workflow does this playbook describe?
   - Who executes it – and who approves or reviews the result?

2. **When to use**
   - On what trigger or schedule is this playbook used?
   - When should another document (e.g. runbook, SOP) be used instead?

3. **Roles & responsibilities**
   - Which roles are involved at each stage?
   - Who is accountable for the final outcome?

4. **Preparation**
   - What must be in place before starting (data, access, approvals)?
   - What checklist items apply before day one / before go-live?

5. **Workflow**
   - What are the main phases and steps?
   - What are the decision points or gates between phases?

6. **Quality & acceptance**
   - What does „done“ look like?
   - What evidence or artifacts must be produced?

7. **Exceptions & contacts**
   - What are common exceptions and how are they handled?
   - Who to contact for questions or escalations?

**Abgrenzung Runbook vs. Playbook:** Runbook = eng, reaktiv, oft unter Zeitdruck (Incident). Playbook = breiter, proaktiv, wiederkehrender Ablauf mit Rollen und Gates.

---

### Policy

|                       |                                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**             | `Policy`                                                                                                                                                                     |
| **DE**                | Richtlinie                                                                                                                                                                   |
| **Description**       | Organization-wide rule that defines what must be complied with and why. Use for strategic or regulatory requirements that other documents (standards, procedures) implement. |
| **Typischer Einsatz** | IT-Sicherheit, Datenschutz, Dokumentationspflicht, Nutzungsregeln                                                                                                            |

**Unterkapitel (Leitfragen):**

1. **Purpose**
   - Why does this policy exist – which risk or goal does it address?
   - Which legal, regulatory, or business drivers apply?

2. **Scope**
   - Who and what is covered (roles, systems, locations, data)?
   - What is explicitly excluded?

3. **Policy statements**
   - What are the binding rules (clear, numbered)?
   - What is required vs. forbidden?

4. **Roles & accountability**
   - Who owns this policy – and who enforces it?
   - Which roles must comply?

5. **Compliance & exceptions**
   - How is compliance checked or audited?
   - How can exceptions be requested and approved?

6. **Related documents**
   - Which standards, baselines, guidelines, or procedures implement this policy?

7. **Review & version**
   - How often is this policy reviewed?
   - Who approves changes?

---

### Standard

|                       |                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Title**             | `Standard`                                                                                                                 |
| **DE**                | Standard                                                                                                                   |
| **Description**       | Measurable, mandatory requirement derived from policy. Use when „how much“ or „what exactly“ must be defined and verified. |
| **Typischer Einsatz** | Passwortlänge, Backup-Intervall, Logging-Pflicht, Dokumentationsqualität                                                   |

**Unterkapitel (Leitfragen):**

1. **Purpose & parent policy**
   - Which policy or goal does this standard support?
   - What problem does non-compliance cause?

2. **Scope**
   - Which systems, teams, or document types does this apply to?

3. **Requirements**
   - What must be true (measurable criteria)?
   - What is the minimum acceptable level?

4. **Verification**
   - How do you check compliance (audit, tooling, review)?
   - What evidence is required?

5. **Exceptions**
   - When are deviations allowed – and who approves them?

6. **References**
   - Related baselines, guidelines, procedures, or external norms (ISO, etc.).

---

### Baseline

|                       |                                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**             | `Baseline`                                                                                                                                                          |
| **DE**                | Baseline (Ausgangsbasis, Mindest-Konfiguration)                                                                                                                     |
| **Description**       | Defined minimum configuration or state that systems, environments, or practices must meet. Use for security hardening, golden images, or „approved starting point“. |
| **Typischer Einsatz** | Server-Hardening, Kubernetes-Baseline, Entwicklungsumgebung, Barrierefreiheits-Mindeststand                                                                         |

**Unterkapitel (Leitfragen):**

1. **Purpose**
   - What baseline is being defined – and against which standard or policy?

2. **Scope**
   - Which assets, environments, or teams must meet this baseline?

3. **Baseline configuration**
   - What are the required settings, versions, or controls (checklist)?
   - What is the reference implementation or template?

4. **Deviation handling**
   - How are exceptions documented?
   - What is the process to bring non-compliant items into alignment?

5. **Verification & drift**
   - How often is compliance checked?
   - How is configuration drift detected and remediated?

6. **References**
   - Links to automation (IaC), scans, related standards, or procedures.

---

### Guideline

|                       |                                                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**             | `Guideline`                                                                                                                                                          |
| **DE**                | Leitlinie, Richtschnur                                                                                                                                               |
| **Description**       | Recommended practice that supports policies and standards without mandating a single approach. Use when teams need flexibility but should follow a common direction. |
| **Typischer Einsatz** | Coding style, Dokumentationsstil, Architektur-Empfehlungen, Review-Praxis                                                                                            |

**Unterkapitel (Leitfragen):**

1. **Purpose**
   - What practice does this guideline promote – and why?

2. **Scope & audience**
   - Who should follow this – in which situations?

3. **Recommendations**
   - What is the preferred approach (with examples)?
   - What should be avoided – and why?

4. **Alternatives**
   - When is a different approach acceptable?
   - What must be documented if deviating?

5. **Relation to binding docs**
   - Which policies or standards does this support – without replacing them?

6. **Examples & references**
   - Good examples, anti-patterns, links to tools or templates.

---

### Procedure

|                       |                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**             | `Procedure`                                                                                                                                                 |
| **DE**                | Verfahren, Arbeitsanweisung (SOP)                                                                                                                           |
| **Description**       | Step-by-step instructions for a recurring task. Use when the sequence and checkpoints must be followed consistently (not incident-specific like a runbook). |
| **Typischer Einsatz** | Benutzer anlegen, Release freigeben, Backup prüfen, Dokument veröffentlichen                                                                                |

**Unterkapitel (Leitfragen):**

1. **Purpose & scope**
   - What task does this procedure cover?
   - Which policy, standard, or baseline does it implement?

2. **Roles**
   - Who performs each step – and who approves?

3. **Prerequisites**
   - What access, tools, or prior approvals are required?

4. **Steps**
   - What is the ordered step sequence (numbered)?
   - What is the expected result after each critical step?

5. **Checkpoints & records**
   - Where must results be logged or evidenced?
   - What constitutes completion?

6. **Safety & rollback**
   - What can go wrong – and how to undo or escalate?

7. **References**
   - Related runbooks, playbooks, checklists, or systems.

**Abgrenzung Procedure vs. Runbook vs. Playbook:** Procedure = feste Schrittfolge für Normalbetrieb. Runbook = Incident, Zeitdruck. Playbook = mehrphasiger Workflow mit Gates.

---

## Projekt-Kontext

### Repository documentation

|                       |                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Title**             | `Repository documentation`                                                                                                                             |
| **Description**       | Internal overview of a code repository: purpose, structure, setup, and conventions. Use when onboarding developers or handing over a project codebase. |
| **Typischer Einsatz** | Software-Projekt, Service-Repo, Shared Library                                                                                                         |

**Unterkapitel (Leitfragen):**

1. **Purpose**
   - What does this repository contain – and what business or technical problem does it solve?
   - Who are the primary consumers (teams, services, users)?

2. **Repository structure**
   - How is the codebase organized (top-level folders, main modules)?
   - Where do config, infrastructure, and docs live?

3. **Getting started**
   - What are the prerequisites (runtime, tools, credentials)?
   - How do you clone, install dependencies, and run locally?

4. **Build, test & deploy**
   - How do you build and run tests?
   - How does deployment work – and which environments exist?

5. **Conventions**
   - Branching, naming, and commit conventions?
   - Code review and merge expectations?

6. **Configuration & secrets**
   - Which environment variables or config files matter?
   - Where are secrets managed – never commit what?

7. **Operations & ownership**
   - Who maintains this repo – and who is on-call?
   - Links to runbooks, architecture docs, or issue trackers.

---

## Weitere Kandidaten (noch ohne Detail-Gliederung)

| Template (EN)         | DE                            | Kontext           | Kurz                       |
| --------------------- | ----------------------------- | ----------------- | -------------------------- |
| Checklist             | Checkliste                    | Prozess / Projekt | Abhakbare Schritte         |
| ADR                   | ADR / Architekturentscheidung | Projekt           | Entscheidung dokumentieren |
| Architecture overview | Architekturübersicht          | Projekt           | Systemkontext, Komponenten |
| Meeting notes         | Protokoll                     | Projekt           | Besprechung, Action Items  |
| Post-mortem           | Post-Mortem                   | Projekt           | Incident-Nachbereitung     |

---

## Umsetzung (offen)

Siehe [Umsetzungs-Todo §28b](Umsetzungs-Todo.md):

- Template-Definition (JSON/Blocks pro `templateId`); Built-in vs. Custom in DB oder Scope-gebundener Speicher
- UI: Auswahl im New-Document-Flow; Kurzbeschreibung in Picker
- **Custom templates:** UI zum Anlegen/Bearbeiten für Scope Leads (eigener Scope) und Admins (plattformweit)
- Filter optional nach Kontext-Typ (Prozess: Policy … Runbook; Projekt: Repository documentation, ADR …)
- Erste Implementierung: Built-in Governance-Kern plus **Custom-Template-CRUD** für Leads/Admins
