import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
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
    <Modal opened={opened} onClose={onClose} title={t('teams.deleteModal.title')} size="sm">
      {team && (
        <Stack>
          <Text size="sm">{t('teams.deleteModal.body', { name: team.name })}</Text>
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
