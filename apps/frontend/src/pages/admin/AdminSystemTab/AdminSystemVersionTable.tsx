import { Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AdminSystemUpdateStatus } from 'backend/api-types';

type Props = {
  status: AdminSystemUpdateStatus;
};

export function AdminSystemVersionTable({ status }: Props) {
  const { t } = useTranslation('admin');
  const latestLabel =
    !status.updateCheckEnabled || status.checkError
      ? '–'
      : status.latestVersion != null
        ? `v${status.latestVersion}`
        : t('system.versionTable.unknown');

  return (
    <Table withTableBorder withColumnBorders className="admin-table-hover">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('system.versionTable.installed')}</Table.Th>
          <Table.Th>{t('system.versionTable.latestRelease')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td>
            <Text size="sm" fw={600}>
              v{status.installedVersion}
            </Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{latestLabel}</Text>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
}
