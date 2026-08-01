import type {
  BuiltinDocumentType,
  OftenUsedIn,
  TemplateSection,
} from './builtinDocumentTemplateTypes.js';

function t(
  slug: string,
  label: string,
  deLabel: string,
  whenToUse: string,
  oftenUsedIn: OftenUsedIn,
  exampleTitle: string,
  sections: TemplateSection[]
): BuiltinDocumentType {
  return { slug, label, deLabel, whenToUse, oftenUsedIn, exampleTitle, sections };
}

/** Platform built-in catalog (SSoT for labels/sections). */
export const BUILTIN_DOCUMENT_TYPES: readonly BuiltinDocumentType[] = [
  t(
    'policy',
    'Policy',
    'Richtlinie',
    'A policy is a binding organizational rule that states what must be complied with and why. It sets intent and obligations at a strategic level, names who and what is in scope, and leaves measurable detail to standards or concrete steps to procedures. Use this type when readers need a durable “must / must not” decision that other documents implement.',
    'process',
    'Policy: information security',
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
    ]
  ),
  t(
    'standard',
    'Standard',
    'Standard',
    'A standard is a mandatory, measurable requirement that turns policy intent into criteria you can check. It answers “how much” or “what exactly” in testable language so audits, reviews, or tooling can verify compliance without reinterpretation. Use this type when a rule must be concrete and auditable, not only directional.',
    'process',
    'Standard: password length',
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
    ]
  ),
  t(
    'guideline',
    'Guideline',
    'Leitlinie',
    'A guideline recommends a preferred way of working without mandating a single approach. It helps teams align on good practice while still allowing reasoned deviation. Use this type when you want shared norms and examples, not a binding rule that must always be followed.',
    'process',
    'Guideline: code review practice',
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
    ]
  ),
  t(
    'procedure',
    'Procedure',
    'Verfahren / SOP',
    'A procedure is an ordered how-to for a recurring, planned task (SOP). It tells who does what, in which sequence, under calm conditions, and what “done” looks like. Use this type for repeatable work with clear ownership – not for urgent incident response, which belongs in a runbook.',
    'process',
    'Procedure: publish a document',
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
    ]
  ),
  t(
    'runbook',
    'Runbook',
    'Runbook',
    'A runbook is an urgent response guide for a specific alert, outage, or failure mode. It focuses on diagnose, mitigate, and verify under time pressure, with severity, escalation, and rollback spelled out. Use this type when operators need a fast, actionable path during an incident – not for calm, scheduled SOPs.',
    'process',
    'Runbook: service outage response',
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
    ]
  ),
  t(
    'adr',
    'ADR',
    'Architekturentscheidung',
    'An architecture decision record (ADR) captures one significant technical choice, the context that forced it, and the consequences and alternatives. It is a durable decision log so teams do not reopen settled debates without new information. Use this type for a single decision with lasting impact – not for a full system map or meeting minutes.',
    'project',
    'ADR: choose primary data store',
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
    ]
  ),
  t(
    'architecture-overview',
    'Architecture overview',
    'Architekturübersicht',
    'An architecture overview is a living map of a product or initiative: context, main components, data, and integrations. It orients newcomers and operators to how the system fits together at a glance. Use this type for the current big picture; record individual trade-off decisions as ADRs and keep volatile ops detail in runbooks or procedures.',
    'project',
    'Architecture overview: system landscape',
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
    ]
  ),
  t(
    'post-mortem',
    'Post-mortem',
    'Post-Mortem',
    'A post-mortem is a blameless after-action review of an incident: what happened, why, what went well, and which lasting improvements follow. It turns an outage or failure into shared learning with owners for follow-up. Use this type after recovery – during the incident, use a runbook instead.',
    'project',
    'Post-mortem: production incident',
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
    ]
  ),
];
