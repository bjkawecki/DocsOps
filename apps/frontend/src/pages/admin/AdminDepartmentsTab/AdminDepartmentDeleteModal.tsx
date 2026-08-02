import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { DepartmentWithCompany } from './adminDepartmentsTabTypes';

export type AdminDepartmentDeleteModalProps = {
  opened: boolean;
  department: DepartmentWithCompany | null;
  onClose: () => void;
  onConfirmDelete: () => void;
  deleteLoading: boolean;
};

export function AdminDepartmentDeleteModal({
  opened,
  department,
  onClose,
  onConfirmDelete,
  deleteLoading,
}: AdminDepartmentDeleteModalProps) {
  const { t } = useTranslation('admin');
  return (
    <Modal opened={opened} onClose={onClose} title={t('departments.deleteModal.title')} size="sm">
      {department && (
        <Stack>
          <Text size="sm">{t('departments.deleteModal.body', { name: department.name })}</Text>
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
