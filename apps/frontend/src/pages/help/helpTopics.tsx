import {
  IconBuildingSkyscraper,
  IconGitBranch,
  IconGitMerge,
  IconInfoCircle,
  IconLock,
  type TablerIcon,
} from '@tabler/icons-react';

/** Stable paths, labels, and icons for the in-page help sidebar. */
export const HELP_TOPICS = [
  {
    to: '/help/overview',
    label: 'What is DocsOps?',
    icon: IconInfoCircle,
  },
  {
    to: '/help/organisation',
    label: 'Organisation & scopes',
    icon: IconBuildingSkyscraper,
  },
  {
    to: '/help/permissions',
    label: 'Read & write access',
    icon: IconLock,
  },
  {
    to: '/help/workflow',
    label: 'Document lifecycle',
    icon: IconGitBranch,
  },
  {
    to: '/help/collaboration',
    label: 'Reviews & merging',
    icon: IconGitMerge,
  },
] as const satisfies ReadonlyArray<{
  to: string;
  label: string;
  icon: TablerIcon;
}>;

export const HELP_TOPIC_ICON_SIZE = 16;
