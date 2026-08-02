import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Pagination,
  SegmentedControl,
  Select,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { AdminUsersSortableTh } from './AdminUsersSortableTh';
import {
  userRoleLabel,
  type ListUsersRes,
  type SortByField,
  type SortOrder,
  type UserRow,
} from './adminUsersTypes';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from './adminUsersConstants';
import { formatUserDepartmentsColumn, formatUserTeamsColumn } from './AdminUserAssignmentsDisplay';

type Props = {
  includeDeactivated: boolean;
  onIncludeDeactivatedChange: (value: boolean) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  limit: number;
  onLimitChange: (next: number) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: ListUsersRes | undefined;
  sortBy: SortByField | null;
  sortOrder: SortOrder;
  onSortColumn: (field: SortByField) => void;
  offset: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEmailClick: (user: UserRow) => void;
};

export function AdminUsersList({
  includeDeactivated,
  onIncludeDeactivatedChange,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  limit,
  onLimitChange,
  isPending,
  isError,
  error,
  data,
  sortBy,
  sortOrder,
  onSortColumn,
  offset,
  totalPages,
  onPageChange,
  onEmailClick,
}: Props) {
  const { t } = useTranslation('admin');
  return (
    <>
      <Group mb="md" justify="space-between" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="wrap">
          <SegmentedControl
            size="xs"
            data={[
              { label: t('users.list.filterAll'), value: 'all' },
              { label: t('users.list.filterActive'), value: 'active' },
            ]}
            value={includeDeactivated ? 'all' : 'active'}
            onChange={(v) => {
              onIncludeDeactivatedChange(v === 'all');
            }}
          />
          <TextInput
            placeholder={t('users.list.searchPlaceholder')}
            size="xs"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          />
          <Button
            size="xs"
            variant="filled"
            onClick={() => {
              onSearchSubmit();
            }}
          >
            {t('common:actions.search')}
          </Button>
        </Group>
        <Group gap="sm" align="flex-end">
          <Text size="sm" c="dimmed">
            {t('users.list.countLine', { count: data?.total ?? 0 })}
          </Text>
          <Select
            label={t('shared.perPage')}
            data={PAGE_SIZE_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(limit)}
            onChange={(value) => {
              const next = Number(value ?? DEFAULT_PAGE_SIZE);
              onLimitChange(next);
            }}
            style={{ width: 100 }}
          />
        </Group>
      </Group>

      {isPending && <Loader size="sm" />}
      {isError && (
        <Alert color="red" title={t('shared.errorTitle')}>
          {error?.message}
        </Alert>
      )}
      {data && !isPending && (
        <>
          <Table withTableBorder className="admin-table-hover dense-list-table">
            <Table.Thead>
              <Table.Tr>
                <AdminUsersSortableTh
                  label={t('users.list.table.name')}
                  currentSortBy={sortBy}
                  sortOrder={sortOrder}
                  field="name"
                  onSort={() => onSortColumn('name')}
                />
                <AdminUsersSortableTh
                  label={t('users.list.table.email')}
                  currentSortBy={sortBy}
                  sortOrder={sortOrder}
                  field="email"
                  onSort={() => onSortColumn('email')}
                />
                <AdminUsersSortableTh
                  label={t('users.list.table.role')}
                  currentSortBy={sortBy}
                  sortOrder={sortOrder}
                  field="role"
                  onSort={() => onSortColumn('role')}
                />
                <AdminUsersSortableTh
                  label={t('users.list.table.teams')}
                  currentSortBy={sortBy}
                  sortOrder={sortOrder}
                  field="teams"
                  onSort={() => onSortColumn('teams')}
                />
                <AdminUsersSortableTh
                  label={t('users.list.table.departments')}
                  currentSortBy={sortBy}
                  sortOrder={sortOrder}
                  field="departments"
                  onSort={() => onSortColumn('departments')}
                />
                <AdminUsersSortableTh
                  label={t('users.list.table.status')}
                  currentSortBy={sortBy}
                  sortOrder={sortOrder}
                  field="deletedAt"
                  onSort={() => onSortColumn('deletedAt')}
                />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.items.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.name}</Table.Td>
                  <Table.Td>
                    {u.email ? (
                      <Text
                        component="button"
                        type="button"
                        variant="link"
                        c="var(--mantine-primary-color-4)"
                        size="sm"
                        className="admin-link-hover"
                        style={{
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                        }}
                        onClick={() => onEmailClick(u)}
                      >
                        {u.email}
                      </Text>
                    ) : (
                      '–'
                    )}
                  </Table.Td>
                  <Table.Td>{userRoleLabel(t, u.role)}</Table.Td>
                  <Table.Td>{formatUserTeamsColumn(t, u)}</Table.Td>
                  <Table.Td>{formatUserDepartmentsColumn(t, u)}</Table.Td>
                  <Table.Td>
                    {u.deletedAt ? (
                      <Badge size="sm" color="gray">
                        {t('shared.statusDeactivated')}
                      </Badge>
                    ) : (
                      <Badge size="sm" color="green">
                        {t('common:status.active')}
                      </Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          {data.items.length === 0 && (
            <Alert color="gray" mt="sm">
              {t('users.list.empty')}
            </Alert>
          )}
          {totalPages > 1 && (
            <Pagination
              total={totalPages}
              value={Math.floor(offset / limit) + 1}
              onChange={(p) => onPageChange(p)}
              mt="md"
              size="sm"
            />
          )}
        </>
      )}
    </>
  );
}
