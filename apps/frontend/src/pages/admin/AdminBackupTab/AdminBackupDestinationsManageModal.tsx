import { useState } from 'react';
import { Button, Group, Modal, Stack, Table, Text } from '@mantine/core';
import type { Destination } from './adminBackupTypes';
import {
  AdminBackupDestinationModal,
  type DestinationFormState,
} from './AdminBackupDestinationModal';

type Props = {
  opened: boolean;
  onClose: () => void;
  destinations: Destination[];
  defaultDestinationId: string | null;
  savingDestination: boolean;
  deletingDestination: boolean;
  onSaveDestination: (form: DestinationFormState, destinationId: string | null) => Promise<void>;
  onDeleteDestination: (destination: Destination) => void;
};

export function AdminBackupDestinationsManageModal({
  opened,
  onClose,
  destinations,
  defaultDestinationId,
  savingDestination,
  deletingDestination,
  onSaveDestination,
  onDeleteDestination,
}: Props) {
  const [editDestination, setEditDestination] = useState<Destination | null>(null);
  const [formOpened, setFormOpened] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Destination | null>(null);

  const openAdd = () => {
    setEditDestination(null);
    setFormOpened(true);
  };

  const openEdit = (d: Destination) => {
    setEditDestination(d);
    setFormOpened(true);
  };

  const closeForm = () => {
    setFormOpened(false);
    setEditDestination(null);
  };

  return (
    <>
      <Modal opened={opened} onClose={onClose} title="Manage destinations" size="lg">
        <Stack gap="md">
          <Group justify="flex-end">
            <Button size="xs" onClick={openAdd}>
              Add destination
            </Button>
          </Group>
          <Table withTableBorder withColumnBorders className="admin-table-hover">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Enabled</Table.Th>
                <Table.Th>Default</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {destinations.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      No destinations configured.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                destinations.map((d) => (
                  <Table.Tr key={d.id}>
                    <Table.Td>{d.name}</Table.Td>
                    <Table.Td>{d.type === 'S3_COMPATIBLE' ? 'S3' : 'SSH'}</Table.Td>
                    <Table.Td>{d.enabled ? 'yes' : 'no'}</Table.Td>
                    <Table.Td>{defaultDestinationId === d.id ? 'yes' : '–'}</Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Button size="xs" variant="subtle" onClick={() => openEdit(d)}>
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => setDeleteTarget(d)}
                        >
                          Delete
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Modal>

      <AdminBackupDestinationModal
        opened={formOpened}
        onClose={closeForm}
        destination={editDestination}
        saving={savingDestination}
        onSave={(form, destinationId) => {
          void onSaveDestination(form, destinationId).then(() => closeForm());
        }}
      />

      <Modal
        opened={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="Delete destination"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Delete destination <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={deletingDestination}
              onClick={() => {
                if (deleteTarget) {
                  onDeleteDestination(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
