import { Badge, Button, Group, Loader, Table, Text } from '@mantine/core';
import { BACKUP_STATUS_COLOR, type BackupRun } from './adminBackupTypes';

type Props = {
  runs: BackupRun[] | undefined;
  loading: boolean;
  downloadLoading: boolean;
  onDownload: (id: string) => void;
};

export function AdminBackupHistorySection({ runs, loading, downloadLoading, onDownload }: Props) {
  const items = runs ?? [];

  return (
    <>
      <Group mb="xs" justify="space-between">
        <Text size="sm" c="dimmed">
          {items.length} backup(s)
        </Text>
      </Group>
      {loading ? (
        <Loader size="sm" />
      ) : (
        <Table withTableBorder withColumnBorders className="admin-table-hover">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Started</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Trigger</Table.Th>
              <Table.Th>Destination</Table.Th>
              <Table.Th>Size</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text size="sm" c="dimmed">
                    No backups yet.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map((run) => (
                <Table.Tr key={run.id}>
                  <Table.Td>
                    <Text size="sm">{new Date(run.createdAt).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={BACKUP_STATUS_COLOR[run.status] ?? 'gray'} variant="light">
                      {run.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{run.triggerSource}</Table.Td>
                  <Table.Td>{run.destination?.name ?? '–'}</Table.Td>
                  <Table.Td>
                    {run.sizeBytes != null ? `${Math.round(run.sizeBytes / 1024)} KB` : '–'}
                  </Table.Td>
                  <Table.Td>
                    {run.status === 'succeeded' && run.localObjectKey ? (
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => onDownload(run.id)}
                        loading={downloadLoading}
                      >
                        Download
                      </Button>
                    ) : null}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      )}
    </>
  );
}
