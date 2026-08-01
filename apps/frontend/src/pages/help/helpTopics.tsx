import {
  IconBuildingSkyscraper,
  IconInfoCircle,
  IconStack2,
  type TablerIcon,
} from '@tabler/icons-react';

export type HelpTopic = {
  to: string;
  label: string;
};

export type HelpTopicGroup = {
  id: string;
  label: string;
  icon: TablerIcon;
  topics: readonly HelpTopic[];
};

/**
 * Grouped help topics for the content sidebar.
 * Icons only on section headers; topic rows stay text-only (like Processes/Projects).
 */
export const HELP_TOPIC_GROUPS = [
  {
    id: 'getting-started',
    label: 'Getting started',
    icon: IconInfoCircle,
    topics: [
      { to: '/help/overview', label: 'What is DocsOps?' },
      { to: '/help/out-of-scope', label: 'What DocsOps is not' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: IconBuildingSkyscraper,
    topics: [
      { to: '/help/organisation', label: 'Organisation & scopes' },
      { to: '/help/contexts', label: 'Processes & projects' },
    ],
  },
  {
    id: 'working-with-docs',
    label: 'Working with docs',
    icon: IconStack2,
    topics: [
      { to: '/help/document-types', label: 'Document types' },
      { to: '/help/permissions', label: 'Read & write access' },
      { to: '/help/workflow', label: 'Document lifecycle' },
      { to: '/help/collaboration', label: 'Reviews & approvals' },
    ],
  },
] as const satisfies ReadonlyArray<HelpTopicGroup>;

export const HELP_TOPIC_ICON_SIZE = 16;
