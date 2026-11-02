import { Badge, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AdminSystemRuntime, AdminSystemUpdateStatus } from 'backend/api-types';

type Props = {
  status: AdminSystemUpdateStatus;
  runtime: AdminSystemRuntime | undefined;
};

function valueOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '–';
}

export function AdminSystemVersionTable({ status, runtime }: Props) {
  const { t } = useTranslation('admin');
  const latestLabel =
    !status.updateCheckEnabled || status.checkError
      ? '–'
      : status.latestVersion != null
        ? `v${status.latestVersion}`
        : t('system.versionTable.unknown');

  const workerLabel = runtime
    ? runtime.workerConnected
      ? t('system.versionTable.workerConnected')
      : t('system.versionTable.workerDisconnected')
    : '–';
  const minioLabel = runtime
    ? runtime.minioAvailable
      ? t('system.versionTable.minioAvailable')
      : t('system.versionTable.minioUnavailable')
    : '–';

  const pgDumpValue = valueOrDash(runtime?.pgDumpVersion);
  const showMismatch = runtime?.pgDumpCompatible === false;

  return (
    <Table withTableBorder withColumnBorders className="admin-table-hover">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('system.versionTable.component')}</Table.Th>
          <Table.Th>{t('system.versionTable.value')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        <Table.Tr>
          <Table.Td>
            <Text size="sm">{t('system.versionTable.docsops')}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm" fw={600}>
              v{status.installedVersion}
            </Text>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>
            <Text size="sm">{t('system.versionTable.latestRelease')}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{latestLabel}</Text>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>
            <Text size="sm">{t('system.versionTable.postgres')}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{valueOrDash(runtime?.postgresVersion)}</Text>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>
            <Text size="sm">{t('system.versionTable.pgDump')}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm" component="span">
              {pgDumpValue}
            </Text>
            {showMismatch ? (
              <Badge color="red" variant="filled" ml="sm" size="sm">
                {t('system.versionTable.pgDumpMismatch')}
              </Badge>
            ) : null}
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>
            <Text size="sm">{t('system.versionTable.worker')}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{workerLabel}</Text>
          </Table.Td>
        </Table.Tr>
        <Table.Tr>
          <Table.Td>
            <Text size="sm">{t('system.versionTable.minio')}</Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm">{minioLabel}</Text>
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
}
