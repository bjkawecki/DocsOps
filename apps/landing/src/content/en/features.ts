import type { TablerIcon } from '@tabler/icons-react';
import {
  IconBuilding,
  IconCloudLock,
  IconFileCheck,
  IconFolder,
  IconGitPullRequest,
  IconKey,
  IconShieldCheck,
  IconSitemap,
} from '@tabler/icons-react';

export type FeatureItem = {
  title: string;
  description: string;
  icon: TablerIcon;
};

export const features: FeatureItem[] = [
  {
    title: 'Org hierarchy',
    description:
      'DocsOps mirrors your company’s existing structure and ties knowledge visibility to membership.',
    icon: IconSitemap,
  },
  {
    title: 'Governance',
    description:
      'Document-scoped roles and approvals make documents binding and changes traceable.',
    icon: IconShieldCheck,
  },
  {
    title: 'Do11y',
    description:
      'Documentation Observability (Do11y) shows owners which documents need a freshness check.',
    icon: IconFileCheck,
  },
  {
    title: 'Data control',
    description:
      'Your knowledge base – your control. Run DocsOps yourself. Export, backup, and import keep the corpus portable.',
    icon: IconCloudLock,
  },
];

export const philosophiePrinciples = [
  {
    title: 'Mirror the company structure',
    description: 'Company → Department → Team as a fixed model.',
    icon: IconBuilding,
  },
  {
    title: 'Rights on the document',
    description: 'Explicit reader and writer rights – not only scope rights.',
    icon: IconKey,
  },
  {
    title: 'Publication by leads',
    description: 'Leads set the binding version for readers.',
    icon: IconShieldCheck,
  },
  {
    title: 'Drafts & proposals',
    description: 'Contributions in the draft; owners bring them together.',
    icon: IconGitPullRequest,
  },
  {
    title: 'Process & project',
    description:
      'Contexts instead of a flat page list – documents can move between scopes with lead approval.',
    icon: IconFolder,
  },
  {
    title: 'Self-hosted & source-available',
    description: 'Source-available, Docker on your own infrastructure.',
    icon: IconCloudLock,
  },
];
