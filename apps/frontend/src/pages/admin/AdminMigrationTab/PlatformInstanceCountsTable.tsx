import { Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { PlatformInstanceCounts } from './adminMigrationTypes';

const INSTANCE_COUNT_COLUMNS: { key: keyof PlatformInstanceCounts; labelKey: string }[] = [
  { key: 'companies', labelKey: 'migration.instanceCounts.columns.company' },
  { key: 'departments', labelKey: 'migration.instanceCounts.columns.departments' },
  { key: 'teams', labelKey: 'migration.instanceCounts.columns.teams' },
  { key: 'users', labelKey: 'migration.instanceCounts.columns.users' },
  { key: 'processes', labelKey: 'migration.instanceCounts.columns.processes' },
  { key: 'projects', labelKey: 'migration.instanceCounts.columns.projects' },
  { key: 'subcontexts', labelKey: 'migration.instanceCounts.columns.subcontexts' },
  { key: 'documents', labelKey: 'migration.instanceCounts.columns.documents' },
  { key: 'attachmentFiles', labelKey: 'migration.instanceCounts.columns.files' },
];

type Props = {
  instanceEmpty: boolean;
  counts: PlatformInstanceCounts;
};

export function PlatformInstanceCountsTable({ instanceEmpty, counts }: Props) {
  const { t } = useTranslation('admin');
  return (
    <>
      {instanceEmpty ? (
        <Text size="sm" c="dimmed" mb="xs">
          {t('migration.instanceCounts.emptyHint')}
        </Text>
      ) : null}
      <Table withTableBorder withColumnBorders className="admin-table-hover">
        <Table.Thead>
          <Table.Tr>
            {INSTANCE_COUNT_COLUMNS.map((column) => (
              <Table.Th key={column.key}>{t(column.labelKey)}</Table.Th>
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
