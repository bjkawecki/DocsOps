import { Button, Group, Modal, MultiSelect, Stack, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { DocumentTypePicker } from '../documents/DocumentTypePicker.js';
import type { DocumentTypeSelection } from '../documents/documentTypeTypes.js';

export type NewDraftDocumentModalProps = {
  opened: boolean;
  onClose: () => void;
  title: string;
  onTitleChange: (value: string) => void;
  tagOptions: { value: string; label: string }[];
  tagIds: string[];
  onTagIdsChange: (ids: string[]) => void;
  contextId: string;
  typeSelection: DocumentTypeSelection;
  onTypeSelectionChange: (next: DocumentTypeSelection) => void;
  loading: boolean;
  onSubmit: () => void | Promise<void>;
};

export function NewDraftDocumentModal({
  opened,
  onClose,
  title,
  onTitleChange,
  tagOptions,
  tagIds,
  onTagIdsChange,
  contextId,
  typeSelection,
  onTypeSelectionChange,
  loading,
  onSubmit,
}: NewDraftDocumentModalProps) {
  const { t } = useTranslation(['contexts', 'common']);
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('modals.newDraftDocument.title')}
      centered
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label={t('modals.newDraftDocument.titleLabel')}
          value={title}
          onChange={(e) => onTitleChange(e.currentTarget.value)}
          placeholder={t('modals.newDraftDocument.titlePlaceholder')}
          required
        />
        <DocumentTypePicker
          contextId={contextId}
          value={typeSelection}
          onChange={onTypeSelectionChange}
          applyTemplateOnSelect
          mode="create"
        />
        <MultiSelect
          label={t('modals.newDraftDocument.tagsLabel')}
          data={tagOptions}
          value={tagIds}
          onChange={onTagIdsChange}
          placeholder={t('modals.newDraftDocument.tagsPlaceholder')}
          searchable
          clearable
        />
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button loading={loading} onClick={() => void onSubmit()}>
            {t('common:actions.create')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
