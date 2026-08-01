/* eslint-disable max-lines -- built-in template catalog content (ADR 008) */
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
    'Binding organization-wide rule: what must be complied with and why. Example: “All customer data must be encrypted at rest.”',
    'process',
    'Policy: information security',
    [
      {
        heading: 'Purpose',
        prompts: [
          'Why does this policy exist – which risk or goal does it address?',
          'Which legal, regulatory, or business drivers apply?',
        ],
      },
      {
        heading: 'Scope',
        prompts: [
          'Who and what is covered (roles, systems, locations, data)?',
          'What is explicitly excluded?',
        ],
      },
      {
        heading: 'Policy statements',
        prompts: [
          'What are the binding rules (clear, numbered)?',
          'What is required vs. forbidden?',
        ],
      },
      {
        heading: 'Roles & accountability',
        prompts: ['Who owns this policy – and who enforces it?', 'Which roles must comply?'],
      },
      {
        heading: 'Compliance & exceptions',
        prompts: [
          'How is compliance checked or audited?',
          'How can exceptions be requested and approved?',
        ],
      },
      {
        heading: 'Related documents',
        prompts: ['Which standards, baselines, guidelines, or procedures implement this policy?'],
      },
      {
        heading: 'Review & version',
        prompts: ['How often is this policy reviewed?', 'Who approves changes?'],
      },
    ]
  ),
  t(
    'standard',
    'Standard',
    'Standard',
    'Mandatory, measurable requirement (“how much” / “what exactly”), usually derived from a policy. Example: “Passwords must be at least 12 characters.”',
    'process',
    'Standard: password length',
    [
      {
        heading: 'Purpose & parent policy',
        prompts: [
          'Which policy or goal does this standard support?',
          'What problem does non-compliance cause?',
        ],
      },
      {
        heading: 'Scope',
        prompts: ['Which systems, teams, or document types does this apply to?'],
      },
      {
        heading: 'Requirements',
        prompts: [
          'What must be true (measurable criteria)?',
          'What is the minimum acceptable level?',
        ],
      },
      {
        heading: 'Verification',
        prompts: [
          'How do you check compliance (audit, tooling, review)?',
          'What evidence is required?',
        ],
      },
      {
        heading: 'Exceptions',
        prompts: ['When are deviations allowed – and who approves them?'],
      },
      {
        heading: 'References',
        prompts: ['Related baselines, guidelines, procedures, or external norms (ISO, etc.).'],
      },
    ]
  ),
  t(
    'baseline',
    'Baseline',
    'Baseline',
    'Minimum configuration or state that systems and environments must meet (often checklist-like). Example: “Hardened Linux image for production VMs.”',
    'process',
    'Baseline: server hardening',
    [
      {
        heading: 'Purpose',
        prompts: ['What baseline is being defined – and against which standard or policy?'],
      },
      {
        heading: 'Scope',
        prompts: ['Which assets, environments, or teams must meet this baseline?'],
      },
      {
        heading: 'Baseline configuration',
        prompts: [
          'What are the required settings, versions, or controls (checklist)?',
          'What is the reference implementation or template?',
        ],
      },
      {
        heading: 'Deviation handling',
        prompts: [
          'How are exceptions documented?',
          'What is the process to bring non-compliant items into alignment?',
        ],
      },
      {
        heading: 'Verification & drift',
        prompts: [
          'How often is compliance checked?',
          'How is configuration drift detected and remediated?',
        ],
      },
      {
        heading: 'References',
        prompts: ['Links to automation (IaC), scans, related standards, or procedures.'],
      },
    ]
  ),
  t(
    'guideline',
    'Guideline',
    'Leitlinie',
    'Recommended practice without mandating a single approach. Example: “Prefer small PRs and at least one reviewer outside the authoring team.”',
    'process',
    'Guideline: code review practice',
    [
      {
        heading: 'Purpose',
        prompts: ['What practice does this guideline promote – and why?'],
      },
      {
        heading: 'Scope & audience',
        prompts: ['Who should follow this – in which situations?'],
      },
      {
        heading: 'Recommendations',
        prompts: [
          'What is the preferred approach (with examples)?',
          'What should be avoided – and why?',
        ],
      },
      {
        heading: 'Alternatives',
        prompts: [
          'When is a different approach acceptable?',
          'What must be documented if deviating?',
        ],
      },
      {
        heading: 'Relation to binding docs',
        prompts: ['Which policies or standards does this support – without replacing them?'],
      },
      {
        heading: 'Examples & references',
        prompts: ['Good examples, anti-patterns, links to tools or templates.'],
      },
    ]
  ),
  t(
    'procedure',
    'Procedure',
    'Verfahren / SOP',
    'Ordered how-to for a recurring, planned task (SOP). Example: “Publish a document: review → approve → publish.”',
    'process',
    'Procedure: publish a document',
    [
      {
        heading: 'Purpose & scope',
        prompts: [
          'What task does this procedure cover?',
          'Which policy, standard, or baseline does it implement?',
        ],
      },
      {
        heading: 'Roles',
        prompts: ['Who performs each step – and who approves?'],
      },
      {
        heading: 'Prerequisites',
        prompts: ['What access, tools, or prior approvals are required?'],
      },
      {
        heading: 'Steps',
        prompts: [
          'What is the ordered step sequence (numbered)?',
          'What is the expected result after each critical step?',
        ],
      },
      {
        heading: 'Checkpoints & records',
        prompts: ['Where must results be logged or evidenced?', 'What constitutes completion?'],
      },
      {
        heading: 'Safety & rollback',
        prompts: ['What can go wrong – and how to undo or escalate?'],
      },
      {
        heading: 'References',
        prompts: ['Related runbooks, playbooks, checklists, or systems.'],
      },
    ]
  ),
  t(
    'runbook',
    'Runbook',
    'Runbook',
    'Urgent response for a specific alert or outage: diagnose, mitigate, verify. Example: “API 5xx spike: check deploy, roll back, notify stakeholders.”',
    'process',
    'Runbook: service outage response',
    [
      {
        heading: 'Purpose & scope',
        prompts: [
          'What situation or alert triggers this runbook?',
          'What is in scope – and what is explicitly out of scope?',
        ],
      },
      {
        heading: 'Prerequisites',
        prompts: [
          'What access, tools, or permissions are required before starting?',
          'Who must be notified before or during execution?',
        ],
      },
      {
        heading: 'Severity & escalation',
        prompts: ['How is severity classified?', 'When do you escalate – and to whom?'],
      },
      {
        heading: 'Procedure',
        prompts: [
          'What are the steps in order (numbered)?',
          'What is the expected outcome after each critical step?',
        ],
      },
      {
        heading: 'Verification',
        prompts: [
          'How do you confirm the issue is resolved or the system is healthy?',
          'What signals or metrics should you check?',
        ],
      },
      {
        heading: 'Rollback / recovery',
        prompts: ['What if a step fails or makes things worse?', 'How do you roll back safely?'],
      },
      {
        heading: 'References',
        prompts: ['Links to dashboards, related SOPs, architecture docs, or contacts.'],
      },
    ]
  ),
  t(
    'playbook',
    'Playbook',
    'Playbook',
    'Proactive, multi-role workflow with phases and gates. Example: “Onboard a new microservice: repo → CI → observability → go-live.”',
    'process',
    'Playbook: service onboarding',
    [
      {
        heading: 'Purpose & audience',
        prompts: [
          'What workflow does this playbook describe?',
          'Who executes it – and who approves or reviews the result?',
        ],
      },
      {
        heading: 'When to use',
        prompts: [
          'On what trigger or schedule is this playbook used?',
          'When should another document (e.g. runbook, SOP) be used instead?',
        ],
      },
      {
        heading: 'Roles & responsibilities',
        prompts: [
          'Which roles are involved at each stage?',
          'Who is accountable for the final outcome?',
        ],
      },
      {
        heading: 'Preparation',
        prompts: [
          'What must be in place before starting (data, access, approvals)?',
          'What checklist items apply before day one / before go-live?',
        ],
      },
      {
        heading: 'Workflow',
        prompts: [
          'What are the main phases and steps?',
          'What are the decision points or gates between phases?',
        ],
      },
      {
        heading: 'Quality & acceptance',
        prompts: ['What does “done” look like?', 'What evidence or artifacts must be produced?'],
      },
      {
        heading: 'Exceptions & contacts',
        prompts: [
          'What are common exceptions and how are they handled?',
          'Who to contact for questions or escalations?',
        ],
      },
    ]
  ),
  t(
    'checklist',
    'Checklist',
    'Checkliste',
    'Short, tickable list to confirm readiness without a full narrative. Example: “Release readiness: tests green, changelog, feature flags, on-call briefed.”',
    'process',
    'Checklist: release readiness',
    [
      {
        heading: 'Purpose',
        prompts: ['What outcome does this checklist confirm?', 'When must it be completed?'],
      },
      {
        heading: 'Items',
        prompts: ['List the checkable steps in order.', 'Who signs off each item?'],
      },
      {
        heading: 'Completion',
        prompts: ['What constitutes “complete”?', 'Where is completion recorded?'],
      },
      {
        heading: 'References',
        prompts: ['Related procedures, runbooks, or standards.'],
      },
    ]
  ),
  t(
    'repository-documentation',
    'Repository documentation',
    'Repository-Doku',
    'Developer-facing overview of one code repository: purpose, layout, setup, and conventions. Example: “billing-service: how to run locally and where configs live.”',
    'project',
    'Repository documentation: billing-service',
    [
      {
        heading: 'Purpose',
        prompts: [
          'What does this repository contain – and what problem does it solve?',
          'Who are the primary consumers (teams, services, users)?',
        ],
      },
      {
        heading: 'Repository structure',
        prompts: [
          'How is the codebase organized (top-level folders, main modules)?',
          'Where do config, infrastructure, and docs live?',
        ],
      },
      {
        heading: 'Getting started',
        prompts: [
          'What are the prerequisites (runtime, tools, credentials)?',
          'How do you clone, install dependencies, and run locally?',
        ],
      },
      {
        heading: 'Build, test & deploy',
        prompts: [
          'How do you build and run tests?',
          'How does deployment work – and which environments exist?',
        ],
      },
      {
        heading: 'Conventions',
        prompts: [
          'Branching, naming, and commit conventions?',
          'Code review and merge expectations?',
        ],
      },
      {
        heading: 'Configuration & secrets',
        prompts: [
          'Which environment variables or config files matter?',
          'Where are secrets managed – never commit what?',
        ],
      },
      {
        heading: 'Operations & ownership',
        prompts: [
          'Who maintains this repo – and who is on-call?',
          'Links to runbooks, architecture docs, or issue trackers.',
        ],
      },
    ]
  ),
  t(
    'adr',
    'ADR',
    'Architekturentscheidung',
    'Record one significant technical choice and its trade-offs (Architecture Decision Record). Example: “Use PostgreSQL as the primary store.”',
    'project',
    'ADR: choose PostgreSQL for primary store',
    [
      {
        heading: 'Status',
        prompts: ['Proposed, accepted, deprecated, superseded?'],
      },
      {
        heading: 'Context',
        prompts: ['What problem or force led to this decision?'],
      },
      {
        heading: 'Decision',
        prompts: ['What was decided?'],
      },
      {
        heading: 'Consequences',
        prompts: ['What becomes easier or harder?', 'What follow-up work is required?'],
      },
      {
        heading: 'Alternatives considered',
        prompts: ['Which options were rejected – and why?'],
      },
    ]
  ),
  t(
    'architecture-overview',
    'Architecture overview',
    'Architekturübersicht',
    'Living map of a product or initiative: context, components, data, and integrations. Example: “Docs platform: apps, Postgres, MinIO, job workers.”',
    'project',
    'Architecture overview: docs platform',
    [
      {
        heading: 'Context',
        prompts: ['What system is described?', 'Who are the users and external systems?'],
      },
      {
        heading: 'Containers / components',
        prompts: ['What are the main runtime units and responsibilities?'],
      },
      {
        heading: 'Data & integrations',
        prompts: ['What data stores and integrations matter?'],
      },
      {
        heading: 'Cross-cutting concerns',
        prompts: ['Auth, observability, deployment topology?'],
      },
      {
        heading: 'References',
        prompts: ['Related ADRs, runbooks, repository docs.'],
      },
    ]
  ),
  t(
    'meeting-notes',
    'Meeting notes',
    'Protokoll',
    'Capture what was discussed, decided, and assigned in a meeting. Example: “Sprint planning 2026-08-01: scope, owners, dates.”',
    'project',
    'Meeting notes: sprint planning 2026-08-01',
    [
      {
        heading: 'Attendees',
        prompts: ['Who attended?'],
      },
      {
        heading: 'Agenda',
        prompts: ['What was planned to discuss?'],
      },
      {
        heading: 'Notes',
        prompts: ['Key discussion points.'],
      },
      {
        heading: 'Decisions',
        prompts: ['What was decided?'],
      },
      {
        heading: 'Action items',
        prompts: ['Who owns which follow-up – by when?'],
      },
    ]
  ),
  t(
    'post-mortem',
    'Post-mortem',
    'Post-Mortem',
    'After-the-fact learning from an incident: timeline, causes, and lasting improvements. Example: “Outage 2026-07-15: deploy rollback gap.”',
    'project',
    'Post-mortem: production outage 2026-07-15',
    [
      {
        heading: 'Summary',
        prompts: ['What happened in one paragraph?', 'Impact and duration?'],
      },
      {
        heading: 'Timeline',
        prompts: ['Key events with timestamps.'],
      },
      {
        heading: 'Root cause',
        prompts: ['What caused the incident?', 'Contributing factors?'],
      },
      {
        heading: 'What went well',
        prompts: ['Detection, response, communication strengths?'],
      },
      {
        heading: 'What to improve',
        prompts: ['Gaps and follow-up actions with owners.'],
      },
      {
        heading: 'References',
        prompts: ['Related runbooks, tickets, dashboards.'],
      },
    ]
  ),
  t(
    'known-issue',
    'Known issue',
    'Bekannter Fehler',
    'Knowledge-base entry for a known defect: symptoms, workaround, and tracker link (not the ticket itself). Example: “PDF export fails above 50 MB; workaround: split files.”',
    'project',
    'Known issue: export fails for files larger than 50 MB',
    [
      {
        heading: 'Summary',
        prompts: ['One-line symptom and who is affected.'],
      },
      {
        heading: 'Symptoms',
        prompts: ['What users or systems observe.'],
      },
      {
        heading: 'Expected vs actual',
        prompts: ['Short contrast.'],
      },
      {
        heading: 'Environment',
        prompts: ['Versions, scopes, browsers, flags if relevant.'],
      },
      {
        heading: 'Workaround',
        prompts: ['What to do until fixed (or “none”).'],
      },
      {
        heading: 'Tracker',
        prompts: ['Link to the issue (SSoT for assignment and status).'],
      },
      {
        heading: 'Status / resolution',
        prompts: ['Open, mitigated, fixed in version X (keep in sync with tracker).'],
      },
    ]
  ),
];
