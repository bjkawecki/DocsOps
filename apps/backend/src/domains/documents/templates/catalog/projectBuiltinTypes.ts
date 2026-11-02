import type { BuiltinDocumentType } from '../builtinDocumentTemplateTypes.js';
import { t } from './builtinTemplateHelpers.js';

/** Project-scoped built-in types: adr, architecture-overview, post-mortem. */
export const PROJECT_BUILTIN_TYPES: readonly BuiltinDocumentType[] = [
  t(
    'adr',
    'ADR',
    'Architekturentscheidung',
    'An architecture decision record (ADR) captures one significant technical choice, the context that forced it, and the consequences and alternatives. It is a durable decision log so teams do not reopen settled debates without new information. Use this type for a single decision with lasting impact – not for a full system map or meeting minutes.',
    'Ein Architecture Decision Record (ADR) hält eine bedeutende technische Entscheidung, den erzwungenen Kontext sowie Folgen und Alternativen fest. Es ist ein dauerhaftes Entscheidungslog, damit Teams geklärte Debatten ohne neue Informationen nicht neu aufrollen. Nutze diesen Typ für eine einzelne Entscheidung mit nachhaltiger Wirkung – nicht für eine komplette Systemkarte oder Meeting-Protokolle.',
    'project',
    'ADR: choose primary data store',
    'ADR: primären Datenspeicher wählen',
    [
      {
        heading: 'Status',
        prompts: [
          'Record the decision status: proposed, accepted, deprecated, or superseded (and by what, if relevant).',
        ],
      },
      {
        heading: 'Context & decision',
        prompts: [
          'Describe the problem, forces, and constraints that led to this decision, then state clearly what was decided.',
        ],
      },
      {
        heading: 'Consequences',
        prompts: [
          'Explain what becomes easier or harder as a result, and list follow-up work that the decision implies.',
        ],
      },
      {
        heading: 'Alternatives',
        prompts: [
          'Summarize the options that were considered and rejected, with enough rationale that future readers do not reopen settled debate without new information.',
        ],
      },
    ],
    [
      {
        heading: 'Status',
        prompts: [
          'Halte den Entscheidungsstatus fest: vorgeschlagen, akzeptiert, veraltet oder ersetzt (und wodurch, falls relevant).',
        ],
      },
      {
        heading: 'Kontext & Entscheidung',
        prompts: [
          'Beschreibe Problem, Kräfte und Constraints, die zur Entscheidung führten, und formuliere klar, was entschieden wurde.',
        ],
      },
      {
        heading: 'Konsequenzen',
        prompts: [
          'Erkläre was dadurch leichter oder schwerer wird, und liste Folgearbeiten, die die Entscheidung nach sich zieht.',
        ],
      },
      {
        heading: 'Alternativen',
        prompts: [
          'Fasse geprüfte und verworfene Optionen mit genug Begründung zusammen, damit künftige Leser ohne neue Infos keine geklärte Debatte neu eröffnen.',
        ],
      },
    ]
  ),
  t(
    'architecture-overview',
    'Architecture overview',
    'Architekturübersicht',
    'An architecture overview is a living map of a product or initiative: context, main components, data, and integrations. It orients newcomers and operators to how the system fits together at a glance. Use this type for the current big picture; record individual trade-off decisions as ADRs and keep volatile ops detail in runbooks or procedures.',
    'Eine Architekturübersicht ist eine lebende Karte eines Produkts oder einer Initiative: Kontext, Hauptkomponenten, Daten und Integrationen. Sie orientiert Neue und Operatoren, wie das System zusammenspielt. Nutze diesen Typ für das aktuelle Gesamtbild; einzelne Trade-offs als ADRs, volatile Ops-Details in Runbooks oder Verfahren.',
    'project',
    'Architecture overview: system landscape',
    'Architekturübersicht: Systemlandschaft',
    [
      {
        heading: 'Context & containers',
        prompts: [
          'Describe the system, its users, and external actors. List the main runtime units (services, apps, workers) and each unit’s responsibilities so newcomers can orient quickly.',
        ],
      },
      {
        heading: 'Data & integrations',
        prompts: [
          'Explain which data stores matter, how data flows, and which integrations or external systems are in play.',
        ],
      },
      {
        heading: 'Cross-cutting',
        prompts: [
          'Cover auth, observability, and deployment topology at a level that helps operators and developers without duplicating every ADR.',
        ],
      },
      {
        heading: 'References',
        prompts: [
          'Link related ADRs, runbooks, and repository or product docs that hold deeper or more volatile detail.',
        ],
      },
    ],
    [
      {
        heading: 'Kontext & Container',
        prompts: [
          'Beschreibe das System, Nutzer und externe Akteure. Liste die wichtigsten Laufzeiteinheiten (Services, Apps, Worker) und deren Verantwortlichkeiten, damit Neue sich schnell orientieren.',
        ],
      },
      {
        heading: 'Daten & Integrationen',
        prompts: [
          'Erkläre relevante Datenspeicher, Datenflüsse und Integrationen bzw. externe Systeme.',
        ],
      },
      {
        heading: 'Querschnittsthemen',
        prompts: [
          'Behandle Auth, Observability und Deployment-Topologie so, dass Operatoren und Entwickler profitieren, ohne jedes ADR zu duplizieren.',
        ],
      },
      {
        heading: 'Referenzen',
        prompts: [
          'Verlinke verwandte ADRs, Runbooks und Repo- oder Produktdokumente mit tieferen oder volatileren Details.',
        ],
      },
    ]
  ),
  t(
    'post-mortem',
    'Post-mortem',
    'Post-Mortem',
    'A post-mortem is a blameless after-action review of an incident: what happened, why, what went well, and which lasting improvements follow. It turns an outage or failure into shared learning with owners for follow-up. Use this type after recovery – during the incident, use a runbook instead.',
    'Ein Post-Mortem ist eine vorwurfsfreie Nachbereitung eines Incidents: was passiert ist, warum, was gut lief und welche nachhaltigen Verbesserungen folgen. Es macht aus Ausfall oder Fehler gemeinsames Lernen mit Verantwortlichen für Follow-ups. Nutze diesen Typ nach der Recovery – während des Incidents besser ein Runbook.',
    'project',
    'Post-mortem: production incident',
    'Post-Mortem: Produktionsvorfall',
    [
      {
        heading: 'Summary & timeline',
        prompts: [
          'Summarize what happened, the impact, and the duration in one short narrative, then list key events with timestamps for the incident arc.',
        ],
      },
      {
        heading: 'Root cause',
        prompts: [
          'Explain the primary cause and the contributing factors that made the incident possible or worse. Prefer blameless, factual language.',
        ],
      },
      {
        heading: 'What went well / improve',
        prompts: [
          'Note strengths in detection, response, and communication. Then list gaps and lasting follow-up actions with clear owners so improvements actually land.',
        ],
      },
      {
        heading: 'References',
        prompts: [
          'Link related runbooks, tickets, and dashboards that support the timeline or follow-up work.',
        ],
      },
    ],
    [
      {
        heading: 'Zusammenfassung & Timeline',
        prompts: [
          'Fasse kurz zusammen was passiert ist, Impact und Dauer; liste danach Schlüsselereignisse mit Zeitstempeln entlang des Incident-Verlaufs.',
        ],
      },
      {
        heading: 'Ursache',
        prompts: [
          'Erkläre die Hauptursache und beitragende Faktoren, die den Incident ermöglicht oder verschlimmert haben. Vorwurfsfrei und faktisch formulieren.',
        ],
      },
      {
        heading: 'Was gut lief / verbessern',
        prompts: [
          'Notiere Stärken in Erkennung, Reaktion und Kommunikation. Dann Lücken und nachhaltige Follow-up-Maßnahmen mit klaren Ownern, damit Verbesserungen ankommen.',
        ],
      },
      {
        heading: 'Referenzen',
        prompts: [
          'Verlinke verwandte Runbooks, Tickets und Dashboards für Timeline oder Follow-up-Arbeit.',
        ],
      },
    ]
  ),
];
