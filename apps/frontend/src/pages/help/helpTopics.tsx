import {
  IconBuildingSkyscraper,
  IconInfoCircle,
  IconStack2,
  type TablerIcon,
} from '@tabler/icons-react';

export type HelpTopic = {
  to: string;
  /** i18n key under `help` (e.g. `topics.overview`). */
  labelKey: string;
};

export type HelpTopicGroup = {
  id: string;
  /** i18n key under `help` (e.g. `groups.gettingStarted`). */
  labelKey: string;
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
    labelKey: 'groups.gettingStarted',
    icon: IconInfoCircle,
    topics: [
      { to: '/help/overview', labelKey: 'topics.overview' },
      { to: '/help/out-of-scope', labelKey: 'topics.outOfScope' },
    ],
  },
  {
    id: 'governance',
    labelKey: 'groups.governance',
    icon: IconBuildingSkyscraper,
    topics: [
      { to: '/help/organisation', labelKey: 'topics.organisation' },
      { to: '/help/contexts', labelKey: 'topics.contexts' },
    ],
  },
  {
    id: 'working-with-docs',
    labelKey: 'groups.workingWithDocs',
    icon: IconStack2,
    topics: [
      { to: '/help/document-types', labelKey: 'topics.documentTypes' },
      { to: '/help/permissions', labelKey: 'topics.permissions' },
      { to: '/help/workflow', labelKey: 'topics.workflow' },
      { to: '/help/collaboration', labelKey: 'topics.collaboration' },
    ],
  },
] as const satisfies ReadonlyArray<HelpTopicGroup>;

export const HELP_TOPIC_ICON_SIZE = 16;

/** Flat topic order for previous / next article navigation. */
export function flattenHelpTopics(): HelpTopic[] {
  return HELP_TOPIC_GROUPS.flatMap((group) => [...group.topics]);
}
