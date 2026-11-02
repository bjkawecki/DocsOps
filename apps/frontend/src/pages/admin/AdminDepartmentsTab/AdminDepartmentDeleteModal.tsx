import { useTranslation } from 'react-i18next';
import { AdminOrgUnitDeleteModal } from '../AdminOrgUnitDeleteModal.js';
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
    <AdminOrgUnitDeleteModal
      opened={opened}
      title={t('departments.deleteModal.title')}
      body={department ? t('departments.deleteModal.body', { name: department.name }) : ''}
      hasEntity={department != null}
      onClose={onClose}
      onConfirmDelete={onConfirmDelete}
      deleteLoading={deleteLoading}
    />
  );
}
