import type { BuiltinDocumentType } from '../builtinDocumentTemplateTypes.js';
import { t } from './builtinTemplateHelpers.js';

/** Process-scoped built-in types: policy, standard, guideline, procedure, runbook. */
export const PROCESS_BUILTIN_TYPES: readonly BuiltinDocumentType[] = [
  t(
    'policy',
    'Policy',
    'Richtlinie',
    'A policy is a binding organizational rule that states what must be complied with and why. It sets intent and obligations at a strategic level, names who and what is in scope, and leaves measurable detail to standards or concrete steps to procedures. Use this type when readers need a durable “must / must not” decision that other documents implement.',
    'Eine Richtlinie ist eine verbindliche Organisationsregel: was eingehalten werden muss und warum. Sie setzt Absicht und Verpflichtungen auf strategischer Ebene, benennt wer und was im Geltungsbereich liegt, und überlässt messbare Details Standards oder konkrete Schritte Verfahren. Nutze diesen Typ, wenn Leser eine dauerhafte „muss / darf nicht“-Entscheidung brauchen, die andere Dokumente umsetzen.',
    'process',
    'Policy: information security',
    'Richtlinie: Informationssicherheit',
    [
      {
        heading: 'Purpose & scope',
        prompts: [
          'State why this policy exists: the risk, goal, or obligation it addresses, and which legal, regulatory, or business drivers apply. Define who and what is covered (roles, systems, locations, data) and what is explicitly out of scope.',
        ],
      },
      {
        heading: 'Policy statements',
        prompts: [
          'Write the binding rules in clear, preferably numbered language. Distinguish what is required from what is forbidden so readers can apply the policy without guessing intent.',
        ],
      },
      {
        heading: 'Roles, compliance & exceptions',
        prompts: [
          'Name who owns the policy, who enforces it, and which roles must comply. Describe how compliance is checked or audited, and how exceptions are requested, approved, time-boxed, and recorded.',
        ],
      },
      {
        heading: 'Related docs & review',
        prompts: [
          'List the standards, guidelines, or procedures that implement this policy. Note how often the policy is reviewed and who approves changes or a new version.',
        ],
      },
    ],
    [
      {
        heading: 'Zweck & Geltungsbereich',
        prompts: [
          'Beschreibe, warum diese Richtlinie existiert: Risiko, Ziel oder Verpflichtung, sowie rechtliche, regulatorische oder geschäftliche Treiber. Definiere wer und was betroffen ist (Rollen, Systeme, Standorte, Daten) und was ausdrücklich außerhalb liegt.',
        ],
      },
      {
        heading: 'Regelaussagen',
        prompts: [
          'Formuliere die verbindlichen Regeln klar, möglichst nummeriert. Unterscheide Gebote und Verbote, damit Leser die Richtlinie ohne Rätselraten anwenden können.',
        ],
      },
      {
        heading: 'Rollen, Compliance & Ausnahmen',
        prompts: [
          'Nenne wer die Richtlinie besitzt, wer sie durchsetzt und welche Rollen sie einhalten müssen. Beschreibe Prüfung/Audit sowie Antrag, Genehmigung, Befristung und Dokumentation von Ausnahmen.',
        ],
      },
      {
        heading: 'Verwandte Dokumente & Review',
        prompts: [
          'Liste Standards, Leitlinien oder Verfahren auf, die diese Richtlinie umsetzen. Notiere Review-Intervall und wer Änderungen oder neue Versionen freigibt.',
        ],
      },
    ]
  ),
  t(
    'standard',
    'Standard',
    'Standard',
    'A standard is a mandatory, measurable requirement that turns policy intent into criteria you can check. It answers “how much” or “what exactly” in testable language so audits, reviews, or tooling can verify compliance without reinterpretation. Use this type when a rule must be concrete and auditable, not only directional.',
    'Ein Standard ist eine verbindliche, messbare Anforderung, die Richtlinienabsicht in prüfbare Kriterien übersetzt. Er beantwortet „wie viel“ oder „was genau“ so, dass Audits, Reviews oder Tools Compliance ohne Neuinterpretation prüfen können. Nutze diesen Typ, wenn eine Regel konkret und auditierbar sein muss, nicht nur richtungsweisend.',
    'process',
    'Standard: password length',
    'Standard: Passwortlänge',
    [
      {
        heading: 'Purpose & scope',
        prompts: [
          'Explain which policy or goal this standard supports and why non-compliance matters. State which systems, teams, products, or document types it applies to.',
        ],
      },
      {
        heading: 'Requirements',
        prompts: [
          'Define the measurable criteria that must be true and the minimum acceptable level. Prefer testable wording so audits and tooling can check compliance without interpretation.',
        ],
      },
      {
        heading: 'Verification & exceptions',
        prompts: [
          'Describe how compliance is verified (audit, tooling, review) and what evidence is required. Say when deviations are allowed, who approves them, and how they are tracked to closure.',
        ],
      },
      {
        heading: 'References',
        prompts: [
          'Point to related guidelines, procedures, or external norms (for example ISO) that readers need alongside this standard.',
        ],
      },
    ],
    [
      {
        heading: 'Zweck & Geltungsbereich',
        prompts: [
          'Erkläre, welche Richtlinie oder welches Ziel dieser Standard unterstützt und warum Nicht-Einhaltung relevant ist. Nenne betroffene Systeme, Teams, Produkte oder Dokumenttypen.',
        ],
      },
      {
        heading: 'Anforderungen',
        prompts: [
          'Definiere die messbaren Kriterien und das Mindestniveau. Formuliere prüfbar, damit Audits und Tools ohne Interpretation auskommen.',
        ],
      },
      {
        heading: 'Prüfung & Ausnahmen',
        prompts: [
          'Beschreibe, wie Compliance geprüft wird (Audit, Tooling, Review) und welche Nachweise nötig sind. Sag wann Abweichungen erlaubt sind, wer sie genehmigt und wie sie bis zum Abschluss verfolgt werden.',
        ],
      },
      {
        heading: 'Referenzen',
        prompts: [
          'Verweise auf verwandte Leitlinien, Verfahren oder externe Normen (z. B. ISO), die Leser neben diesem Standard brauchen.',
        ],
      },
    ]
  ),
  t(
    'guideline',
    'Guideline',
    'Leitlinie',
    'A guideline recommends a preferred way of working without mandating a single approach. It helps teams align on good practice while still allowing reasoned deviation. Use this type when you want shared norms and examples, not a binding rule that must always be followed.',
    'Eine Leitlinie empfiehlt eine bevorzugte Arbeitsweise, ohne einen einzigen Ansatz vorzuschreiben. Sie hilft Teams bei guter Praxis und lässt begründete Abweichungen zu. Nutze diesen Typ für gemeinsame Normen und Beispiele, nicht für eine stets verbindliche Regel.',
    'process',
    'Guideline: code review practice',
    'Leitlinie: Code-Review-Praxis',
    [
      {
        heading: 'Purpose & audience',
        prompts: [
          'Describe the practice this guideline promotes and why it helps. Say who should follow it and in which situations it applies.',
        ],
      },
      {
        heading: 'Recommendations',
        prompts: [
          'Explain the preferred approach with concrete examples, and call out anti-patterns or approaches to avoid – including why they hurt quality, speed, or safety.',
        ],
      },
      {
        heading: 'Alternatives & binding docs',
        prompts: [
          'Clarify when a different approach is acceptable and what must be documented if someone deviates. Name the policies or standards this guideline supports without replacing them.',
        ],
      },
      {
        heading: 'Examples & references',
        prompts: [
          'Add good examples, anti-patterns, and links to tools or related documents that make the guideline easy to apply day to day.',
        ],
      },
    ],
    [
      {
        heading: 'Zweck & Zielgruppe',
        prompts: [
          'Beschreibe die Praxis, die diese Leitlinie fördert, und warum sie hilft. Sag wer sie befolgen soll und in welchen Situationen sie gilt.',
        ],
      },
      {
        heading: 'Empfehlungen',
        prompts: [
          'Erkläre den bevorzugten Ansatz mit konkreten Beispielen und nenne Anti-Patterns oder zu vermeidende Ansätze – inklusive warum sie Qualität, Tempo oder Sicherheit schaden.',
        ],
      },
      {
        heading: 'Alternativen & verbindliche Dokumente',
        prompts: [
          'Kläre, wann ein anderer Ansatz akzeptabel ist und was bei Abweichung dokumentiert werden muss. Nenne Richtlinien oder Standards, die diese Leitlinie unterstützt, ohne sie zu ersetzen.',
        ],
      },
      {
        heading: 'Beispiele & Referenzen',
        prompts: [
          'Ergänze gute Beispiele, Anti-Patterns und Links zu Tools oder verwandten Dokumenten für den Alltag.',
        ],
      },
    ]
  ),
  t(
    'procedure',
    'Procedure',
    'Verfahren / SOP',
    'A procedure is an ordered how-to for a recurring, planned task (SOP). It tells who does what, in which sequence, under calm conditions, and what “done” looks like. Use this type for repeatable work with clear ownership – not for urgent incident response, which belongs in a runbook.',
    'Ein Verfahren ist eine geordnete Anleitung für eine wiederkehrende, geplante Aufgabe (SOP). Es sagt wer was in welcher Reihenfolge unter ruhigen Bedingungen tut und wann „fertig“ ist. Nutze diesen Typ für wiederholbare Arbeit mit klarer Verantwortung – nicht für dringende Incidents (dafür Runbooks).',
    'process',
    'Procedure: publish a document',
    'Verfahren: Dokument veröffentlichen',
    [
      {
        heading: 'Purpose, roles & prerequisites',
        prompts: [
          'State the recurring task this procedure covers and which policy or standard it implements. Name who performs each step and who approves, plus the access, tools, or prior approvals required before starting.',
        ],
      },
      {
        heading: 'Steps',
        prompts: [
          'Write an ordered, numbered sequence of steps. After each critical step, note the expected result so the performer can confirm they are still on track.',
        ],
      },
      {
        heading: 'Checkpoints & safety',
        prompts: [
          'Say where results must be logged or evidenced and what constitutes completion. Describe what can go wrong, how to undo or roll back, and when to escalate.',
        ],
      },
      {
        heading: 'References',
        prompts: ['Link related runbooks or systems used while following this procedure.'],
      },
    ],
    [
      {
        heading: 'Zweck, Rollen & Voraussetzungen',
        prompts: [
          'Nenne die wiederkehrende Aufgabe und welche Richtlinie oder welchen Standard das Verfahren umsetzt. Wer führt Schritte aus, wer gibt frei, und welche Zugänge, Tools oder Vorab-Freigaben braucht man vor dem Start.',
        ],
      },
      {
        heading: 'Schritte',
        prompts: [
          'Schreibe eine nummerierte Schrittfolge. Nach kritischen Schritten das erwartete Ergebnis notieren, damit Ausführende den Kurs prüfen können.',
        ],
      },
      {
        heading: 'Checkpoints & Sicherheit',
        prompts: [
          'Sag wo Ergebnisse protokolliert oder belegt werden müssen und was Abschluss bedeutet. Beschreibe was schiefgehen kann, Rückgängigmachen/Rollback und wann eskaliert wird.',
        ],
      },
      {
        heading: 'Referenzen',
        prompts: ['Verlinke verwandte Runbooks oder Systeme, die beim Ausführen genutzt werden.'],
      },
    ]
  ),
  t(
    'runbook',
    'Runbook',
    'Runbook',
    'A runbook is an urgent response guide for a specific alert, outage, or failure mode. It focuses on diagnose, mitigate, and verify under time pressure, with severity, escalation, and rollback spelled out. Use this type when operators need a fast, actionable path during an incident – not for calm, scheduled SOPs.',
    'Ein Runbook ist eine dringende Reaktionsanleitung für einen konkreten Alert, Ausfall oder Fehlermodus. Fokus: Diagnose, Mitigation und Verifikation unter Zeitdruck, mit Severity, Eskalation und Rollback. Nutze diesen Typ, wenn Operatoren im Incident einen schnellen, handlungsfähigen Pfad brauchen – nicht für ruhige, geplante SOPs.',
    'process',
    'Runbook: service outage response',
    'Runbook: Reaktion auf Service-Ausfall',
    [
      {
        heading: 'Purpose & prerequisites',
        prompts: [
          'Describe the alert or situation that triggers this runbook and what is in or out of scope. List the access, tools, and notifications required before anyone starts mitigation.',
        ],
      },
      {
        heading: 'Severity & procedure',
        prompts: [
          'Explain how severity is classified and when to escalate – including to whom. Provide ordered response steps and the expected outcome after each critical step so responders can move quickly under pressure.',
        ],
      },
      {
        heading: 'Verification & rollback',
        prompts: [
          'State how to confirm recovery using signals or metrics. If a step fails or makes things worse, describe how to roll back safely and what to communicate.',
        ],
      },
      {
        heading: 'References',
        prompts: [
          'Link dashboards, related procedures, architecture docs, and on-call or stakeholder contacts needed during the incident.',
        ],
      },
    ],
    [
      {
        heading: 'Zweck & Voraussetzungen',
        prompts: [
          'Beschreibe den Alert oder die Situation, die dieses Runbook auslöst, und was im bzw. außerhalb des Scopes liegt. Liste Zugänge, Tools und Benachrichtigungen, bevor Mitigation startet.',
        ],
      },
      {
        heading: 'Severity & Ablauf',
        prompts: [
          'Erkläre Severity-Klassifikation und wann an wen eskaliert wird. Gib geordnete Reaktionsschritte und das erwartete Ergebnis nach kritischen Schritten, damit unter Druck schnell gehandelt werden kann.',
        ],
      },
      {
        heading: 'Verifikation & Rollback',
        prompts: [
          'Sag wie Recovery über Signale oder Metriken bestätigt wird. Wenn ein Schritt scheitert oder verschlechtert: sicherer Rollback und was kommuniziert wird.',
        ],
      },
      {
        heading: 'Referenzen',
        prompts: [
          'Verlinke Dashboards, verwandte Verfahren, Architektur-Docs sowie On-Call- oder Stakeholder-Kontakte für den Incident.',
        ],
      },
    ]
  ),
];
