import { Button, Card, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type Props = {
  deleteButtonLabel: string;
  onRequestDelete: () => void;
  deleteLoading: boolean;
};

/** Shared "Manage" tab content for admin department/team edit modals. */
export function AdminOrgUnitManagePanel({
  deleteButtonLabel,
  onRequestDelete,
  deleteLoading,
}: Props) {
  const { t } = useTranslation('admin');

  return (
    <Card withBorder padding="md">
      <Text size="sm" fw={600} mb="xs">
        {t('shared.manage')}
      </Text>
      <Text size="xs" c="dimmed" mb="md">
        {t('shared.manageHint')}
      </Text>
      <Button
        size="sm"
        variant="filled"
        color="red"
        leftSection={<IconTrash size={14} />}
        onClick={onRequestDelete}
        loading={deleteLoading}
      >
        {deleteButtonLabel}
      </Button>
    </Card>
  );
}
