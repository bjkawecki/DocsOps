import { Button, Group, Modal, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Destination } from './adminBackupTypes';
import type { DestinationFormState } from './adminBackupDestinationForm';
import {
  AdminBackupDestinationForm,
  BACKUP_DESTINATION_FORM_ID,
} from './AdminBackupDestinationForm';

type Props = {
  destination: Destination | null;
  opened: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (form: DestinationFormState, destinationId: string | null) => Promise<void>;
};

export function AdminBackupDestinationEditModal({
  destination,
  opened,
  saving,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const isEdit = destination != null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        isEdit
          ? t('backup.destinations.editModal.editTitle', { name: destination.name })
          : t('backup.destinations.editModal.createTitle')
      }
      size="lg"
    >
      <Stack gap="md">
        <AdminBackupDestinationForm
          key={destination?.id ?? 'new'}
          destination={destination}
          onSave={(form, destinationId) => {
            void onSave(form, destinationId).then(() => {
              onClose();
            });
          }}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={saving}>
            {t('common:actions.cancel')}
          </Button>
          <Button type="submit" form={BACKUP_DESTINATION_FORM_ID} loading={saving}>
            {isEdit ? t('common:actions.save') : t('common:actions.create')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
