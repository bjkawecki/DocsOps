import { Table, Text } from '@mantine/core';
import type { BroadcastHistoryItem } from './adminBroadcastTypes.js';
import { broadcastTargetLabel, formatLocalDateTime } from './adminBroadcastTypes.js';

type AdminBroadcastTableSectionProps = {
  items: BroadcastHistoryItem[];
  loading: boolean;
};

export function AdminBroadcastTableSection({ items, loading }: AdminBroadcastTableSectionProps) {
  if (loading) return null;

  return (
    <Table withTableBorder withColumnBorders className="admin-table-hover">
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Sent</Table.Th>
          <Table.Th>Title</Table.Th>
          <Table.Th>Audience</Table.Th>
          <Table.Th>Recipients</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={4}>
              <Text size="sm" c="dimmed">
                No sent messages yet.
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
