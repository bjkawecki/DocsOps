export type ComparisonValue = 'yes' | 'no' | 'partial';

export type ComparisonRow = {
  label: string;
  detail?: string;
  docsops: ComparisonValue;
  docsopsNote?: string;
  confluence: ComparisonValue;
  confluenceNote?: string;
};

/**
 * Critique comparison on `/compare`.
 * ✓ = critique applies · ✗ = not designed that way.
 */
export const comparisonRows: ComparisonRow[] = [
  {
    label: 'Stale pages, duplicates, nobody cleans up',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'No fixed structure in the product',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Expensive',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Spaces and pages hard for newcomers',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Cloud lock-in',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Bloated UI',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Security issues',
    docsops: 'no',
    confluence: 'yes',
  },
  {
    label: 'Don’t get me started on the editor',
    docsops: 'no',
    confluence: 'yes',
  },
];

export type VergleichHubItem = {
  slug: string;
  name: string;
  description: string;
  ready: boolean;
};

export const vergleichHubItems: VergleichHubItem[] = [
  {
    slug: 'confluence',
    name: 'Confluence',
    description: 'Spaces, plugins, and established intranet docs – compared to DocsOps.',
    ready: true,
  },
  {
    slug: 'notion',
    name: 'Notion',
    description: 'Flexibility and all-in-one – vs. org-native guardrails.',
    ready: false,
  },
  {
    slug: 'docmost',
    name: 'Docmost',
    description: 'Self-hosted OSS with realtime collaboration – vs. hierarchical control.',
    ready: false,
  },
  {
    slug: 'outline',
    name: 'Outline',
    description: 'Team wiki with a clear focus – vs. the DocsOps structure model.',
    ready: false,
  },
];
