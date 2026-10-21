import { Anchor, Box, Center, Container, Loader, Menu, Paper, Stack, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconBriefcase, IconFilePlus, IconPlus, IconRoute } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { CreateContextMenu, NewContextModal, NewDocumentModal } from '../../components/contexts';
import type { NewContextScope } from '../../components/contexts/NewContextModal';
import { WIDE_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import { useRegisterScopePageChrome } from '../../components/appShell/scopeBreadcrumbs.js';
import {
  PageMobileActionBar,
  type PageMobileAction,
} from '../../components/ui/PageMobileActionBar.js';
import { useCompactContentNavFab } from '../../components/ui/pageMobileNav.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import { useMe } from '../../hooks/useMe';
import { scopeToKey, type RecentScope } from '../../hooks/useRecentItems.js';
import { canShowTrashArchiveTabs } from '../../lib/canShowWriteTabs.js';
import { ScopeContextSidebar } from './ScopeContextSidebar.js';
import {
  contextUrl,
  readLastScopeContextId,
  scopeArchiveUrl,
  scopeMostReadUrl,
  scopeToOwnerQueryParams,
  scopeTrashUrl,
} from './contextPaths.js';
import { useScopeSidebarNav } from './useScopeSidebarNav.js';

type SiblingEntityItem = { id: string; name: string; contextId: string };

type PersonalDocumentItem = {
  id: string;
  title: string;
  contextId: string | null;
};

/** RecentScope → NewContextModal/NewDocumentModal scope. `null` for scopes without an owner (Shared). */
function toNewContextScope(scope: RecentScope): NewContextScope | null {
  if (scope.type === 'company') return { type: 'company', companyId: scope.id };
  if (scope.type === 'department') return { type: 'department', departmentId: scope.id };
  if (scope.type === 'team') return { type: 'team', teamId: scope.id };
  if (scope.type === 'personal') return { type: 'personal' };
  return null;
}

export type ScopeWorkspaceEntryProps = {
  scope: RecentScope;
  /** Display name for the scope crumb (e.g. company/dept name). */
  scopeLabel?: string;
  /** Whether the current user may create processes/projects/drafts in this scope. */
  canManage?: boolean;
};

/**
 * Landing point for a scope (Company/Department/Team/Personal).
 * Org scopes: redirect into last/first process or project.
 * Personal: same two-column chrome as the context workspace; main column lists
 * context-free documents (they would otherwise vanish after create).
 */
export function ScopeWorkspaceEntry({
  scope,
  scopeLabel,
  canManage = false,
}: ScopeWorkspaceEntryProps) {
  const { t } = useTranslation(['contexts', 'shell', 'common']);
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const scopeKey = scopeToKey(scope);
  const newContextScope = toNewContextScope(scope);
  const isPersonal = scope.type === 'personal';
  const navTitle = t('shell:nav.organization');
  const { contentNavOpenRefProp, navFab } = useCompactContentNavFab(navTitle);
  const {
    processes: sidebarProcesses,
    projects: sidebarProjects,
    drafts: sidebarDrafts,
  } = useScopeSidebarNav(isPersonal ? scope : null);

  const [contextModalOpened, { open: openContextModal, close: closeContextModal }] =
    useDisclosure(false);
  const [documentModalOpened, { open: openDocumentModal, close: closeDocumentModal }] =
    useDisclosure(false);
  const [contextInitialType, setContextInitialType] = useState<'process' | 'project' | undefined>(
    undefined
  );

  const ownerParams = scopeToOwnerQueryParams(scope);
  const { data: processesData, isPending: processesPending } = useQuery({
    queryKey: ['processes', 'entry', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/processes?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load processes');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });
  const { data: projectsData, isPending: projectsPending } = useQuery({
    queryKey: ['projects', 'entry', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/projects?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load projects');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });
  const { data: personalDocsData, isPending: personalDocsPending } = useQuery({
    queryKey: ['me', 'personal-documents', 'entry'],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/me/personal-documents?limit=50&offset=0');
      if (!res.ok) throw new Error('Failed to load personal documents');
      return (await res.json()) as { items: PersonalDocumentItem[]; total: number };
    },
    enabled: isPersonal,
  });

  const contextsPending = ownerParams != null && (processesPending || projectsPending);
  const isPending = contextsPending || (isPersonal && personalDocsPending);

  const processes = useMemo(() => processesData?.items ?? [], [processesData]);
  const projects = useMemo(() => projectsData?.items ?? [], [projectsData]);
  const contextFreeDocs = useMemo(
    () => (personalDocsData?.items ?? []).filter((d) => d.contextId == null),
    [personalDocsData]
  );

  const targetContextId = useMemo(() => {
    if (isPersonal || contextsPending) return undefined;
    const lastId = readLastScopeContextId(scopeKey);
    const allIds = new Set([
      ...processes.map((p) => p.contextId),
      ...projects.map((p) => p.contextId),
    ]);
    if (lastId && allIds.has(lastId)) return lastId;
    if (processes[0]) return processes[0].contextId;
    if (projects[0]) return projects[0].contextId;
    return null;
  }, [isPersonal, contextsPending, scopeKey, processes, projects]);

  useEffect(() => {
    if (isPersonal) return;
    if (targetContextId) void navigate(contextUrl(targetContextId), { replace: true });
  }, [isPersonal, targetContextId, navigate]);

  const invalidateContexts = () => {
    void queryClient.invalidateQueries({ queryKey: ['processes', 'entry', scopeKey] });
    void queryClient.invalidateQueries({ queryKey: ['projects', 'entry', scopeKey] });
    void queryClient.invalidateQueries({ queryKey: ['processes', 'siblings', scopeKey] });
    void queryClient.invalidateQueries({ queryKey: ['projects', 'siblings', scopeKey] });
    if (isPersonal) {
      void queryClient.invalidateQueries({ queryKey: ['me', 'personal-documents'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'drafts'] });
    }
  };

  const chromeActions = useMemo(() => {
    if (!canManage || newContextScope == null) return null;
    return (
      <CreateContextMenu
        onCreateProcess={() => {
          setContextInitialType('process');
          openContextModal();
        }}
        onCreateProject={() => {
          setContextInitialType('project');
          openContextModal();
        }}
        onCreateDraft={openDocumentModal}
      />
    );
  }, [canManage, newContextScope, openContextModal, openDocumentModal]);

  const hasPersonalContent =
    isPersonal && (contextFreeDocs.length > 0 || processes.length > 0 || projects.length > 0);
  const showEmptyState = !isPending && !targetContextId && !hasPersonalContent;
  const showPersonalLanding = isPersonal && !isPending && hasPersonalContent;
  const showPersonalChrome = isPersonal && !isPending;
  const showMobileCreate =
    !isWide && canManage && newContextScope != null && (showEmptyState || showPersonalLanding);

  const showTrashArchive = canShowTrashArchiveTabs(me, canManage);
  const trashArchive =
    showTrashArchive && isPersonal
      ? {
          trashTo: scopeTrashUrl(scope),
          archiveTo: scopeArchiveUrl(scope),
          mostReadTo: scopeMostReadUrl(scope),
        }
      : null;

  const mobileActions = useMemo((): PageMobileAction[] => {
    if (!showMobileCreate) return [];
    return [
      {
        key: 'create',
        label: t('createMenu.ariaLabel'),
        icon: <IconPlus size={16} stroke={1.5} />,
        tone: 'create',
        menu: (
          <>
            <Menu.Item leftSection={<IconFilePlus size={16} />} onClick={openDocumentModal}>
              {t('createMenu.draft')}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconRoute size={16} />}
              onClick={() => {
                setContextInitialType('process');
                openContextModal();
              }}
            >
              {t('createMenu.process')}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconBriefcase size={16} />}
              onClick={() => {
                setContextInitialType('project');
                openContextModal();
              }}
            >
              {t('createMenu.project')}
            </Menu.Item>
          </>
        ),
      },
    ];
  }, [openContextModal, openDocumentModal, showMobileCreate, t]);

  // Hooks must run every render (before Loader early-return) – syncKey in chrome avoids action loops.
  useRegisterScopePageChrome(scope, scopeLabel, isWide ? chromeActions : null);

  if (isPending || (!isPersonal && targetContextId)) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  const modals =
    newContextScope != null ? (
      <>
        <NewContextModal
          opened={contextModalOpened}
          onClose={closeContextModal}
          scope={newContextScope}
          onSuccess={invalidateContexts}
          initialType={contextInitialType}
        />
        <NewDocumentModal
          opened={documentModalOpened}
          onClose={closeDocumentModal}
          scope={newContextScope}
          onSuccess={invalidateContexts}
          allowNoContext={scope.type === 'personal'}
        />
      </>
    ) : null;

  const mobileBar = !isWide ? (
    <PageMobileActionBar
      ariaLabel={t('shell:nav.pageMobileActionsAria')}
      actions={mobileActions}
      hidden={contextModalOpened || documentModalOpened}
    />
  ) : null;

  if (showPersonalChrome) {
    const mainColumn =
      contextFreeDocs.length > 0 ? (
        <Stack gap="xs">
          <Text fw={600}>{t('entry.documentsWithoutContext')}</Text>
          <Stack gap={6}>
            {contextFreeDocs.map((doc) => (
              <Anchor key={doc.id} component={Link} to={`/documents/${doc.id}`} size="sm">
                {doc.title.trim() || t('common:status.untitled')}
              </Anchor>
            ))}
          </Stack>
        </Stack>
      ) : hasPersonalContent ? (
        <Text size="sm" c="dimmed">
          {t('workspace.selectPrompt')}
        </Text>
      ) : (
        <Stack gap="xs">
          <Text fw={600}>{t('entry.emptyTitle')}</Text>
          <Text size="sm" c="dimmed">
            {canManage ? t('entry.emptyBodyCanManage') : t('entry.emptyBodyReadOnly')}
          </Text>
        </Stack>
      );

    return (
      <Container fluid maw={1600} px="md" mb="xl">
        <Paper withBorder={false} p={0} radius="md">
          <ResponsiveContentNav
            title={navTitle}
            compactNavOpenRef={contentNavOpenRefProp}
            nav={
              <ScopeContextSidebar
                processes={sidebarProcesses}
                projects={sidebarProjects}
                drafts={sidebarDrafts}
                activeContextId={null}
                onContextNavClick={() => {
                  // Link navigation only; no selection toggle on the personal landing.
                }}
                trashArchive={trashArchive}
                showPersonalAreaPeers={isPersonal}
              />
            }
          >
            <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>{mainColumn}</Box>
          </ResponsiveContentNav>
        </Paper>
        {navFab}
        {modals}
        {mobileBar}
      </Container>
    );
  }

  return (
    <Box maw={480}>
      <Stack gap="xs">
        <Text fw={600}>{t('entry.emptyTitle')}</Text>
        <Text size="sm" c="dimmed">
          {canManage ? t('entry.emptyBodyCanManage') : t('entry.emptyBodyReadOnly')}
        </Text>
      </Stack>
      {modals}
      {mobileBar}
    </Box>
  );
}
