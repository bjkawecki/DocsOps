import { ActionIcon, Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

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
  return (
    <>
      <Modal opened={deleteOpened} onClose={closeDelete} title="Move to trash" centered>
        <Text size="sm" c="dimmed" mb="md">
          This document will be moved to trash (soft delete). Continue?
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={closeDelete}>
            Cancel
          </Button>
          <Button
            color="red"
            loading={deleteLoading}
            onClick={() => {
              void onDeleteConfirm();
            }}
          >
            Move to trash
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={assignContextOpened}
        onClose={onCloseAssignContext}
        title="Assign to context"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Choose a process or project to assign this draft to. You can then publish it.
          </Text>
          <Select
            label="Context"
            placeholder="Select process or project"
            data={assignContextOptions}
            value={assignContextId}
            onChange={(v) => setAssignContextId(v)}
            searchable
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={onCloseAssignContext}>
              Cancel
            </Button>
            <Button
              disabled={!assignContextId}
              loading={assignContextLoading}
              onClick={() => void onAssignContext()}
            >
              Assign
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={moveContextOpened} onClose={onCloseMoveContext} title="Move document" centered>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Same owner scope moves immediately. Other scopes create a move request for the target
            lead. On accept, tags are removed; access grants stay on the document.
          </Text>
          <Select
            label="Target context"
            placeholder="Select process, project, or subcontext"
            data={moveContextOptions.map(({ value, label }) => ({ value, label }))}
            value={moveContextId}
            onChange={(v) => setMoveContextId(v)}
            searchable
            nothingFoundMessage="No other readable contexts"
          />
          {moveTargetIsCrossOwner ? (
            <TextInput
              label="Note (optional)"
              placeholder="Why should this document move?"
              value={moveRequestNote}
              onChange={(e) => setMoveRequestNote(e.currentTarget.value)}
            />
          ) : null}
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={onCloseMoveContext}>
              Cancel
            </Button>
            <Button
              disabled={!moveContextId}
              loading={moveContextLoading}
              onClick={() => void onMoveContext()}
            >
              {moveTargetIsCrossOwner ? 'Request move' : 'Move'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={createTagOpened} onClose={closeCreateTag} title="Create tag" centered>
        <Stack gap="md">
          <TextInput
            label="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && void onCreateTag()}
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={closeCreateTag}>
              Cancel
            </Button>
            <Button loading={createTagLoading} onClick={() => void onCreateTag()}>
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={manageTagsOpened} onClose={closeManageTags} title="Manage tags" centered>
        <Stack gap="xs">
          {tags.length === 0 ? (
            <Text size="sm" c="dimmed">
              No tags yet. Create one when editing a document.
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
                  aria-label={`Delete tag ${tag.name}`}
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
