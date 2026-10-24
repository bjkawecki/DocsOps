import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export type AdminOrgUnitDeleteModalProps = {
  opened: boolean;
  title: string;
  body: string;
  onClose: () => void;
  onConfirmDelete: () => void;
  deleteLoading: boolean;
  /** When false, only the empty modal shell is shown (entity not loaded). */
  hasEntity: boolean;
};

/** Shared confirm-delete modal for admin department/team (and similar org units). */
export function AdminOrgUnitDeleteModal({
  opened,
  title,
  body,
  onClose,
  onConfirmDelete,
  deleteLoading,
  hasEntity,
}: AdminOrgUnitDeleteModalProps) {
  const { t } = useTranslation(['admin', 'common']);
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="sm" zIndex={400}>
      {hasEntity && (
        <Stack>
          <Text size="sm">{body}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              {t('common:actions.cancel')}
            </Button>
            <Button color="red" onClick={onConfirmDelete} loading={deleteLoading}>
              {t('common:actions.delete')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
