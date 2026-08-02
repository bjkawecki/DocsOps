import { ActionIcon, Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type Props = {
  deleteOpened: boolean;
  closeDelete: () => void;
  deleteLoading: boolean;
  onDeleteConfirm: () => void;
  assignContextOpened: boolean;
  onCloseAssignContext: () => void;
  assignContextOptions: { value: string; label: string }[];
  assignContextId: string | null;
  setAssignContextId: (v: string | null) => void;
  assignContextLoading: boolean;
  onAssignContext: () => void;
  moveContextOpened: boolean;
  onCloseMoveContext: () => void;
  moveContextOptions: { value: string; label: string; ownerId?: string | null }[];
  moveContextId: string | null;
  setMoveContextId: (v: string | null) => void;
  moveRequestNote: string;
  setMoveRequestNote: (v: string) => void;
  moveTargetIsCrossOwner: boolean;
  moveContextLoading: boolean;
  onMoveContext: () => void;
  createTagOpened: boolean;
  closeCreateTag: () => void;
  newTagName: string;
  setNewTagName: (v: string) => void;
  createTagLoading: boolean;
  onCreateTag: () => void;
  manageTagsOpened: boolean;
  closeManageTags: () => void;
  tags: { id: string; name: string }[];
  onDeleteTag: (tagId: string) => void;
};

export function DocumentPageModals({
  deleteOpened,
  closeDelete,
  deleteLoading,
  onDeleteConfirm,
  assignContextOpened,
  onCloseAssignContext,
  assignContextOptions,
  assignContextId,
  setAssignContextId,
  assignContextLoading,
  onAssignContext,
  moveContextOpened,
  onCloseMoveContext,
  moveContextOptions,
  moveContextId,
  setMoveContextId,
  moveRequestNote,
  setMoveRequestNote,
  moveTargetIsCrossOwner,
  moveContextLoading,
  onMoveContext,
  createTagOpened,
  closeCreateTag,
  newTagName,
  setNewTagName,
  createTagLoading,
  onCreateTag,
  manageTagsOpened,
  closeManageTags,
  tags,
  onDeleteTag,
}: Props) {
  const { t } = useTranslation('documents');
  return (
    <>
      <Modal opened={deleteOpened} onClose={closeDelete} title={t('modals.deleteTitle')} centered>
        <Text size="sm" c="dimmed" mb="md">
          {t('modals.deleteBody')}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={closeDelete}>
            {t('modals.cancel')}
          </Button>
          <Button
            color="red"
            loading={deleteLoading}
            onClick={() => {
              void onDeleteConfirm();
            }}
          >
            {t('modals.deleteConfirm')}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={assignContextOpened}
        onClose={onCloseAssignContext}
        title={t('modals.assignContextTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('modals.assignContextBody')}
          </Text>
          <Select
            label={t('modals.contextLabel')}
            placeholder={t('modals.contextPlaceholder')}
            data={assignContextOptions}
            value={assignContextId}
            onChange={(v) => setAssignContextId(v)}
            searchable
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={onCloseAssignContext}>
              {t('modals.cancel')}
            </Button>
            <Button
              disabled={!assignContextId}
              loading={assignContextLoading}
              onClick={() => void onAssignContext()}
            >
              {t('modals.assign')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={moveContextOpened}
        onClose={onCloseMoveContext}
        title={t('modals.moveContextTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('modals.moveContextBody')}
          </Text>
          <Select
            label={t('modals.targetContextLabel')}
            placeholder={t('modals.targetContextPlaceholder')}
            data={moveContextOptions.map(({ value, label }) => ({ value, label }))}
            value={moveContextId}
            onChange={(v) => setMoveContextId(v)}
            searchable
            nothingFoundMessage={t('modals.noOtherContexts')}
          />
          {moveTargetIsCrossOwner ? (
            <TextInput
              label={t('modals.noteLabel')}
              placeholder={t('modals.notePlaceholder')}
              value={moveRequestNote}
              onChange={(e) => setMoveRequestNote(e.currentTarget.value)}
            />
          ) : null}
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={onCloseMoveContext}>
              {t('modals.cancel')}
            </Button>
            <Button
              disabled={!moveContextId}
              loading={moveContextLoading}
              onClick={() => void onMoveContext()}
            >
              {moveTargetIsCrossOwner ? t('modals.requestMove') : t('modals.move')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={createTagOpened}
        onClose={closeCreateTag}
        title={t('modals.createTagTitle')}
        centered
      >
        <Stack gap="md">
          <TextInput
            label={t('modals.tagNameLabel')}
            value={newTagName}
            onChange={(e) => setNewTagName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && void onCreateTag()}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeCreateTag}>
              {t('modals.cancel')}
            </Button>
            <Button loading={createTagLoading} onClick={() => void onCreateTag()}>
              {t('modals.create')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={manageTagsOpened}
        onClose={closeManageTags}
        title={t('modals.manageTagsTitle')}
        centered
      >
        <Stack gap="xs">
          {tags.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('modals.noTagsYet')}
            </Text>
          ) : (
            tags.map((tag) => (
              <Group key={tag.id} justify="space-between">
                <Text size="sm">{tag.name}</Text>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => void onDeleteTag(tag.id)}
                  aria-label={t('modals.deleteTagAria', { name: tag.name })}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            ))
          )}
        </Stack>
      </Modal>
    </>
  );
}
