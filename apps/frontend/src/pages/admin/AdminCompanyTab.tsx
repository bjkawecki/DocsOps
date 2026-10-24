import { useCallback, useMemo, useState } from 'react';
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
  Tabs,
  TextInput,
  Select,
  Title,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { useSetAppShellBreadcrumbActions } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { AdminDemoReadOnlyAlert, useDemoMode } from './AdminDemoReadOnlyAlert.js';
import { adminApiErrorMessage, throwAdminApiError } from './adminApiError.js';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import { type PageMobileAction } from '../../components/ui/PageMobileActionBar.js';
import { useRegisterPageMobileExtraActions } from '../../components/ui/pageMobileNav.js';
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

const COMPANY_TABS = ['overview', 'pdf', 'manage'] as const;
type CompanyTab = (typeof COMPANY_TABS)[number];

function isCompanyTab(value: string | null): value is CompanyTab {
  return value != null && (COMPANY_TABS as readonly string[]).includes(value);
}

function parseCompanyTab(value: string | null): CompanyTab {
  return isCompanyTab(value) ? value : 'overview';
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminCompanyTab() {
  const { t } = useTranslation('admin');
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const demoMode = useDemoMode();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [companyCardEditing, setCompanyCardEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLeadId, setEditLeadId] = useState('');
  const [deleteConfirmCompany, setDeleteConfirmCompany] = useState<Company | null>(null);

  const activeTab = parseCompanyTab(searchParams.get('tab'));
  const setActiveTab = useCallback(
    (value: string | null) => {
      const next = parseCompanyTab(value);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === 'overview') {
            params.delete('tab');
          } else {
            params.set('tab', next);
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const { data: companiesData, isPending: companiesPending } = useQuery({
    queryKey: ['companies'],
    queryFn: async (): Promise<CompaniesRes> => {
      const res = await apiFetch('/api/v1/companies?limit=100');
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as CompaniesRes;
    },
  });

  const companies = useMemo(() => companiesData?.items ?? [], [companiesData?.items]);
  const company = companies[0] ?? null;
  const companyId = company?.id;

  const { data: leadsForEditData, isPending: leadsForEditPending } = useQuery({
    queryKey: ['companies', companyId, 'company-leads'],
    queryFn: async (): Promise<AssignmentListRes> => {
      if (!companyId) throw new Error(t('common:errors.loadFailed'));
      const res = await apiFetch(`/api/v1/companies/${companyId}/company-leads?limit=100`);
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as AssignmentListRes;
    },
    enabled: !!companyId,
  });
  const leadsForEdit = leadsForEditData?.items ?? [];

  const { data: adminUsersData } = useQuery({
    queryKey: ['admin', 'users', 'list'],
    queryFn: async (): Promise<AdminUsersRes> => {
      const res = await apiFetch('/api/v1/admin/users?limit=100&includeDeactivated=false');
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as AdminUsersRes;
    },
    enabled: !!companyId,
  });
  const userOptions = useMemo(
    () => (adminUsersData?.items ?? []).map((u) => ({ value: u.id, label: u.name })),
    [adminUsersData?.items]
  );

  const { data: companyStatsData, isPending: companyStatsPending } = useQuery({
    queryKey: ['admin', 'companies', companyId, 'stats'],
    queryFn: async (): Promise<CompanyStatsRes> => {
      if (!companyId) throw new Error(t('common:errors.loadFailed'));
      const res = await apiFetch(`/api/v1/admin/companies/${companyId}/stats`);
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as CompanyStatsRes;
    },
    enabled: !!companyId,
  });

  const invalidateCompanies = () => void queryClient.invalidateQueries({ queryKey: ['companies'] });
  const invalidateLeads = (cid: string) => {
    void queryClient.invalidateQueries({ queryKey: ['companies', cid, 'company-leads'] });
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
    onSuccess: () => {
      invalidateCompanies();
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
      if (!res.ok) await throwAdminApiError(res);
    },
    onSuccess: () => {
      invalidateCompanies();
      setDeleteConfirmCompany(null);
      setCompanyCardEditing(false);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.delete('tab');
          return params;
        },
        { replace: true }
      );
      notifications.show({
        title: t('company.toasts.deletedTitle'),
        message: t('company.toasts.deletedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({
        title: t('shared.errorTitle'),
        message: adminApiErrorMessage(t, e),
        color: 'red',
      }),
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

  const mobileExtraActions = useMemo(
    (): PageMobileAction[] => [
      {
        key: 'create',
        label: t('actions.createCompany'),
        icon: <IconPlus size={16} stroke={1.5} />,
        tone: 'create',
        disabled: demoMode,
        onClick: openCreate,
      },
    ],
    [demoMode, openCreate, t]
  );
  useRegisterPageMobileExtraActions(
    mobileExtraActions,
    !isWide && !companiesPending && companies.length === 0
  );

  const chromeActions = useMemo(
    () => (
      <Button
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={openCreate}
        disabled={demoMode}
      >
        {t('actions.createCompany')}
      </Button>
    ),
    [demoMode, openCreate, t]
  );
  useSetAppShellBreadcrumbActions(
    isWide && !companiesPending && companies.length === 0 ? chromeActions : null,
    `admin-company-create:${companies.length}:${demoMode}`
  );

  if (companiesPending) {
    return (
      <Box>
        <Loader size="sm" />
      </Box>
    );
  }

  return (
    <Box>
      <AdminDemoReadOnlyAlert />
      {company == null ? (
        <Alert color="blue" mb="md">
          {t('company.noCompanyAlert')}
        </Alert>
      ) : (
        <>
          <Title order={3} mb="md">
            {company.name}
          </Title>
          <Tabs value={activeTab} onChange={setActiveTab}>
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
                        setEditName(company.name);
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
                              if (name !== company.name) {
                                await updateCompany.mutateAsync({ id: company.id, name });
                              }
                              const currentIds = leadsForEdit.map((u) => u.id);
                              const targetLeadId = editLeadId || null;
                              for (const userId of currentIds) {
                                if (userId !== targetLeadId) {
                                  await removeLead.mutateAsync({
                                    companyId: company.id,
                                    userId,
                                  });
                                }
                              }
                              if (targetLeadId && !currentIds.includes(targetLeadId)) {
                                await addLead.mutateAsync({
                                  companyId: company.id,
                                  userId: targetLeadId,
                                });
                              }
                              invalidateLeads(company.id);
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
                      <Text size="sm">{company.name}</Text>
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
                <CompanyPdfBrandingForm companyId={company.id} />
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
                  w="fit-content"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setDeleteConfirmCompany(company)}
                  loading={deleteCompany.isPending}
                >
                  {t('company.editModal.manage.deleteButton')}
                </Button>
              </Card>
            </Tabs.Panel>
          </Tabs>
        </>
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

      <Modal
        opened={!!deleteConfirmCompany}
        onClose={() => setDeleteConfirmCompany(null)}
        title={t('company.deleteModal.title')}
        size="sm"
        zIndex={400}
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
