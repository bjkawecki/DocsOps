import {
  IconBuildingSkyscraper,
  IconInfoCircle,
  IconStack2,
  IconUsers,
  type TablerIcon,
} from '@tabler/icons-react';

export type HelpTopic = {
  to: string;
  /** i18n key under `help.topics` (e.g. `whatIsDocsOps`). */
  id: string;
};

export type HelpTopicGroup = {
  id: string;
  /** i18n key under `help.groups` (e.g. `gettingStarted`). */
  labelKey: string;
  icon: TablerIcon;
  topics: readonly HelpTopic[];
};

/**
 * Grouped help topics for the content sidebar.
 * Icons only on section headers; topic rows stay text-only.
 */
export const HELP_TOPIC_GROUPS = [
  {
    id: 'getting-started',
    labelKey: 'groups.gettingStarted',
    icon: IconInfoCircle,
    topics: [
      { to: '/help/what-is-docsops', id: 'whatIsDocsOps' },
      { to: '/help/using-docsops', id: 'usingDocsOps' },
      { to: '/help/user-interface', id: 'userInterface' },
    ],
  },
  {
    id: 'organisation',
    labelKey: 'groups.organisation',
    icon: IconBuildingSkyscraper,
    topics: [
      { to: '/help/organisation/introduction', id: 'organisationIntroduction' },
      { to: '/help/areas', id: 'areas' },
      { to: '/help/contexts', id: 'contexts' },
      { to: '/help/planning-organisation', id: 'planningOrganisation' },
    ],
  },
  {
    id: 'roles',
    labelKey: 'groups.roles',
    icon: IconUsers,
    topics: [
      { to: '/help/roles/introduction', id: 'rolesIntroduction' },
      { to: '/help/user-roles', id: 'userRoles' },
      { to: '/help/special-roles', id: 'specialRoles' },
    ],
  },
  {
    id: 'documents',
    labelKey: 'groups.documents',
    icon: IconStack2,
    topics: [
      { to: '/help/documents/introduction', id: 'documentsIntroduction' },
      { to: '/help/templates', id: 'templates' },
      { to: '/help/lifecycle', id: 'lifecycle' },
      { to: '/help/collaboration', id: 'collaboration' },
    ],
  },
] as const satisfies ReadonlyArray<HelpTopicGroup>;

export const HELP_TOPIC_ICON_SIZE = 16;

/** Default help landing path (first topic). */
export const HELP_DEFAULT_PATH = HELP_TOPIC_GROUPS[0].topics[0].to;

/** Flat topic order for previous / next article navigation. */
export function flattenHelpTopics(): HelpTopic[] {
  return HELP_TOPIC_GROUPS.flatMap((group) => [...group.topics]);
}

/** Resolve topic by current pathname, or null if unknown. */
export function findHelpTopic(pathname: string): HelpTopic | null {
  return flattenHelpTopics().find((topic) => topic.to === pathname) ?? null;
}
