import { Box, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { formatOtherEditorsLabel } from './formatOtherEditorsLabel.js';
import type { DraftPresenceEditor } from './useDocumentLeadDraftPanelState.js';

type Props = {
  dirty: boolean;
  isRevisionStale: boolean;
  knownServerRevision: number;
  otherEditors: DraftPresenceEditor[];
};

/**
 * Compact presence / stale hints above the toolbar (not the tabs row).
 * Help + unsaved live in DocumentPageEditPanels next to the tabs.
 */
export function DraftSyncMetaBar({
  dirty,
  isRevisionStale,
  knownServerRevision,
  otherEditors,
}: Props) {
  const { t } = useTranslation('documents');
  const presenceLabel = formatOtherEditorsLabel(otherEditors, t);
  if (!presenceLabel && !(isRevisionStale && !dirty)) return null;

  return (
    <Group gap="sm" wrap="wrap" align="center" mb="xs">
      {presenceLabel ? (
        <Group gap={6} align="center" wrap="nowrap">
          <Box
            w={6}
            h={6}
            style={{
              borderRadius: '50%',
              backgroundColor: 'var(--mantine-color-teal-6)',
              flexShrink: 0,
            }}
            aria-hidden
          />
          <Text size="xs" c="dimmed">
            {presenceLabel}
          </Text>
        </Group>
      ) : null}
      {isRevisionStale && !dirty ? (
        <Text size="xs" c="dimmed" component="span">
          {t('leadDraft.serverRevision', { revision: knownServerRevision })}
        </Text>
      ) : null}
    </Group>
  );
}
