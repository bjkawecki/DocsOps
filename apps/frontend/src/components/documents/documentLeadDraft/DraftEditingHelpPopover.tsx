import { ActionIcon, Popover, Stack, Text } from '@mantine/core';
import { IconHelp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { LeadDraftEditorMode } from '../LeadDraftTiptapEditor.js';

type Props = {
  editorMode: LeadDraftEditorMode;
  canEdit: boolean;
};

function helpContentKey(editorMode: LeadDraftEditorMode, canEdit: boolean): string {
  if (!canEdit) return 'leadDraft.readOnlyHelpBody';
  return editorMode === 'author' ? 'leadDraft.authorHelpBody' : 'leadDraft.leadHelpBody';
}

export function DraftEditingHelpPopover({ editorMode, canEdit }: Props) {
  const { t } = useTranslation('documents');
  return (
    <Popover width={320} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <ActionIcon variant="subtle" size="sm" aria-label={t('leadDraft.helpAria')}>
          <IconHelp size={16} />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            {t('leadDraft.revisionHelpTitle')}
          </Text>
          <Text size="sm">{t('leadDraft.revisionHelpBody')}</Text>
          <Text size="sm" fw={600} mt="xs">
            {canEdit
              ? editorMode === 'author'
                ? t('leadDraft.authorSuggestionsTitle')
                : t('leadDraft.leadEditingTitle')
              : t('leadDraft.readOnlyTitle')}
          </Text>
          <Text size="sm">{t(helpContentKey(editorMode, canEdit))}</Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
