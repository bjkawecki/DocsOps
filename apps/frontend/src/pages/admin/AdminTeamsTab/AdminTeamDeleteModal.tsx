import { useTranslation } from 'react-i18next';
import { AdminOrgUnitDeleteModal } from '../AdminOrgUnitDeleteModal.js';
import type { TeamWithDept } from './adminTeamsTabTypes';

export type AdminTeamDeleteModalProps = {
  opened: boolean;
  team: TeamWithDept | null;
  onClose: () => void;
  onConfirmDelete: () => void;
  deleteLoading: boolean;
};

export function AdminTeamDeleteModal({
  opened,
  team,
  onClose,
  onConfirmDelete,
  deleteLoading,
}: AdminTeamDeleteModalProps) {
  const { t } = useTranslation('admin');
  return (
    <AdminOrgUnitDeleteModal
      opened={opened}
      title={t('teams.deleteModal.title')}
      body={team ? t('teams.deleteModal.body', { name: team.name }) : ''}
      hasEntity={team != null}
      onClose={onClose}
      onConfirmDelete={onConfirmDelete}
      deleteLoading={deleteLoading}
    />
  );
}
