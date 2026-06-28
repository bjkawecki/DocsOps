import { Badge, Box, Group, Pagination, Stack, Table, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { useMeReviews, type ReviewPendingSuggestionsItem } from '../../hooks/useMeReviews';
import { formatTableDate } from '../../lib/formatDate';

const PAGE_SIZE = 20;

function documentDraftLink(documentId: string): string {
  return `/documents/${documentId}?mode=edit&tab=draft`;
}

function PendingReviewsTable({
  items,
  emptyLabel,
}: {
  items: ReviewPendingSuggestionsItem[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {emptyLabel}
      </Text>
    );
  }

  return (
    <Table striped highlightOnHover withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Document</Table.Th>
          <Table.Th>Scope</Table.Th>
          <Table.Th>Pending</Table.Th>
          <Table.Th>Authors</Table.Th>
          <Table.Th>Last suggestion</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.documentId}>
            <Table.Td>
              <Text
                component={Link}
                to={documentDraftLink(item.documentId)}
                size="sm"
                fw={500}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {item.documentTitle}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{item.scopeName}</Text>
            </Table.Td>
            <Table.Td>
              <Badge size="sm" variant="light" color="yellow">
                {item.pendingSuggestionCount}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{item.authorIds.length}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">
                {item.lastSuggestionAt ? formatTableDate(item.lastSuggestionAt) : '—'}
              </Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function ReviewsPage() {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * PAGE_SIZE;
  const { data, isPending, isError } = useMeReviews({ limit: PAGE_SIZE, offset });

  const pending = data?.pendingForReview ?? [];
  const totalPages = Math.max(Math.ceil((data?.totalPendingForReview ?? 0) / PAGE_SIZE), 1);

  return (
    <Box>
      <PageHeader
        title="Reviews"
        description="Documents in your scopes with pending inline draft suggestions from scope authors."
      />
      <Stack gap="md">
        {isError && (
          <Text size="sm" c="red">
            Could not load reviews.
          </Text>
        )}
        {isPending ? (
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        ) : (
          <PendingReviewsTable
            items={pending}
            emptyLabel="No documents with pending suggestions in your scopes."
          />
        )}
        {!isPending && totalPages > 1 && (
          <Group justify="center">
            <Pagination total={totalPages} value={page} onChange={setPage} />
          </Group>
        )}
      </Stack>
    </Box>
  );
}
