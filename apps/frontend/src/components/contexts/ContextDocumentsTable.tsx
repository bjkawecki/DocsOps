import { Badge, Group, Pagination, Select, Stack, Table, Text, TextInput } from '@mantine/core';
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatTableDate } from '../../lib/formatDate';
import { ContentLink } from '../ui/ContentLink';
import { SortableTableTh } from '../ui/SortableTableTh';

export type ContextDocumentsTableRow = {
  id: string;
  title: string;
  updatedAt: string;
  documentTags: { tag: { id: string; name: string } }[];
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;

const SEARCH_KEY = 'docsSearch';
const LIMIT_KEY = 'docsLimit';

export function readDocsListLimit(searchParams: URLSearchParams): number {
  const limitParam = searchParams.get(LIMIT_KEY);
  if (!limitParam) return DEFAULT_PAGE_SIZE;
  return Math.min(100, Math.max(1, parseInt(limitParam, 10) || DEFAULT_PAGE_SIZE));
}

export function readDocsListPage(searchParams: URLSearchParams): number {
  return Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
}

export function ContextDocumentsTable({
  documents,
  total,
  emptyMessage = 'No documents yet.',
}: {
  /** Current server page of documents. */
  documents: ContextDocumentsTableRow[];
  /** Server total (all pages). */
  total: number;
  /** Shown when there are no documents at all (not merely search miss). */
  emptyMessage?: string;
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const localSearch = searchParams.get(SEARCH_KEY) ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'updatedAt';
  const sortOrder = searchParams.get('sortOrder') ?? 'desc';
  const page = readDocsListPage(searchParams);
  const limit = readDocsListLimit(searchParams);
  const totalPages = Math.ceil(total / limit) || 1;

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value == null || value === '') next.delete(key);
        else next.set(key, value);
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const setSort = useCallback(
    (col: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const order = sortBy === col && sortOrder === 'desc' ? 'asc' : 'desc';
        next.set('sortBy', col);
        next.set('sortOrder', order);
        next.delete('page');
        return next;
      });
    },
    [setSearchParams, sortBy, sortOrder]
  );

  const setPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p <= 1) next.delete('page');
        else next.set('page', String(p));
        return next;
      });
    },
    [setSearchParams]
  );

  const setPageSize = useCallback(
    (value: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(LIMIT_KEY, String(value));
        next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const sortedItems = useMemo(() => {
    const list = [...documents];
    if (sortBy === 'title') {
      list.sort((a, b) => {
        const c = (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
        return sortOrder === 'asc' ? c : -c;
      });
    } else if (sortBy === 'updatedAt') {
      list.sort((a, b) => {
        const c = (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '');
        return sortOrder === 'asc' ? c : -c;
      });
    }
    return list;
  }, [documents, sortBy, sortOrder]);

  const searchLower = localSearch.trim().toLowerCase();
  const filteredItems = useMemo(
    () =>
      searchLower
        ? sortedItems.filter((doc) => (doc.title ?? '').toLowerCase().includes(searchLower))
        : sortedItems,
    [sortedItems, searchLower]
  );

  return (
    <Stack gap="md">
      <Group gap="md" wrap="wrap" align="flex-end">
        <TextInput
          label="Search"
          placeholder="Search by name"
          value={localSearch}
          onChange={(e) => setFilter(SEARCH_KEY, e.currentTarget.value)}
          style={{ minWidth: 200 }}
        />
        <Text size="sm" c="dimmed" style={{ marginLeft: 'auto' }}>
          {localSearch.trim()
            ? `${filteredItems.length} of ${total} document${total !== 1 ? 's' : ''}`
            : `${total} document${total !== 1 ? 's' : ''}`}
        </Text>
        <Select
          label="Per page"
          data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
          value={String(limit)}
          onChange={(v) => v && setPageSize(parseInt(v, 10))}
          style={{ width: 90 }}
        />
      </Group>

      <Table withTableBorder className="dense-list-table">
        <Table.Thead>
          <Table.Tr>
            <SortableTableTh
              label="Title"
              column="title"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onClick={() => setSort('title')}
            />
            <Table.Th>Tags</Table.Th>
            <SortableTableTh
              label="Last updated"
              column="updatedAt"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onClick={() => setSort('updatedAt')}
            />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredItems.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={3}>
                <Text size="sm" c="dimmed">
                  {documents.length === 0 ? emptyMessage : 'No documents match the search.'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filteredItems.map((doc) => (
              <Table.Tr
                key={doc.id}
                data-clickable-table-row
                onClick={() => {
                  void navigate(`/documents/${doc.id}`);
                }}
              >
                <Table.Td>
                  <ContentLink to={`/documents/${doc.id}`} style={{ fontWeight: 500 }}>
                    {doc.title}
                  </ContentLink>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {doc.documentTags.map((dt) => (
                      <Badge key={dt.tag.id} size="sm" variant="light" color="gray">
                        {dt.tag.name}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {formatTableDate(doc.updatedAt)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Group justify="flex-end">
        <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
      </Group>
    </Stack>
  );
}
