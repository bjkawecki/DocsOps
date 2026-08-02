import { Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { BroadcastHistoryItem } from './adminBroadcastTypes.js';
import { useBroadcastTargetLabel, formatLocalDateTime } from './adminBroadcastTypes.js';

type AdminBroadcastTableSectionProps = {
  items: BroadcastHistoryItem[];
  loading: boolean;
};

export function AdminBroadcastTableSection({ items, loading }: AdminBroadcastTableSectionProps) {
  const { t } = useTranslation('admin');
  const broadcastTargetLabel = useBroadcastTargetLabel();
  if (loading) return null;

  return (
    <Table withTableBorder withColumnBorders className="admin-table-hover">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t('broadcast.table.sent')}</Table.Th>
          <Table.Th>{t('broadcast.table.title')}</Table.Th>
          <Table.Th>{t('broadcast.table.audience')}</Table.Th>
          <Table.Th>{t('broadcast.table.recipients')}</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={4}>
              <Text size="sm" c="dimmed">
                {t('broadcast.table.empty')}
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          items.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Text size="sm">
                  {item.sentAt != null
                    ? formatLocalDateTime(item.sentAt)
                    : formatLocalDateTime(item.createdAt)}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" fw={600}>
                  {item.title}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {item.message}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{broadcastTargetLabel(item.targetKind)}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{item.deliveredCount}</Text>
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}
