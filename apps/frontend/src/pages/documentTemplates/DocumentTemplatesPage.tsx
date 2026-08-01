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
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import { useMe } from '../../hooks/useMe.js';
import {
  CONTEXT_WORKSPACE_LEFT_WIDTH,
  ContextWorkspaceLeftColumn,
} from '../contextWorkspace/contextWorkspaceChrome.js';
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

function textToSections(raw: string): TemplateSection[] {
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
    sections.push({ heading, prompts: prompts.length > 0 ? prompts : ['Describe this section.'] });
  }
  return sections;
}

export function DocumentTemplatesPage() {
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
  const [sectionsText, setSectionsText] = useState(
    'Purpose\n- What is this document for?\n\nDetails\n- Fill in the details.'
  );

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
    if (me?.user?.isAdmin) opts.push({ value: 'platform', label: 'Platform (all scopes)' });
    for (const c of companyLeads) {
      opts.push({ value: `company:${c.id}`, label: `Company: ${c.name}` });
    }
    for (const d of departmentLeads) {
      opts.push({ value: `department:${d.id}`, label: `Department: ${d.name}` });
    }
    for (const t of teamLeads) {
      opts.push({ value: `team:${t.teamId}`, label: `Team: ${t.teamName}` });
    }
    return opts;
  }, [me]);

  const effectiveScopeType = scopeType ?? scopeOptions[0]?.value ?? 'platform';

  const createMutation = useMutation({
    mutationFn: async () => {
      const sections = textToSections(sectionsText);
      if (sections.length === 0) throw new Error('Add at least one section');
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
      notifications.show({ title: 'Type created', message: 'Custom type saved.', color: 'green' });
    },
    onError: (e: Error) => notifications.show({ title: 'Error', message: e.message, color: 'red' }),
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
        title: 'Type deleted',
        message: 'Custom type removed.',
        color: 'green',
      });
    },
    onError: (e: Error) => notifications.show({ title: 'Error', message: e.message, color: 'red' }),
  });

  const breadcrumbItems = useMemo((): AppShellBreadcrumbItem[] => {
    const items: AppShellBreadcrumbItem[] = [
      {
        key: 'templates',
        label: 'Templates',
        icon: <IconTemplate size={14} stroke={1.5} />,
        to: '/templates',
      },
    ];
    if (selectedType != null) {
      items.push({
        key: `type:${selectedType.id}`,
        label: selectedType.label,
      });
    }
    return items;
  }, [selectedType]);

  useSetAppShellBreadcrumbs(breadcrumbItems);
  useSetAppShellNavScope(null);

  const breadcrumbActions = useMemo(
    () => (
      <Button size="sm" onClick={openCreate}>
        New custom type
      </Button>
    ),
    [openCreate]
  );
  useSetAppShellBreadcrumbActions(breadcrumbActions, 'templates-new-custom');

  if (accessPending) {
    return (
      <Container py="xl">
        <Text c="dimmed">Loading…</Text>
      </Container>
    );
  }
  if (!access?.canManage) {
    return <Navigate to="/catalog" replace />;
  }

  const customCount = (types ?? []).filter((t) => t.source === 'custom').length;

  const renderTypeLink = (t: DocumentTypeDto) => (
    <NavLink
      key={t.id}
      component={Link}
      to={typeHref(t.id)}
      replace
      label={t.label}
      active={selectedType?.id === t.id}
      aria-current={selectedType?.id === t.id ? 'page' : undefined}
      variant="subtle"
      style={navLinkFullWidth}
    />
  );

  return (
    <>
      <Box className="document-page-shell">
        <Container
          fluid
          maw={1600}
          px="md"
          className="document-page-body"
          style={{ display: 'flex' }}
        >
          <Box
            className="document-page-left"
            w={{ base: '100%', lg: CONTEXT_WORKSPACE_LEFT_WIDTH }}
          >
            <Box className="document-page-left-inner">
              <ContextWorkspaceLeftColumn data-context-sibling-nav>
                <ContentCardWrapper fullHeight={false}>
                  <Stack gap="sm" w="100%">
                    <SectionLabel>Types</SectionLabel>
                    <SegmentedControl
                      size="xs"
                      fullWidth
                      value={sourceFilter}
                      onChange={(v) => setSourceFilter(v as SourceFilter)}
                      data={[
                        { label: 'All', value: 'all' },
                        { label: 'Built-in', value: 'builtin' },
                        { label: 'Custom', value: 'custom' },
                      ]}
                    />
                    {isPending ? (
                      <Text size="sm" c="dimmed">
                        Loading…
                      </Text>
                    ) : filteredTypes.length === 0 ? (
                      <Text size="sm" c="dimmed">
                        {sourceFilter === 'custom' && customCount === 0
                          ? 'No custom types yet.'
                          : 'No types match this filter.'}
                      </Text>
                    ) : (
                      <Stack
                        component="nav"
                        gap="sm"
                        align="stretch"
                        w="100%"
                        aria-label="Document types"
                      >
                        {showGroupHeadings && processTypes.length > 0 ? (
                          <TemplatesSidebarGroup sectionId="templates:process" label="Process">
                            {processTypes.map(renderTypeLink)}
                          </TemplatesSidebarGroup>
                        ) : null}
                        {showGroupHeadings && projectTypes.length > 0 ? (
                          <TemplatesSidebarGroup sectionId="templates:project" label="Project">
                            {projectTypes.map(renderTypeLink)}
                          </TemplatesSidebarGroup>
                        ) : null}
                        {customTypesInFilter.length > 0 ? (
                          showGroupHeadings ? (
                            <TemplatesSidebarGroup sectionId="templates:custom" label="Custom">
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
              </ContextWorkspaceLeftColumn>
            </Box>
          </Box>

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
                      Select a type to view details.
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
                            Delete
                          </Button>
                        </Group>
                      ) : null}
                      <Card className="document-page-card" w="100%" padding={0}>
                        <DocumentBlocksPreview
                          doc={buildTemplateTypePreviewDocument(selectedType)}
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
        </Container>
      </Box>

      <Modal opened={createOpened} onClose={closeCreate} title="New custom type" size="lg">
        <Stack gap="sm">
          <TextInput
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            required
          />
          <Textarea
            label="When to use"
            value={whenToUse}
            onChange={(e) => setWhenToUse(e.currentTarget.value)}
            minRows={2}
            required
          />
          <TextInput
            label="Example title"
            value={exampleTitle}
            onChange={(e) => setExampleTitle(e.currentTarget.value)}
          />
          <Select
            label="Often used in"
            data={[
              { value: 'process', label: 'Process' },
              { value: 'project', label: 'Project' },
            ]}
            value={oftenUsedIn}
            onChange={setOftenUsedIn}
            clearable
          />
          <Select
            label="Scope"
            data={scopeOptions}
            value={effectiveScopeType}
            onChange={setScopeType}
            required
          />
          <Textarea
            label="Sections"
            description="Blank line between sections. First line = heading, following lines = prompts (- item)."
            value={sectionsText}
            onChange={(e) => setSectionsText(e.currentTarget.value)}
            minRows={8}
            autosize
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              loading={createMutation.isPending}
              disabled={!label.trim() || !whenToUse.trim()}
              onClick={() => createMutation.mutate()}
            >
              Create
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
