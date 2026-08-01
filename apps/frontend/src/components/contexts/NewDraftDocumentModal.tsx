import { Button, Group, Modal, MultiSelect, Stack, TextInput } from '@mantine/core';
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
  return (
    <Modal opened={opened} onClose={onClose} title="New draft" centered size="lg">
      <Stack gap="md">
        <TextInput
          label="Title"
          value={title}
          onChange={(e) => onTitleChange(e.currentTarget.value)}
          placeholder="Draft title"
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
          label="Tags"
          data={tagOptions}
          value={tagIds}
          onChange={onTagIdsChange}
          placeholder="Select tags"
          searchable
          clearable
        />
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={loading} onClick={() => void onSubmit()}>
            Create
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
