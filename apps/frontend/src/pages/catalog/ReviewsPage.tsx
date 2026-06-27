import { Badge, Box, Group, Pagination, Stack, Table, Tabs, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useMeReviews,
  type ReviewDraftChangeDocumentItem,
  type ReviewMyDraftChangeItem,
} from '../../hooks/useMeReviews';
import { formatTableDate } from '../../lib/formatDate';

const PAGE_SIZE = 20;

function documentDraftLink(documentId: string): string {
  return `/documents/${documentId}?mode=edit&tab=draft`;
}

function PendingReviewsTable({
  items,
  emptyLabel,
}: {
  items: ReviewDraftChangeDocumentItem[];
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
          <Table.Th>Author</Table.Th>
          <Table.Th>Scope</Table.Th>
          <Table.Th>Changes</Table.Th>
          <Table.Th>Last change</Table.Th>
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
              {item.affectedBlockSummary && (
                <Text size="xs" c="dimmed">
                  {item.affectedBlockSummary}
                </Text>
              )}
            </Table.Td>
            <Table.Td>
              <Text size="sm">{item.lastAuthorName ?? 'Unknown'}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{item.scopeName}</Text>
            </Table.Td>
            <Table.Td>
              <Badge size="sm" variant="light">
                {item.changeCount}
              </Badge>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{formatTableDate(item.lastChangeAt)}</Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function MyChangesTable({
  items,
  emptyLabel,
}: {
  items: ReviewMyDraftChangeItem[];
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
          <Table.Th>Revision</Table.Th>
          <Table.Th>Saved</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.changeId}>
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
              {item.affectedBlockSummary && (
                <Text size="xs" c="dimmed">
                  {item.affectedBlockSummary}
                </Text>
              )}
            </Table.Td>
            <Table.Td>
              <Text size="sm">{item.scopeName}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">
                {item.revisionFrom} → {item.revisionTo}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{formatTableDate(item.savedAt)}</Text>
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
  const mine = data?.myChanges ?? [];
  const totalPages =
    Math.max(
      Math.ceil((data?.totalPendingForReview ?? 0) / PAGE_SIZE),
      Math.ceil((data?.totalMyChanges ?? 0) / PAGE_SIZE),
      1
    ) || 1;

  return (
    <Box>
      <PageHeader
        title="Reviews"
        description="Draft changes from scope authors awaiting lead review, and your own saves in the current draft cycle."
      />
      <Stack gap="md">
        {isError && (
          <Text size="sm" c="red">
            Could not load reviews.
          </Text>
        )}
        <Tabs defaultValue="pending">
          <Tabs.List>
            <Tabs.Tab value="pending">
              Pending for review
              {data != null && data.totalPendingForReview > 0
                ? ` (${data.totalPendingForReview})`
                : ''}
            </Tabs.Tab>
            <Tabs.Tab value="mine">
              My draft changes
              {data != null && data.totalMyChanges > 0 ? ` (${data.totalMyChanges})` : ''}
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="pending" pt="md">
            {isPending ? (
              <Text size="sm" c="dimmed">
                Loading…
              </Text>
            ) : (
              <PendingReviewsTable items={pending} emptyLabel="No draft changes in your scopes." />
            )}
          </Tabs.Panel>
          <Tabs.Panel value="mine" pt="md">
            {isPending ? (
              <Text size="sm" c="dimmed">
                Loading…
              </Text>
            ) : (
              <MyChangesTable items={mine} emptyLabel="You have no draft changes in this cycle." />
            )}
          </Tabs.Panel>
        </Tabs>
        {!isPending && totalPages > 1 && (
          <Group justify="center">
            <Pagination total={totalPages} value={page} onChange={setPage} />
          </Group>
        )}
      </Stack>
    </Box>
  );
}
