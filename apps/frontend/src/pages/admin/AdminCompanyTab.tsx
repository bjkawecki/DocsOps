import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Text,
  Loader,
  Alert,
  Group,
  Button,
  Stack,
  Card,
  Modal,
  Table,
  Tabs,
  TextInput,
  Select,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { apiFetch } from '../../api/client';
import { useSetAppShellBreadcrumbActions } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import type { Company } from 'backend/api-types';
import { CompanyForm } from './AdminCompanyForm';
import { CompanyPdfBrandingForm } from '../../components/organisation/CompanyPdfBrandingForm.js';

type CompaniesRes = { items: Company[]; total: number; limit: number; offset: number };
type AssignmentListRes = {
  items: { id: string; name: string }[];
  total: number;
  limit: number;
  offset: number;
};
type AdminUsersRes = { items: { id: string; name: string; email: string | null }[]; total: number };
type CompanyStatsRes = {
  storageBytesUsed: number;
  departmentCount: number;
  teamCount: number;
  memberCount: number;
  documentCount: number;
  processCount: number;
  projectCount: number;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminCompanyTab() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyCardEditing, setCompanyCardEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLeadId, setEditLeadId] = useState('');
  const [deleteConfirmCompany, setDeleteConfirmCompany] = useState<Company | null>(null);

  const { data: companiesData, isPending: companiesPending } = useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<CompaniesRes> => {
      const res = await apiFetch('/api/v1/companies?limit=100');
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as CompaniesRes;
    },
  });

  const companies = useMemo(() => companiesData?.items ?? [], [companiesData?.items]);
  const companyIds = useMemo(() => companies.map((c) => c.id), [companies]);

  const { data: leadsBatchData } = useQuery({
    queryKey: ['companies', 'leads-batch', companyIds.join(',')],
    queryFn: async (): Promise<Record<string, { id: string; name: string }[]>> => {
      const entries = await Promise.all(
        companyIds.map(async (cid) => {
          const res = await apiFetch(`/api/v1/companies/${cid}/company-leads?limit=100`);
          const items = res.ok ? ((await res.json()) as AssignmentListRes).items : [];
          return [cid, items] as const;
        })
      );
      return Object.fromEntries(entries);
    },
    enabled: companyIds.length > 0,
  });

  const { data: leadsForEditData, isPending: leadsForEditPending } = useQuery({
    queryKey: ['companies', editingCompany?.id, 'company-leads'],
    queryFn: async (): Promise<AssignmentListRes> => {
      const res = await apiFetch(`/api/v1/companies/${editingCompany!.id}/company-leads?limit=100`);
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as AssignmentListRes;
    },
    enabled: !!editingCompany?.id,
  });
  const leadsForEdit = leadsForEditData?.items ?? [];

  const { data: adminUsersData } = useQuery({
    queryKey: ['admin', 'users', 'list'],
    queryFn: async (): Promise<AdminUsersRes> => {
      const res = await apiFetch('/api/v1/admin/users?limit=100&includeDeactivated=false');
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as AdminUsersRes;
    },
    enabled: !!editingCompany?.id,
  });
  const userOptions = useMemo(
    () => (adminUsersData?.items ?? []).map((u) => ({ value: u.id, label: u.name })),
    [adminUsersData?.items]
  );

  const { data: companyStatsData, isPending: companyStatsPending } = useQuery({
    queryKey: ['admin', 'companies', editingCompany?.id, 'stats'],
    queryFn: async (): Promise<CompanyStatsRes> => {
      const res = await apiFetch(`/api/v1/admin/companies/${editingCompany!.id}/stats`);
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as CompanyStatsRes;
    },
    enabled: !!editingCompany?.id,
  });

  const invalidateCompanies = () => void queryClient.invalidateQueries({ queryKey: ['companies'] });
  const invalidateLeads = (cid: string) => {
    void queryClient.invalidateQueries({ queryKey: ['companies', cid, 'company-leads'] });
    void queryClient.invalidateQueries({ queryKey: ['companies', 'leads-batch'] });
  };

  const createCompany = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiFetch('/api/v1/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as Company;
    },
    onSuccess: () => {
      invalidateCompanies();
      closeCreate();
      notifications.show({
        title: t('company.toasts.createdTitle'),
        message: t('company.toasts.createdMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await apiFetch(`/api/v1/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as Company;
    },
    onSuccess: (_, variables) => {
      invalidateCompanies();
      setEditingCompany((prev) =>
        prev && prev.id === variables.id ? { ...prev, name: variables.name } : prev
      );
      setCompanyCardEditing(false);
      notifications.show({
        title: t('company.toasts.updatedTitle'),
        message: t('company.toasts.updatedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: () => {
      invalidateCompanies();
      setDeleteConfirmCompany(null);
      notifications.show({
        title: t('company.toasts.deletedTitle'),
        message: t('company.toasts.deletedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const addLead = useMutation({
    mutationFn: async ({ companyId, userId }: { companyId: string; userId: string }) => {
      const res = await apiFetch(`/api/v1/companies/${companyId}/company-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: (_, { companyId }) => {
      invalidateLeads(companyId);
      notifications.show({
        title: t('company.toasts.leadAddedTitle'),
        message: t('company.toasts.leadAddedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const removeLead = useMutation({
    mutationFn: async ({ companyId, userId }: { companyId: string; userId: string }) => {
      const res = await apiFetch(`/api/v1/companies/${companyId}/company-leads/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: (_, { companyId }) => {
      invalidateLeads(companyId);
      notifications.show({
        title: t('company.toasts.leadRemovedTitle'),
        message: t('company.toasts.leadRemovedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const chromeActions = useMemo(
    () => (
      <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openCreate}>
        {t('actions.createCompany')}
      </Button>
    ),
    [openCreate, t]
  );
  useSetAppShellBreadcrumbActions(chromeActions, 'admin-company-create');

  if (companiesPending) {
    return (
      <Box>
        <Loader size="sm" />
      </Box>
    );
  }

  return (
    <Box>
      {companies.length === 0 ? (
        <Alert color="blue" mb="md">
          {t('company.noCompanyAlert')}
        </Alert>
      ) : (
        <Table withTableBorder withColumnBorders mb="md" className="admin-table-hover">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('company.table.company')}</Table.Th>
              <Table.Th>{t('company.table.lead')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {companies.map((c) => {
              const leadNames = leadsBatchData?.[c.id]?.map((u) => u.name) ?? [];
              const leadText = leadNames.length > 0 ? leadNames.join(', ') : '–';
              return (
                <Table.Tr key={c.id}>
                  <Table.Td>
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
                      onClick={() => {
                        setEditingCompany(c);
                        setCompanyCardEditing(false);
                      }}
                    >
                      {c.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>{leadText}</Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={t('actions.createCompany')}
        size="sm"
      >
        <CompanyForm
          initialName=""
          onSubmit={(name) => createCompany.mutate(name)}
          onCancel={closeCreate}
          loading={createCompany.isPending}
        />
      </Modal>

      {editingCompany && (
        <Modal
          opened
          onClose={() => setEditingCompany(null)}
          title={t('company.editModal.title', { name: editingCompany.name })}
          size="lg"
          key={editingCompany.id}
        >
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview">{t('company.editModal.tabs.overview')}</Tabs.Tab>
              <Tabs.Tab value="pdf">{t('company.editModal.tabs.pdfBranding')}</Tabs.Tab>
              <Tabs.Tab value="manage">{t('company.editModal.tabs.manage')}</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview" pt="md">
              <Card withBorder padding="md">
                <Group justify="space-between" mb="md">
                  <Text size="sm" fw={600}>
                    {t('company.editModal.card.title')}
                  </Text>
                  {!companyCardEditing && (
                    <Button
                      size="xs"
                      variant="filled"
                      leftSection={<IconPencil size={14} />}
                      onClick={() => {
                        setEditName(editingCompany.name);
                        setEditLeadId(leadsForEdit[0]?.id ?? '');
                        setCompanyCardEditing(true);
                      }}
                    >
                      {t('common:actions.edit')}
                    </Button>
                  )}
                </Group>
                {companyCardEditing ? (
                  <Stack gap="md">
                    <TextInput
                      label={t('shared.name')}
                      value={editName}
                      onChange={(e) => setEditName(e.currentTarget.value)}
                      required
                    />
                    <Select
                      label={t('shared.lead')}
                      placeholder={t('company.editModal.card.leadPlaceholder')}
                      data={userOptions}
                      value={editLeadId || null}
                      onChange={(v) => setEditLeadId(v ?? '')}
                      searchable
                      clearable
                    />
                    <Group gap="xs">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setCompanyCardEditing(false)}
                      >
                        {t('common:actions.cancel')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const name = editName.trim();
                          if (!name) return;
                          void (async () => {
                            try {
                              if (name !== editingCompany.name) {
                                await updateCompany.mutateAsync({ id: editingCompany.id, name });
                              }
                              const currentIds = leadsForEdit.map((u) => u.id);
                              const targetLeadId = editLeadId || null;
                              for (const userId of currentIds) {
                                if (userId !== targetLeadId) {
                                  await removeLead.mutateAsync({
                                    companyId: editingCompany.id,
                                    userId,
                                  });
                                }
                              }
                              if (targetLeadId && !currentIds.includes(targetLeadId)) {
                                await addLead.mutateAsync({
                                  companyId: editingCompany.id,
                                  userId: targetLeadId,
                                });
                              }
                              setEditingCompany((prev) =>
                                prev && prev.id === editingCompany.id ? { ...prev, name } : prev
                              );
                              invalidateLeads(editingCompany.id);
                              setCompanyCardEditing(false);
                            } catch {
                              // notifications from mutations
                            }
                          })();
                        }}
                        loading={
                          updateCompany.isPending || addLead.isPending || removeLead.isPending
                        }
                        disabled={!editName.trim()}
                      >
                        {t('common:actions.save')}
                      </Button>
                    </Group>
                  </Stack>
                ) : leadsForEditPending ? (
                  <Loader size="sm" />
                ) : (
                  <Stack gap="xs">
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.name')}
                      </Text>
                      <Text size="sm">{editingCompany.name}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.lead')}
                      </Text>
                      <Text size="sm">
                        {leadsForEdit.length === 0 ? '–' : (leadsForEdit[0]?.name ?? '–')}
                      </Text>
                    </div>
                  </Stack>
                )}
              </Card>
              <Card withBorder padding="md" mt="md">
                <Text size="sm" fw={600} mb="xs">
                  {t('shared.stats')}
                </Text>
                {companyStatsPending ? (
                  <Loader size="sm" />
                ) : companyStatsData ? (
                  <Group gap="lg">
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.storage')}
                      </Text>
                      <Text size="sm">{formatBytes(companyStatsData.storageBytesUsed)}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('nav.departments')}
                      </Text>
                      <Text size="sm">{companyStatsData.departmentCount}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.teams')}
                      </Text>
                      <Text size="sm">{companyStatsData.teamCount}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.members')}
                      </Text>
                      <Text size="sm">{companyStatsData.memberCount}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.documents')}
                      </Text>
                      <Text size="sm">{companyStatsData.documentCount}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.processes')}
                      </Text>
                      <Text size="sm">{companyStatsData.processCount}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('shared.projects')}
                      </Text>
                      <Text size="sm">{companyStatsData.projectCount}</Text>
                    </div>
                  </Group>
                ) : null}
              </Card>
            </Tabs.Panel>
            <Tabs.Panel value="pdf" pt="md">
              <Card withBorder padding="md">
                <CompanyPdfBrandingForm companyId={editingCompany.id} />
              </Card>
            </Tabs.Panel>
            <Tabs.Panel value="manage" pt="md">
              <Card withBorder padding="md">
                <Text size="sm" fw={600} mb="xs">
                  {t('shared.manage')}
                </Text>
                <Text size="xs" c="dimmed" mb="md">
                  {t('shared.manageHint')}
                </Text>
                <Button
                  size="sm"
                  variant="filled"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setDeleteConfirmCompany(editingCompany)}
                  loading={deleteCompany.isPending}
                >
                  {t('company.editModal.manage.deleteButton')}
                </Button>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </Modal>
      )}

      <Modal
        opened={!!deleteConfirmCompany}
        onClose={() => setDeleteConfirmCompany(null)}
        title={t('company.deleteModal.title')}
        size="sm"
      >
        {deleteConfirmCompany && (
          <Stack>
            <Text size="sm">
              {t('company.deleteModal.body', { name: deleteConfirmCompany.name })}
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleteConfirmCompany(null)}>
                {t('common:actions.cancel')}
              </Button>
              <Button
                color="red"
                onClick={() => deleteCompany.mutate(deleteConfirmCompany.id)}
                loading={deleteCompany.isPending}
              >
                {t('common:actions.delete')}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
