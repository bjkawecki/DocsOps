import { Table, Text } from '@mantine/core';
import type { PlatformInstanceCounts } from './adminMigrationTypes';

const INSTANCE_COUNT_COLUMNS: { key: keyof PlatformInstanceCounts; label: string }[] = [
  { key: 'companies', label: 'Company' },
  { key: 'departments', label: 'Departments' },
  { key: 'teams', label: 'Teams' },
  { key: 'users', label: 'Users' },
  { key: 'processes', label: 'Processes' },
  { key: 'projects', label: 'Projects' },
  { key: 'subcontexts', label: 'Subcontexts' },
  { key: 'documents', label: 'Documents' },
  { key: 'attachmentFiles', label: 'Files' },
];

type Props = {
  instanceEmpty: boolean;
  counts: PlatformInstanceCounts;
};

export function PlatformInstanceCountsTable({ instanceEmpty, counts }: Props) {
  return (
    <>
      {instanceEmpty ? (
        <Text size="sm" c="dimmed" mb="xs">
          Empty and ready for import (fresh instance, no companies or documents).
        </Text>
      ) : null}
      <Table withTableBorder withColumnBorders className="admin-table-hover">
        <Table.Thead>
          <Table.Tr>
            {INSTANCE_COUNT_COLUMNS.map((column) => (
              <Table.Th key={column.key}>{column.label}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            {INSTANCE_COUNT_COLUMNS.map((column) => (
              <Table.Td key={column.key}>
                <Text size="sm">{counts[column.key]}</Text>
              </Table.Td>
            ))}
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </>
  );
}
