export const heroCopy = {
  pageTitle: 'DocsOps – document operational knowledge with authority',
  metaDescription:
    'Maintain internal knowledge across company, department, and team. Fixed org structure instead of a wiki dump; proposals and approval stay separate. Source-available, self-hosted.',
  headlineLead: 'Your operational knowledge.',
  headlineQualities: ['Hierarchical', 'Structured', 'Authoritative'] as const,
  headlineTail: 'documented',
  headlineAccessible:
    'Your operational knowledge. Hierarchical, structured, authoritative, documented.',
  subline:
    'With DocsOps you maintain the internal knowledge base in your organisation’s structure.',
  trustPills: ['Source-available', 'Self-hosted'] as const,
  scrollHint: 'How DocsOps works',
  showroomAlt: 'Team dashboard in DocsOps with processes, projects, and documents in scope',
  primaryCta: 'Live demo',
  secondaryCta: 'Install',
} as const;

export type RoleDiagramEdge = {
  from: 'author' | 'lead' | 'member';
  to: 'entwurf' | 'version';
  label: string;
};

export type ScopeNodeId =
  | 'company'
  | 'departmentA'
  | 'departmentB'
  | 'teamA1'
  | 'teamA2'
  | 'teamB1'
  | 'teamB2'
  | 'userPersonal';

export type ScopeLevelId = 'company' | 'department' | 'team' | 'user';

export const scopeCopy = {
  title: {
    before: 'Organisation as a ',
    accent: 'layer model',
  },
  intro:
    'In organisations every user sits in a hierarchical scope: from company through department to team. DocsOps mirrors those layers and derives visibility and access from them.',
  introHighlights: ['scope', 'company', 'team'],
  diagramClickHint: 'Click a node to learn more.',
  scopeLabel: 'Organisation',
  nodes: {
    company: { label: 'Company' },
    departmentA: { label: 'Department A' },
    departmentB: { label: 'Department B' },
    teamA1: { label: 'Team A1' },
    teamA2: { label: 'Team A2' },
    teamB1: { label: 'Team B1' },
    teamB2: { label: 'Team B2' },
    userPersonal: { label: 'User' },
  },
  levelDescriptions: {
    company:
      'Every DocsOps instance has exactly one company as the organisational root. All users belong to it and therefore have access to that scope.',
    department:
      'Departments organise the company by subject area (for example IT or Sales).\n\nIn DocsOps you can assign users to exactly one department and thereby extend their access to that department’s contexts and documents.',
    team: 'Teams are the smallest operational unit and always belong to a department.\n\nIn DocsOps users can be assigned to exactly one team. They then get access to team contexts and documents as well as those of the parent department.',
    user: 'Every user has a personal organisational area outside the company tree.\n\nContexts and documents there are not visible via company, department, or team and belong only to that user.',
  },
  mobileIntro: 'Visibility and access follow the hierarchy of company, department, and team.',
  mobileLevels: [
    {
      title: 'Company',
      description: 'Shared organisational frame.',
    },
    {
      title: 'Department',
      description: 'Responsibility for a subject area or product field.',
    },
    {
      title: 'Team',
      description: 'Day-to-day operational collaboration.',
    },
    {
      title: 'Personal space',
      description: 'Own content outside the team hierarchy.',
    },
  ],
} as const;

export const contextCopy = {
  title: {
    before: 'Information needs ',
    accent: 'context',
  },
  intro:
    'Information becomes useful when related content is bundled. DocsOps therefore requires every document to belong to a context.\n\nThe basic distinction is fixed: process or project – lasting ways of working on one side, knowledge about a topic or initiative on the other.',
  introHighlights: ['context', 'process', 'project'],
  orLabel: 'or',
  types: {
    process: {
      title: 'Process',
      description:
        'You document how something is done – workflows, standards, and recurring rules.',
      examples: ['Onboarding guide', 'Incident flow and escalation', 'Release approval process'],
    },
    project: {
      title: 'Project',
      description: 'You bundle the current state of a topic, product, or initiative.',
      examples: [
        'Repository documentation',
        'Infrastructure overview',
        'CI/CD pipeline and deployment',
      ],
    },
  },
} as const;

export const exampleCopy = {
  title: {
    before: '',
    accent: 'Example',
    after: ': placing a document',
  },
  intro: 'Before creating: choose scope and context.',
  introHighlights: ['scope', 'context'],
  steps: [
    {
      question: 'What should be documented?',
      answer: 'Current accessibility status of Software X.',
    },
    {
      question: 'In which scope is that relevant?',
      answer: 'IT department: responsibility for the software sits there.',
    },
    {
      question: 'Does it belong in a process or a project?',
      answer:
        'Not the review workflow (process), but the product state. So project context “Software X”.',
    },
    {
      question: 'What is the document called?',
      answer: 'Document: “Accessibility status”.',
    },
  ],
} as const;

export const rolesPublicationCopy = {
  title: {
    before: '',
    accent: 'Role-based',
    after: ' collaboration',
  },
  intro:
    'Good writing is teamwork, but not every change belongs in the authoritative version immediately. In DocsOps roles control who works in the draft and who publishes. That yields a published, binding version.',
  introHighlights: ['roles', 'teamwork', 'draft'],
  diagramClickHint: 'Click a node to learn more.',
  nodeDescriptions: {
    scope: 'Organisational unit where roles and documents apply – from company to team.',
    document: 'A document consists of a draft and a published version.',
    lead: 'Responsible for quality and approval. Can create and edit drafts, accept or reject author proposals, and publish as the binding version.',
    author: 'Writes and revises content proposals in the draft.',
    member: 'Reads the published version and can comment.',
    entwurf: 'Working draft: changes are prepared and merged here.',
    version: 'Published, binding version for everyone with read access.',
  },
  roles: {
    author: 'Author',
    lead: 'Lead',
    member: 'Member',
  },
  scope: {
    title: 'Scope',
    hint: 'Company / department / team',
  },
  document: {
    title: 'Document',
    entwurf: 'Draft',
    version: 'Version 1',
  },
  transition: 'becomes',
  edges: [
    { from: 'lead', to: 'entwurf', label: 'Edits / publishes' },
    { from: 'author', to: 'entwurf', label: 'Creates proposals' },
    { from: 'member', to: 'version', label: 'Reads / comments' },
  ] satisfies RoleDiagramEdge[],
  mobileIntro: 'Contribution and approval stay separate: from draft to binding version.',
  mobileLevels: [
    {
      role: 'lead' as const,
      description: 'Quality and approval; publishes the binding version.',
    },
    {
      role: 'author' as const,
      description: 'Writes content proposals in the draft.',
    },
    {
      role: 'member' as const,
      description: 'Reads the published version and can comment.',
    },
    {
      role: 'entwurf' as const,
      description: 'Working draft: changes are prepared and merged.',
    },
    {
      role: 'version' as const,
      title: 'Published version',
      description: 'Binding version for everyone with read access.',
    },
  ],
} as const;

export const featuresSectionCopy = {
  title: 'All features',
} as const;

export const comparisonCopy = {
  title: 'Structure and control',
  columnCriterion: '',
} as const;

export const faqCopy = {
  title: 'FAQ',
} as const;

export const philosophieCopy = {
  pageHeadline: 'Our approach',
  metaDescription:
    'Why DocsOps is designed this way: knowledge in companies moves, gets rewritten or replaced, and can lose value over time. DocsOps organises that knowledge work along the organisation.',
  intro: [
    'Every company is a complex interplay of workflows, rules, decisions, projects, products, systems, as well as preferences and interests.',
    'In that interplay knowledge is constantly created. It moves between people, is rewritten, extended, or replaced, and can lose value over time.',
    'Dealing with that change means keeping knowledge usable for work in the company and consciously carrying it forward.',
  ],
  howCare: [
    {
      title: 'Knowledge must be captured',
      paragraphs: [
        'It starts with making knowledge readable at all. While it lives only in heads or conversations, it is hard to share and even harder to continue.',
        'A first step is therefore to document knowledge: in a system others can read and later change.',
      ],
    },
    {
      title: 'Knowledge needs context',
      paragraphs: [
        'Once such documentation exists, content alone is often not enough. Who it is for and in which situation it applies is missing.',
        'That relationship already exists in the organisation: in teams, processes, and projects. Knowledge belongs there and with the topics already owned there.',
      ],
    },
    {
      title: 'Knowledge needs accountability',
      paragraphs: [
        'Placed knowledge needs someone who keeps the current state in view while work continues.',
        'That work needs owners. Organisations often already know this role: someone who decides whether a state is continued, approved as valid, archived, or deleted.',
      ],
    },
  ],
  vision: {
    title: 'What we want to achieve with DocsOps',
    paragraphs: [
      'Reliable collaboration assumes work can rest on a shared, current knowledge base.',
      'DocsOps holds that state in the organisation. Documentation is not a parallel system beside the work, but lives in the same structure where decisions and ownership already sit.',
    ],
  },
} as const;

export const philosophyTeaserCopy = {
  title: 'Why so many rules?',
  body: 'Deciding where knowledge belongs and who owns it can look like too much overhead at first. It does push people into a thinking process that keeps order over time. More under Philosophy.',
  cta: 'About our philosophy',
} as const;

export const finalCtaCopy = {
  title: 'Try DocsOps',
  body: 'Enough explanation. Open the live demo or install DocsOps yourself.',
  primaryCta: 'Live demo',
  secondaryCta: 'Install',
} as const;

export const installCopy = {
  title: 'Install',
  metaDescription:
    'DocsOps self-hosted on your intranet: host requirements, curl install, and link to the install docs.',
  intro:
    'Self-hosted on a Linux host via Docker Compose. Default: HTTP behind Caddy on port 80 on the intranet.',
  requirementsTitle: 'Requirements',
  requirements: [
    'Linux host with root access',
    'Docker Engine and Compose plugin (the install script installs them if needed)',
    'At least 4 GB RAM and 20 GB free disk',
  ],
  installTitle: 'Standard install',
  installHint:
    'Downloads the current release bundle to /opt/docsops and starts the stack on port 80.',
  fullDocsLabel: 'Full installation docs',
} as const;

export const changelogCopy = {
  title: 'Changelog',
  metaDescription: 'Version history and changes to DocsOps.',
  intro: 'DocsOps version history. Notes come from the same release files as in the app.',
  empty: 'No release notes published yet.',
  latestBadge: 'Latest',
  noBody: 'No detailed notes for this version.',
} as const;

export const sponsorCopy = {
  title: 'Sponsor',
  metaDescription:
    'Support DocsOps development – source-available, self-hosted documentation platform.',
  intro:
    'DocsOps is source-available and has no subscription model. Voluntary support helps with infrastructure, maintenance, and further development.',
  whyTitle: 'What support is for',
  whyItems: [
    'Hosting and running the public demo',
    'Time for fixes, releases, and documentation',
    'Further development of the model and platform',
  ],
  ctaBody: 'Right now a star on GitHub helps most.',
  ctaPrimary: 'GitHub Sponsors',
  ctaStar: 'Star on GitHub',
} as const;

export const vergleichHubCopy = {
  title: 'DocsOps vs. Confluence',
  metaDescription: 'Confluence and DocsOps compared – from day-to-day use of both.',
  intro: ['Observations from everyday use of Confluence and DocsOps.'],
} as const;

export const modellNavLinks = [
  { label: 'Organisation', href: '/#scope' },
  { label: 'Context', href: '/#context' },
  { label: 'Roles', href: '/#roles' },
  { label: 'Example', href: '/#example' },
  { label: 'All features', href: '/#features' },
] as const;

export const philosophieNavLinks = [
  { label: 'Our approach', href: '/philosophy' },
  { label: 'DocsOps vs. Confluence', href: '/compare' },
] as const;

export const docsopsVsFooterLinks = [{ label: 'Confluence', href: '/compare' }] as const;

export const projectNavLinks = [
  { label: 'GitHub', href: 'github', external: true },
  { label: 'Changelog', href: '/changelog', external: false },
  { label: 'Sponsor', href: '/sponsor', external: false },
] as const;

export const authorSiteLink = {
  label: 'bjoernkawecki.de',
  href: 'https://bjoernkawecki.de/projects/docs-ops/',
} as const;

export const footerCopy = {
  productTitle: 'Product',
  docsopsVsTitle: 'DocsOps vs.',
  projectTitle: 'Project',
  legalTitle: 'Legal',
  links: {
    howItWorks: 'How it works',
    ourApproach: 'Our approach',
    installation: 'Install',
    demo: 'Live demo',
    github: 'GitHub',
    changelog: 'Changelog',
    sponsor: 'Sponsor',
    impressum: 'Imprint',
    datenschutz: 'Privacy',
  },
  meta: (year: number) => `© ${year} DocsOps`,
} as const;

export const navbarCopy = {
  modell: 'How it works',
  philosophie: 'Philosophy',
  demoCta: 'Live demo',
} as const;
