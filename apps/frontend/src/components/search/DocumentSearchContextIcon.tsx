import { IconBriefcase, IconNotes, IconRoute, IconSubtask } from '@tabler/icons-react';
import { SEARCH_HIT_CONTEXT_ICON, type DocumentSearchItem } from './documentSearchTypes.js';

type Props = {
  contextType: DocumentSearchItem['contextType'];
};

export function DocumentSearchContextIcon({ contextType }: Props) {
  const IconComp =
    contextType === 'process'
      ? IconRoute
      : contextType === 'project'
        ? IconBriefcase
        : contextType === 'subcontext'
          ? IconSubtask
          : IconNotes;
  return (
    <IconComp
      size={SEARCH_HIT_CONTEXT_ICON}
      style={{ flexShrink: 0, display: 'block' }}
      color="var(--mantine-color-dimmed)"
      aria-hidden
    />
  );
}
