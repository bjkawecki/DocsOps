import { Box, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { LeadDraftEditorMode } from '../LeadDraftTiptapEditor.js';
import { DraftEditingHelpPopover } from './DraftEditingHelpPopover.js';
import { formatOtherEditorsLabel } from './formatOtherEditorsLabel.js';
import type { DraftPresenceEditor } from './useDocumentLeadDraftPanelState.js';

type Props = {
  appliedRevision: number | null;
  incomingRevision: number;
  dirty: boolean;
  isRevisionStale: boolean;
  knownServerRevision: number;
  canEdit: boolean;
  editorMode: LeadDraftEditorMode;
  otherEditors: DraftPresenceEditor[];
};

export function DraftSyncMetaBar({
  appliedRevision,
  incomingRevision,
  dirty,
  isRevisionStale,
  knownServerRevision,
  canEdit,
  editorMode,
  otherEditors,
}: Props) {
  const { t } = useTranslation('documents');
  const presenceLabel = formatOtherEditorsLabel(otherEditors, t);

  return (
    <Group gap="md" justify="space-between" wrap="wrap" align="center">
      <Group gap="sm" wrap="wrap" align="center">
        <Group gap={6} align="center" wrap="wrap">
          <Text size="sm">
            <strong>{t('leadDraft.draftRevisionLabel')}</strong>{' '}
            {appliedRevision ?? incomingRevision}
          </Text>
          {presenceLabel && (
            <>
              <Text size="sm" c="dimmed" aria-hidden>
                ·
              </Text>
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
            </>
          )}
        </Group>
        {dirty ? (
          <>
            <Text size="sm" c="dimmed" aria-hidden>
              ·
            </Text>
            <Text size="xs" c="dimmed" component="span">
              {t('leadDraft.unsavedChanges')}
            </Text>
          </>
        ) : null}
        {isRevisionStale && !dirty ? (
          <Text size="xs" c="dimmed" component="span">
            {t('leadDraft.serverRevision', { revision: knownServerRevision })}
          </Text>
        ) : null}
      </Group>
      <DraftEditingHelpPopover editorMode={editorMode} canEdit={!!canEdit} />
    </Group>
  );
}
