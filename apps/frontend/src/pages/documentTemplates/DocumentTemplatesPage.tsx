import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  Modal,
  NavLink,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconTemplate } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import {
  useSetAppShellBreadcrumbActions,
  useSetAppShellBreadcrumbs,
  type AppShellBreadcrumbItem,
} from '../../components/appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../../components/appShell/AppShellNavScopeContext.js';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import {
  TOGGLE_STRIP_WIDTH,
  WIDTH_OPEN,
} from '../../components/documents/documentComments/documentCommentsConstants.js';
import type {
  DocumentTypeDto,
  TemplateSection,
} from '../../components/documents/documentTypeTypes.js';
import { DocumentBlocksPreview } from '../../components/documents/DocumentBlocksPreview.js';
import { buildTemplateTypePreviewDocument } from '../../components/documents/buildTemplateTypePreviewDocument.js';
import { localizedDocumentTypeLabel } from '../../components/documents/localizedDocumentTypeLabel.js';
import { ResponsiveContentNav } from '../../components/ui/ResponsiveContentNav.js';
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import { useMe } from '../../hooks/useMe.js';
import '../DocumentContent.css';
import { TemplatesSidebarGroup } from './TemplatesSidebarGroup.js';

/** Same reserved width as the document comments rail (keeps reading column aligned). */
const TEMPLATES_BALANCE_RAIL_WIDTH = TOGGLE_STRIP_WIDTH + WIDTH_OPEN;

type ManageAccess = { canManage: boolean };
type SourceFilter = 'all' | 'builtin' | 'custom';

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

function textToSections(raw: string, defaultPrompt: string): TemplateSection[] {
  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const sections: TemplateSection[] = [];
  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    const heading = lines[0];
    if (!heading) continue;
    const prompts = lines
      .slice(1)
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
    sections.push({ heading, prompts: prompts.length > 0 ? prompts : [defaultPrompt] });
  }
  return sections;
}

export function DocumentTemplatesPage() {
  const { t, i18n } = useTranslation(['templates', 'documents', 'shell', 'common']);
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [label, setLabel] = useState('');
  const [whenToUse, setWhenToUse] = useState('');
  const [exampleTitle, setExampleTitle] = useState('');
  const [oftenUsedIn, setOftenUsedIn] = useState<string | null>('process');
  const [scopeType, setScopeType] = useState<string | null>(null);
  const [sectionsText, setSectionsText] = useState(t('templates:newType.defaultSectionsText'));
  const locale = i18n.language;

  const { data: access, isPending: accessPending } = useQuery({
    queryKey: ['document-templates', 'manage-access'],
    queryFn: async (): Promise<ManageAccess> => {
      const res = await apiFetch('/api/v1/document-templates/manage-access');
      if (!res.ok) throw new Error('Failed to load manage access');
      return (await res.json()) as ManageAccess;
    },
  });

  const { data: types, isPending } = useQuery({
    queryKey: ['document-types', 'manage'],
    queryFn: async (): Promise<DocumentTypeDto[]> => {
      const res = await apiFetch('/api/v1/document-types');
      if (!res.ok) throw new Error('Failed to load types');
      return ((await res.json()) as { items: DocumentTypeDto[] }).items;
    },
    enabled: access?.canManage === true,
  });

  const filteredTypes = useMemo(() => {
    const all = types ?? [];
    if (sourceFilter === 'builtin') return all.filter((t) => t.source === 'builtin');
    if (sourceFilter === 'custom') return all.filter((t) => t.source === 'custom');
    return all;
  }, [sourceFilter, types]);

  const processTypes = useMemo(
    () => filteredTypes.filter((t) => t.source === 'builtin' && t.oftenUsedIn === 'process'),
    [filteredTypes]
  );
  const projectTypes = useMemo(
    () => filteredTypes.filter((t) => t.source === 'builtin' && t.oftenUsedIn === 'project'),
    [filteredTypes]
  );
  const customTypesInFilter = useMemo(
    () => filteredTypes.filter((t) => t.source === 'custom'),
    [filteredTypes]
  );
  const showGroupHeadings = sourceFilter !== 'custom';

  const typeIdFromUrl = searchParams.get('type');
  const selectedType = useMemo(() => {
    if (filteredTypes.length === 0) return null;
    const fromUrl =
      typeIdFromUrl != null ? filteredTypes.find((t) => t.id === typeIdFromUrl) : null;
    return fromUrl ?? filteredTypes[0] ?? null;
  }, [filteredTypes, typeIdFromUrl]);

  useEffect(() => {
    if (isPending || filteredTypes.length === 0) return;
    const first = filteredTypes[0];
    if (first == null) return;
    if (typeIdFromUrl != null && filteredTypes.some((t) => t.id === typeIdFromUrl)) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('type', first.id);
        return p;
      },
      { replace: true }
    );
  }, [filteredTypes, isPending, setSearchParams, typeIdFromUrl]);

  const selectType = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('type', id);
          return p;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const typeHref = (id: string) => {
    const p = new URLSearchParams(searchParams);
    p.set('type', id);
    return `/templates?${p.toString()}`;
  };

  const scopeOptions = useMemo(() => {
    const companyLeads = me?.identity?.companyLeads ?? [];
    const departmentLeads = me?.identity?.departmentLeads ?? [];
    const teamLeads = (me?.identity?.teams ?? []).filter((t) => t.role === 'leader');
    const opts: { value: string; label: string }[] = [];
    if (me?.user?.isAdmin) {
      opts.push({ value: 'platform', label: t('templates:newType.scopePlatform') });
    }
    for (const c of companyLeads) {
      opts.push({
        value: `company:${c.id}`,
        label: t('templates:newType.scopeCompany', { name: c.name }),
      });
    }
    for (const d of departmentLeads) {
      opts.push({
        value: `department:${d.id}`,
        label: t('templates:newType.scopeDepartment', { name: d.name }),
      });
    }
    for (const lead of teamLeads) {
      opts.push({
        value: `team:${lead.teamId}`,
        label: t('templates:newType.scopeTeam', { name: lead.teamName }),
      });
    }
    return opts;
  }, [me, t]);

  const effectiveScopeType = scopeType ?? scopeOptions[0]?.value ?? 'platform';

  const createMutation = useMutation({
    mutationFn: async () => {
      const sections = textToSections(sectionsText, t('templates:newType.defaultSectionPrompt'));
      if (sections.length === 0) throw new Error(t('templates:newType.missingSection'));
      let parsedScopeType: 'platform' | 'company' | 'department' | 'team' = 'platform';
      let parsedScopeId: string | null = null;
      const scopeValue = effectiveScopeType;
      if (scopeValue === 'platform') {
        parsedScopeType = 'platform';
      } else if (scopeValue.startsWith('company:')) {
        parsedScopeType = 'company';
        parsedScopeId = scopeValue.slice('company:'.length);
      } else if (scopeValue.startsWith('department:')) {
        parsedScopeType = 'department';
        parsedScopeId = scopeValue.slice('department:'.length);
      } else if (scopeValue.startsWith('team:')) {
        parsedScopeType = 'team';
        parsedScopeId = scopeValue.slice('team:'.length);
      }
      const res = await apiFetch('/api/v1/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          deLabel: null,
          whenToUse: whenToUse.trim(),
          exampleTitle: exampleTitle.trim() || label.trim(),
          oftenUsedIn: oftenUsedIn === 'process' || oftenUsedIn === 'project' ? oftenUsedIn : null,
          scopeType: parsedScopeType,
          scopeId: parsedScopeId,
          sections,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as DocumentTypeDto;
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['document-types'] });
      closeCreate();
      setLabel('');
      setWhenToUse('');
      setExampleTitle('');
      setSourceFilter('custom');
      selectType(created.id);
      notifications.show({
        title: t('templates:toasts.createdTitle'),
        message: t('templates:toasts.createdMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({
        title: t('templates:toasts.errorTitle'),
        message: e.message,
        color: 'red',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (typeId: string) => {
      const res = await apiFetch(`/api/v1/document-types/${typeId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onSuccess: (_data, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ['document-types'] });
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (p.get('type') === deletedId) p.delete('type');
          return p;
        },
        { replace: true }
      );
      notifications.show({
        title: t('templates:toasts.deletedTitle'),
        message: t('templates:toasts.deletedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({
        title: t('templates:toasts.errorTitle'),
        message: e.message,
        color: 'red',
      }),
  });

  const breadcrumbItems = useMemo((): AppShellBreadcrumbItem[] => {
    const items: AppShellBreadcrumbItem[] = [
      {
        key: 'templates',
        label: t('shell:nav.templates'),
        icon: <IconTemplate size={14} stroke={1.5} />,
        to: '/templates',
      },
    ];
    if (selectedType != null) {
      items.push({
        key: `type:${selectedType.id}`,
        label: localizedDocumentTypeLabel(selectedType, locale),
      });
    }
    return items;
  }, [locale, selectedType, t]);

  useSetAppShellBreadcrumbs(breadcrumbItems);
  useSetAppShellNavScope(null);

  const breadcrumbActions = useMemo(
    () => (
      <Button size="sm" onClick={openCreate}>
        {t('templates:newType.action')}
      </Button>
    ),
    [openCreate, t]
  );
  useSetAppShellBreadcrumbActions(breadcrumbActions, 'templates-new-custom');

  if (accessPending) {
    return (
      <Container py="xl">
        <Text c="dimmed">{t('common:status.loading')}</Text>
      </Container>
    );
  }
  if (!access?.canManage) {
    return <Navigate to="/catalog" replace />;
  }

  const customCount = (types ?? []).filter((t) => t.source === 'custom').length;

  const renderTypeLink = (type: DocumentTypeDto) => (
    <NavLink
      key={type.id}
      component={Link}
      to={typeHref(type.id)}
      replace
      label={localizedDocumentTypeLabel(type, locale)}
      active={selectedType?.id === type.id}
      aria-current={selectedType?.id === type.id ? 'page' : undefined}
      variant="subtle"
      style={navLinkFullWidth}
    />
  );

  const sectionTitle = t('shell:nav.templates');

  const nav = (
    <ContentCardWrapper fullHeight={false}>
      <Stack gap="sm" w="100%">
        <SectionLabel>{t('templates:sidebar.typesHeading')}</SectionLabel>
        <SegmentedControl
          size="xs"
          fullWidth
          value={sourceFilter}
          onChange={(v) => setSourceFilter(v as SourceFilter)}
          data={[
            { label: t('documents:catalog.allTypes'), value: 'all' },
            { label: t('documents:typePicker.sourceBuiltin'), value: 'builtin' },
            { label: t('documents:typePicker.sourceCustom'), value: 'custom' },
          ]}
        />
        {isPending ? (
          <Text size="sm" c="dimmed">
            {t('common:status.loading')}
          </Text>
        ) : filteredTypes.length === 0 ? (
          <Text size="sm" c="dimmed">
            {sourceFilter === 'custom' && customCount === 0
              ? t('templates:sidebar.noCustomTypes')
              : t('templates:sidebar.noTypesMatch')}
          </Text>
        ) : (
          <Stack
            component="nav"
            gap="sm"
            align="stretch"
            w="100%"
            aria-label={t('templates:sidebar.documentTypesAria')}
          >
            {showGroupHeadings && processTypes.length > 0 ? (
              <TemplatesSidebarGroup
                sectionId="templates:process"
                label={t('documents:typePicker.groupProcess')}
              >
                {processTypes.map(renderTypeLink)}
              </TemplatesSidebarGroup>
            ) : null}
            {showGroupHeadings && projectTypes.length > 0 ? (
              <TemplatesSidebarGroup
                sectionId="templates:project"
                label={t('documents:typePicker.groupProject')}
              >
                {projectTypes.map(renderTypeLink)}
              </TemplatesSidebarGroup>
            ) : null}
            {customTypesInFilter.length > 0 ? (
              showGroupHeadings ? (
                <TemplatesSidebarGroup
                  sectionId="templates:custom"
                  label={t('documents:typePicker.groupCustom')}
                >
                  {customTypesInFilter.map(renderTypeLink)}
                </TemplatesSidebarGroup>
              ) : (
                <Stack gap={2}>{customTypesInFilter.map(renderTypeLink)}</Stack>
              )
            ) : null}
          </Stack>
        )}
      </Stack>
    </ContentCardWrapper>
  );

  return (
    <>
      <Box className="document-page-shell">
        <Container
          fluid
          maw={1600}
          px="md"
          className="document-page-body"
          style={{ display: 'block' }}
        >
          <ResponsiveContentNav title={sectionTitle} nav={nav}>
            <Box className="document-page-main">
              <Flex
                gap={{ base: 'lg', lg: 'xl' }}
                direction={{ base: 'column', lg: 'row' }}
                align={{ base: 'stretch', lg: 'stretch' }}
                wrap="nowrap"
                w="100%"
                style={{ overflow: 'visible' }}
              >
                <Box className="document-page-reading">
                  <Box className="document-page-scroll">
                    {selectedType == null ? (
                      <Text size="sm" c="dimmed">
                        {t('templates:detail.selectPrompt')}
                      </Text>
                    ) : (
                      <Stack gap="md" align="stretch" w="100%">
                        {selectedType.source === 'custom' ? (
                          <Group justify="flex-end">
                            <Button
                              size="sm"
                              color="red"
                              variant="light"
                              loading={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(selectedType.id)}
                            >
                              {t('templates:detail.delete')}
                            </Button>
                          </Group>
                        ) : null}
                        <Card className="document-page-card" w="100%" padding={0}>
                          <DocumentBlocksPreview
                            doc={buildTemplateTypePreviewDocument(selectedType, {
                              locale,
                              displayLabel: localizedDocumentTypeLabel(selectedType, locale),
                            })}
                            documentId={`template-type:${selectedType.id}`}
                          />
                        </Card>
                      </Stack>
                    )}
                  </Box>
                </Box>

                <Box
                  component="aside"
                  aria-hidden
                  className="document-page-comments-aside"
                  visibleFrom="lg"
                  style={{
                    flexShrink: 0,
                    width: TEMPLATES_BALANCE_RAIL_WIDTH,
                    minWidth: TEMPLATES_BALANCE_RAIL_WIDTH,
                    maxWidth: TEMPLATES_BALANCE_RAIL_WIDTH,
                  }}
                />
              </Flex>
            </Box>
          </ResponsiveContentNav>
        </Container>
      </Box>

      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={t('templates:newType.modalTitle')}
        size="lg"
      >
        <Stack gap="sm">
          <TextInput
            label={t('templates:newType.labelField')}
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            required
          />
          <Textarea
            label={t('templates:newType.whenToUseField')}
            value={whenToUse}
            onChange={(e) => setWhenToUse(e.currentTarget.value)}
            minRows={2}
            required
          />
          <TextInput
            label={t('templates:newType.exampleTitleField')}
            value={exampleTitle}
            onChange={(e) => setExampleTitle(e.currentTarget.value)}
          />
          <Select
            label={t('templates:newType.oftenUsedInField')}
            data={[
              { value: 'process', label: t('documents:typePicker.groupProcess') },
              { value: 'project', label: t('documents:typePicker.groupProject') },
            ]}
            value={oftenUsedIn}
            onChange={setOftenUsedIn}
            clearable
          />
          <Select
            label={t('templates:newType.scopeField')}
            data={scopeOptions}
            value={effectiveScopeType}
            onChange={setScopeType}
            required
          />
          <Textarea
            label={t('templates:newType.sectionsField')}
            description={t('templates:newType.sectionsDescription')}
            value={sectionsText}
            onChange={(e) => setSectionsText(e.currentTarget.value)}
            minRows={8}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCreate}>
              {t('templates:newType.cancel')}
            </Button>
            <Button
              loading={createMutation.isPending}
              disabled={!label.trim() || !whenToUse.trim()}
              onClick={() => createMutation.mutate()}
            >
              {t('templates:newType.create')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
