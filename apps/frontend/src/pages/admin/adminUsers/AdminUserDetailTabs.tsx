import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Pagination,
  Stack,
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { IconLock, IconPencil, IconTrash } from '@tabler/icons-react';
import { apiFetch } from '../../../api/client';
import type {
  DepartmentWithTeams,
  UserDocumentsRes,
  UserRow,
  UserStatsRes,
} from './adminUsersTypes';
import { AdminUserAssignmentsDisplay } from './AdminUserAssignmentsDisplay';
import { AdminUserAssignmentsForm } from './AdminUserAssignmentsForm';
import { AdminUserProfileForm } from './AdminUserProfileForm';

type Props = {
  user: UserRow;
  departments: DepartmentWithTeams[];
  activeAdminCount: number | undefined;
  currentUserId: string | null;
  onSaveProfile: (body: {
    name: string;
    email: string | null;
    isAdmin: boolean;
    isCompanyLead: boolean;
    deletedAt: string | null;
  }) => Promise<void>;
  onResetPassword: () => void;
  onDeleteUser: () => void;
  onAssignmentsChange: () => void;
  updateUserPending: boolean;
};

export function AdminUserDetailTabs({
  user,
  departments,
  activeAdminCount,
  currentUserId,
  onSaveProfile,
  onResetPassword,
  onDeleteUser,
  onAssignmentsChange,
  updateUserPending,
}: Props) {
  const { t } = useTranslation('admin');
  const [documentsPage, setDocumentsPage] = useState(0);
  const [profileEditing, setProfileEditing] = useState(false);
  const [assignmentsEditing, setAssignmentsEditing] = useState(false);
  const DOCS_PAGE_SIZE = 10;
  const isLastActiveAdmin = activeAdminCount === 1 && !!user.isAdmin && !user.deletedAt;

  const { data: statsData, isPending: statsPending } = useQuery({
    queryKey: ['admin', 'users', user.id, 'stats'],
    queryFn: async (): Promise<UserStatsRes> => {
      const res = await apiFetch(`/api/v1/admin/users/${user.id}/stats`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as UserStatsRes;
    },
    enabled: !!user.id,
  });

  const { data: docsData, isPending: docsPending } = useQuery({
    queryKey: ['admin', 'users', user.id, 'documents', documentsPage],
    queryFn: async (): Promise<UserDocumentsRes> => {
      const res = await apiFetch(
        `/api/v1/admin/users/${user.id}/documents?limit=${DOCS_PAGE_SIZE}&offset=${documentsPage * DOCS_PAGE_SIZE}`
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as UserDocumentsRes;
    },
    enabled: !!user.id,
  });

  const formatBytes = (n: number) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Tabs defaultValue="details">
      <Tabs.List>
        <Tabs.Tab value="details">{t('users.detail.tabs.overview')}</Tabs.Tab>
        <Tabs.Tab value="documents">{t('users.detail.tabs.documents')}</Tabs.Tab>
        <Tabs.Tab value="danger">{t('users.detail.tabs.account')}</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="details" pt="md">
        <Stack gap="md">
          <Card withBorder padding="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600}>
                {t('users.detail.profile.title')}
              </Text>
              {!profileEditing && (
                <Button
                  size="xs"
                  variant="filled"
                  leftSection={<IconPencil size={14} />}
                  onClick={() => setProfileEditing(true)}
                >
                  {t('common:actions.edit')}
                </Button>
              )}
            </Group>
            {profileEditing ? (
              <AdminUserProfileForm
                user={user}
                onSave={async (body) => {
                  await onSaveProfile(body);
                  setProfileEditing(false);
                }}
                onCancel={() => setProfileEditing(false)}
                isPending={updateUserPending}
                isLastActiveAdmin={isLastActiveAdmin}
              />
            ) : (
              <Stack gap="xs">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('users.detail.profile.fields.name')}
                  </Text>
                  <Text size="sm">{user.name}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('users.detail.profile.fields.email')}
                  </Text>
                  <Text size="sm">{user.email ?? '–'}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('users.detail.profile.fields.status')}
                  </Text>
                  <Group gap="xs" mt={4}>
                    {user.deletedAt ? (
                      <Badge size="sm" color="gray">
                        {t('shared.statusDeactivated')}
                      </Badge>
                    ) : (
                      <Badge size="sm" color="green">
                        {t('common:status.active')}
                      </Badge>
                    )}
                    {user.role === 'Company Lead' && (
                      <Badge size="sm" color="violet" variant="filled">
                        {t('roles.companyLead')}
                      </Badge>
                    )}
                    {user.isAdmin && (
                      <Badge size="sm" color="blue" variant="filled">
                        {t('roles.admin')}
                      </Badge>
                    )}
                  </Group>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('users.detail.profile.fields.userId')}
                  </Text>
                  <Text size="sm" style={{ wordBreak: 'break-all' }}>
                    {user.id}
                  </Text>
                </div>
              </Stack>
            )}
          </Card>
          <Card withBorder padding="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600}>
                {t('users.detail.assignments.title')}
              </Text>
              {!assignmentsEditing && (
                <Button
                  size="xs"
                  variant="filled"
                  leftSection={<IconPencil size={14} />}
                  onClick={() => setAssignmentsEditing(true)}
                >
                  {t('common:actions.edit')}
                </Button>
              )}
            </Group>
            {assignmentsEditing ? (
              <AdminUserAssignmentsForm
                user={user}
                departments={departments}
                onSave={() => {
                  setAssignmentsEditing(false);
                  onAssignmentsChange();
                }}
                onCancel={() => setAssignmentsEditing(false)}
              />
            ) : (
              <AdminUserAssignmentsDisplay user={user} />
            )}
          </Card>
          <Card withBorder padding="md">
            <Text size="sm" fw={600} mb="xs">
              {t('users.detail.usage.title')}
            </Text>
            {statsPending ? (
              <Loader size="sm" />
            ) : statsData ? (
              <Group gap="lg">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('users.detail.usage.storage')}
                  </Text>
                  <Text size="sm">{formatBytes(statsData.storageBytesUsed)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('users.detail.usage.authored')}
                  </Text>
                  <Text size="sm">{statsData.documentsAsWriterCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('users.detail.usage.drafts')}
                  </Text>
                  <Text size="sm">{statsData.draftsCount}</Text>
                </div>
              </Group>
            ) : null}
          </Card>
        </Stack>
      </Tabs.Panel>

      <Tabs.Panel value="danger" pt="md">
        <Card withBorder padding="md">
          <Text size="sm" fw={600} mb="xs">
            {t('users.detail.account.title')}
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            {t('users.detail.account.hint')}
          </Text>
          <Stack gap="md">
            {!user.deletedAt && (
              <Group align="center" gap="sm">
                <Button
                  size="sm"
                  variant="filled"
                  color="orange"
                  leftSection={<IconLock size={14} />}
                  onClick={onResetPassword}
                >
                  {t('users.detail.account.resetPasswordButton')}
                </Button>
                <Text size="xs" c="dimmed">
                  {t('users.detail.account.resetPasswordHint')}
                </Text>
              </Group>
            )}
            <Group align="center" gap="sm">
              <Button
                size="sm"
                variant="filled"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={onDeleteUser}
                disabled={currentUserId === user.id}
              >
                {t('users.detail.account.deleteButton')}
              </Button>
              <Text size="xs" c="dimmed">
                {currentUserId === user.id
                  ? t('users.detail.account.deleteHintSelf')
                  : t('users.detail.account.deleteHintOther')}
              </Text>
            </Group>
          </Stack>
        </Card>
      </Tabs.Panel>

      <Tabs.Panel value="documents" pt="md">
        {docsPending ? (
          <Loader size="sm" />
        ) : docsData ? (
          <Stack gap="sm">
            {docsData.items.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t('users.detail.documents.empty')}
              </Text>
            ) : (
              <>
                <Table withTableBorder className="admin-table-hover dense-list-table">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('users.detail.documents.titleHeader')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {docsData.items.map((d) => (
                      <Table.Tr key={d.id}>
                        <Table.Td>
                          <Text component={Link} to={`/documents/${d.id}`} size="sm">
                            {d.title}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {docsData.total > DOCS_PAGE_SIZE && (
                  <Pagination
                    total={Math.ceil(docsData.total / DOCS_PAGE_SIZE)}
                    value={documentsPage + 1}
                    onChange={(p) => setDocumentsPage(p - 1)}
                    size="sm"
                  />
                )}
              </>
            )}
          </Stack>
        ) : null}
      </Tabs.Panel>
    </Tabs>
  );
}
