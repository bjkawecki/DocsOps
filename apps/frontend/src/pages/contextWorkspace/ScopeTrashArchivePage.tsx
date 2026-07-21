import { Box, Container, Flex, Paper, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { ArchiveTabContent, TrashTabContent } from '../../components/trashArchive';
import type { TrashArchiveScope } from '../../components/trashArchive/trashArchiveTypes.js';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import type { AppShellBreadcrumbItem } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useMe } from '../../hooks/useMe';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToUrl } from '../../lib/scopeNav.js';
import { ScopeContextSidebar } from './ScopeContextSidebar.js';
import { scopeArchiveUrl, scopeTrashUrl } from './contextPaths.js';
import { useScopeSidebarNav } from './useScopeSidebarNav.js';

export type ScopeTrashArchiveKind = 'trash' | 'archive';

type Props = {
  navScope: RecentScope;
  trashScope: TrashArchiveScope;
  kind: ScopeTrashArchiveKind;
  scopeLabel?: string;
  canManage: boolean;
  companyId?: string;
  departmentId?: string;
  teamId?: string;
};

/**
 * Lead-only trash/archive view for a scope – same two-column chrome as the context workspace.
 */
export function ScopeTrashArchivePage({
  navScope,
  trashScope,
  kind,
  scopeLabel,
  canManage,
  companyId,
  departmentId,
  teamId,
}: Props) {
  const { data: me, isPending } = useMe();
  const allowed = canShowTrashArchiveTabs(me, canManage);
  const { processes, projects, drafts } = useScopeSidebarNav(navScope);
  const trailSuffix = useMemo((): AppShellBreadcrumbItem[] => {
    return [
      {
        key: kind,
        label: kind === 'trash' ? 'Trash' : 'Archive',
      },
    ];
  }, [kind]);
  useRegisterScopePageChrome(navScope, scopeLabel, null, trailSuffix);

  const trashArchive = {
    trashTo: scopeTrashUrl(navScope),
    archiveTo: scopeArchiveUrl(navScope),
  };

  const handleContextNavClick = () => {
    // Link navigation only; no selection toggle on trash/archive.
  };

  if (isPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }
  if (!allowed) {
    return <Navigate to={scopeToUrl(navScope)} replace />;
  }

  const contentProps = { scope: trashScope, companyId, departmentId, teamId };

  return (
    <Container fluid maw={1600} px="md" mb="xl">
      <Paper withBorder={false} p={0} radius="md">
        <Flex
          direction={{ base: 'column', lg: 'row' }}
          gap={{ base: 'md', lg: 'lg' }}
          align="flex-start"
        >
          <ScopeContextSidebar
            processes={processes}
            projects={projects}
            drafts={drafts}
            activeContextId={null}
            onContextNavClick={handleContextNavClick}
            trashArchive={trashArchive}
          />

          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            {kind === 'trash' ? (
              <TrashTabContent {...contentProps} />
            ) : (
              <ArchiveTabContent {...contentProps} />
            )}
          </Box>
        </Flex>
      </Paper>
    </Container>
  );
}

export function CompanyTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
  const { data: me, isPending: mePending } = useMe();
  const isAdmin = me?.user?.isAdmin === true;
  const companyIdFromLead = me?.identity?.companyLeads?.[0]?.id;
  const companyIdFromTeam =
    me?.identity?.teams?.[0]?.companyId ??
    me?.identity?.departmentLeads?.[0]?.companyId ??
    me?.identity?.departmentAuthors?.[0]?.companyId;

  const { data: firstCompany, isPending: firstCompanyPending } = useQuery({
    queryKey: ['companies', 'first'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/companies?limit=1');
      if (!res.ok) throw new Error('Failed to load companies');
      const data = (await res.json()) as { items: { id: string }[] };
      return data.items[0] ?? null;
    },
    enabled: isAdmin && !companyIdFromLead && !companyIdFromTeam,
  });

  const effectiveCompanyId = companyIdFromLead ?? companyIdFromTeam ?? firstCompany?.id;
  const canManage = isAdmin || (me?.identity?.companyLeads?.length ?? 0) > 0;

  const { data: company } = useQuery({
    queryKey: ['companies', effectiveCompanyId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/companies/${effectiveCompanyId}`);
      if (!res.ok) throw new Error('Failed to load company');
      return (await res.json()) as { id: string; name: string };
    },
    enabled: effectiveCompanyId != null,
  });

  if (mePending || (isAdmin && !companyIdFromLead && !companyIdFromTeam && firstCompanyPending)) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    );
  }

  if (!effectiveCompanyId) {
    return (
      <Text size="sm" c="dimmed">
        No company available.
      </Text>
    );
  }

  return (
    <ScopeTrashArchivePage
      navScope={{ type: 'company', id: effectiveCompanyId }}
      trashScope="company"
      companyId={effectiveCompanyId}
      kind={kind}
      canManage={canManage}
      scopeLabel={company?.name}
    />
  );
}

export function DepartmentTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { data: me } = useMe();
  const isAdmin = me?.user?.isAdmin === true;
  const canManage =
    isAdmin ||
    (me?.identity?.departmentLeads?.some((d) => d.id === departmentId) ?? false) ||
    (me?.identity?.companyLeads?.length ?? 0) > 0;
  if (!departmentId) return null;
  return (
    <ScopeTrashArchivePage
      navScope={{ type: 'department', id: departmentId }}
      trashScope="department"
      departmentId={departmentId}
      kind={kind}
      canManage={canManage}
    />
  );
}

export function TeamTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: me } = useMe();
  const isAdmin = me?.user?.isAdmin === true;
  const canManage =
    isAdmin ||
    (me?.identity?.teams?.some((t) => t.teamId === teamId && t.role === 'leader') ?? false) ||
    (me?.identity?.departmentLeads?.length ?? 0) > 0 ||
    (me?.identity?.companyLeads?.length ?? 0) > 0;
  if (!teamId) return null;
  return (
    <ScopeTrashArchivePage
      navScope={{ type: 'team', id: teamId }}
      trashScope="team"
      teamId={teamId}
      kind={kind}
      canManage={canManage}
    />
  );
}

export function PersonalTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
  return (
    <ScopeTrashArchivePage
      navScope={{ type: 'personal' }}
      trashScope="personal"
      kind={kind}
      scopeLabel="Personal"
      canManage
    />
  );
}
