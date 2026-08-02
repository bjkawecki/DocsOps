import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { NewDraftDocumentModal } from '../../components/contexts/NewDraftDocumentModal';
import type { DocumentTypeSelection } from '../../components/documents/documentTypeTypes.js';
import type { ContextType } from './contextWorkspaceTypes.js';

export type ContextWorkspaceModalsProps = {
  contextId: string;
  contextType: ContextType;
  tagOptions: { value: string; label: string }[];
  newSubcontextOpened: boolean;
  closeNewSubcontext: () => void;
  newSubcontextName: string;
  setNewSubcontextName: (value: string) => void;
  newSubcontextLoading: boolean;
  handleCreateSubcontext: () => void | Promise<void>;
  newDocOpened: boolean;
  closeNewDoc: () => void;
  newDocTitle: string;
  setNewDocTitle: (value: string) => void;
  newDocTagIds: string[];
  setNewDocTagIds: (value: string[]) => void;
  newDocTypeSelection: DocumentTypeSelection;
  setNewDocTypeSelection: (value: DocumentTypeSelection) => void;
  newDocLoading: boolean;
  handleCreateDocument: () => void | Promise<void>;
  editOpened: boolean;
  closeEdit: () => void;
  editName: string;
  setEditName: (value: string) => void;
  editLoading: boolean;
  handleEditSubmit: () => void | Promise<void>;
  deleteOpened: boolean;
  closeDelete: () => void;
  deleteLoading: boolean;
  handleDeleteConfirm: () => void | Promise<void>;
};

export function ContextWorkspaceModals(props: ContextWorkspaceModalsProps) {
  const { t } = useTranslation(['contexts', 'common']);
  const isSubcontext = props.contextType === 'subcontext';

  return (
    <>
      <Modal
        opened={props.newSubcontextOpened}
        onClose={props.closeNewSubcontext}
        title={t('modals.createSubcontext.title')}
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label={t('modals.createSubcontext.nameLabel')}
            value={props.newSubcontextName}
            onChange={(e) => props.setNewSubcontextName(e.currentTarget.value)}
            placeholder={t('modals.createSubcontext.namePlaceholder')}
            required
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={props.closeNewSubcontext}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              loading={props.newSubcontextLoading}
              onClick={() => void props.handleCreateSubcontext()}
            >
              {t('common:actions.create')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <NewDraftDocumentModal
        opened={props.newDocOpened}
        onClose={props.closeNewDoc}
        title={props.newDocTitle}
        onTitleChange={props.setNewDocTitle}
        tagOptions={props.tagOptions}
        tagIds={props.newDocTagIds}
        onTagIdsChange={props.setNewDocTagIds}
        contextId={props.contextId}
        typeSelection={props.newDocTypeSelection}
        onTypeSelectionChange={props.setNewDocTypeSelection}
        loading={props.newDocLoading}
        onSubmit={props.handleCreateDocument}
      />

      <Modal
        opened={props.editOpened}
        onClose={props.closeEdit}
        title={t('modals.editName.title')}
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label={t('modals.editName.nameLabel')}
            value={props.editName}
            onChange={(e) => props.setEditName(e.currentTarget.value)}
            placeholder={t('modals.editName.namePlaceholder')}
            required
          />
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={props.closeEdit}>
              {t('common:actions.cancel')}
            </Button>
            <Button loading={props.editLoading} onClick={() => void props.handleEditSubmit()}>
              {t('common:actions.save')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={props.deleteOpened}
        onClose={props.closeDelete}
        title={isSubcontext ? t('modals.deleteSubcontext.title') : t('modals.moveToTrash.title')}
        centered
      >
        <Text size="sm" c="dimmed" mb="md">
          {isSubcontext ? t('modals.deleteSubcontext.body') : t('modals.moveToTrash.body')}
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={props.closeDelete}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            color="red"
            loading={props.deleteLoading}
            onClick={() => {
              void props.handleDeleteConfirm();
            }}
          >
            {isSubcontext ? t('workspace.delete') : t('workspace.moveToTrash')}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
