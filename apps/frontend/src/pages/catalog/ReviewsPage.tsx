import { Badge, Box, Container, Flex, Paper, Table, Text } from '@mantine/core';
import { IconClipboardCheck } from '@tabler/icons-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSetAppShellBreadcrumbs } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { useMeReviews, type ReviewPendingSuggestionsItem } from '../../hooks/useMeReviews';
import { formatTableDate } from '../../lib/formatDate';
import { ReviewsScopeSidebar, type ReviewsSidebarDoc } from './ReviewsScopeSidebar.js';

function documentDraftLink(documentId: string): string {
  return `/documents/${documentId}?mode=edit&tab=draft`;
}

function scopeKeyForReview(item: ReviewPendingSuggestionsItem): string {
  return `${item.scopeType}:${item.scopeId ?? 'none'}`;
}

function PendingReviewsTable({
  items,
  emptyLabel,
}: {
  items: ReviewPendingSuggestionsItem[];
  emptyLabel: string;
}) {
  return (
    <Table withTableBorder className="dense-list-table">
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
        {items.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={5}>
              <Text size="sm" c="dimmed">
                {emptyLabel}
              </Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          items.map((item) => (
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
                  {item.lastSuggestionAt ? formatTableDate(item.lastSuggestionAt) : '–'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))
        )}
      </Table.Tbody>
    </Table>
  );
}

/** Reviews inbox: left scope/doc nav + pending-review table (same chrome as Shared). */
export function ReviewsPage() {
  useSetAppShellBreadcrumbs([
    {
      key: 'reviews',
      label: 'Reviews',
      icon: <IconClipboardCheck size={14} stroke={1.5} />,
    },
  ]);
  useSetAppShellNavScope(null);

  const { data, isPending, isError } = useMeReviews({ limit: 100, offset: 0 });

  const pending = data?.pendingForReview ?? [];

  const sidebarDocs: ReviewsSidebarDoc[] = useMemo(
    () =>
      (data?.pendingForReview ?? []).map((item) => ({
        id: item.documentId,
        title: item.documentTitle?.trim() || 'Untitled',
        scopeKey: scopeKeyForReview(item),
        scopeLabel: item.scopeName?.trim() || 'Other',
      })),
    [data?.pendingForReview]
  );

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 'md', lg: 'lg' }}
          align="flex-start"
        >
          <ReviewsScopeSidebar documents={sidebarDocs} />

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {isError ? (
              <Text size="sm" c="red">
                Could not load reviews.
              </Text>
            ) : isPending ? (
              <Text size="sm" c="dimmed">
                Loading…
              </Text>
            ) : (
              <PendingReviewsTable
                items={pending}
                emptyLabel="No documents with pending suggestions in your scopes."
              />
            )}
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}
