import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type ManageTagItem = {
  id: string;
  name: string;
  documentCount: number;
};

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
  manageTagsOpened: boolean;
  closeManageTags: () => void;
  tags: ManageTagItem[];
  createTagLoading: boolean;
  onCreateTag: (name: string) => Promise<string | null>;
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
  manageTagsOpened,
  closeManageTags,
  tags,
  createTagLoading,
  onCreateTag,
  onDeleteTag,
}: Props) {
  const { t } = useTranslation('documents');
  const [manageNewTagName, setManageNewTagName] = useState('');

  const submitManageCreate = () => {
    const name = manageNewTagName.trim();
    if (!name) return;
    void onCreateTag(name).then((id) => {
      if (id) setManageNewTagName('');
    });
  };

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
        opened={manageTagsOpened}
        onClose={() => {
          setManageNewTagName('');
          closeManageTags();
        }}
        title={t('modals.manageTagsTitle')}
        centered
      >
        <Stack gap="md">
          <Group align="flex-end" gap="xs" wrap="nowrap">
            <TextInput
              label={t('modals.tagNameLabel')}
              value={manageNewTagName}
              onChange={(e) => setManageNewTagName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitManageCreate();
                }
              }}
              style={{ flex: 1 }}
            />
            <Button
              loading={createTagLoading}
              disabled={!manageNewTagName.trim()}
              onClick={submitManageCreate}
            >
              {t('modals.create')}
            </Button>
          </Group>
          <Stack gap="xs">
            {tags.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('modals.noTagsYet')}
              </Text>
            ) : (
              tags.map((tag) => {
                const inUse = tag.documentCount > 0;
                const deleteBtn = (
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    disabled={inUse}
                    onClick={() => void onDeleteTag(tag.id)}
                    aria-label={t('modals.deleteTagAria', { name: tag.name })}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                );
                return (
                  <Group key={tag.id} justify="space-between">
                    <Text size="sm">{tag.name}</Text>
                    {inUse ? (
                      <Tooltip label={t('modals.tagInUseTooltip', { count: tag.documentCount })}>
                        {deleteBtn}
                      </Tooltip>
                    ) : (
                      deleteBtn
                    )}
                  </Group>
                );
              })
            )}
          </Stack>
        </Stack>
      </Modal>
    </>
  );
}
