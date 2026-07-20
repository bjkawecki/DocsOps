import {
  Box,
  Collapse,
  Combobox,
  InputBase,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
  useCombobox,
} from '@mantine/core';
import { IconBriefcase, IconChevronDown, IconChevronRight, IconRoute } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { apiFetch } from '../../api/client.js';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToKey } from '../../hooks/useRecentItems.js';
import {
  readSidebarSectionOpen,
  scopeToOwnerQueryParams,
  writeSidebarSectionOpen,
} from './contextPaths.js';

type SiblingEntityItem = {
  id: string;
  name: string;
  contextId: string;
  subcontexts?: { id: string; name: string; contextId: string }[];
};

type ContextOption = {
  value: string;
  label: string;
};

type ContextSwitcherSelectProps = {
  owner: RecentScope;
  value: string;
  onChange: (contextId: string) => void;
};

const peerHeaderButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  borderRadius: 'var(--mantine-radius-sm)',
};

const nestedListStyle: CSSProperties = {
  borderLeft: '1px solid var(--mantine-color-default-border)',
  marginLeft: 14,
  paddingLeft: 8,
  marginTop: 4,
};

/** Collapsible Processes/Projects header inside the switcher dropdown. */
function DropdownCollapsibleSection({
  sectionId,
  label,
  icon,
  defaultOpen = true,
  children,
}: {
  sectionId: string;
  label: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => readSidebarSectionOpen(sectionId, defaultOpen));
  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((o) => {
      const next = !o;
      writeSidebarSectionOpen(sectionId, next);
      return next;
    });
  };
  return (
    <Box>
      <UnstyledButton
        type="button"
        onClick={toggle}
        onMouseDown={(e) => e.preventDefault()}
        style={peerHeaderButtonStyle}
        aria-expanded={open}
        className="context-sidebar-peer-header"
      >
        {icon}
        <Text size="sm" c="dimmed" fw={600} truncate style={{ flex: 1, textAlign: 'left' }}>
          {label}
        </Text>
        {open ? (
          <IconChevronDown size={14} style={{ flexShrink: 0 }} aria-hidden />
        ) : (
          <IconChevronRight size={14} style={{ flexShrink: 0 }} aria-hidden />
        )}
      </UnstyledButton>
      <Collapse in={open}>
        <Box style={nestedListStyle}>
          <Stack gap={4} align="stretch" w="100%">
            {children}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

/**
 * Context picker with collapsible Processes / Projects sections.
 * Changing selection leaves the document and opens the chosen context workspace.
 */
export function ContextSwitcherSelect({ owner, value, onChange }: ContextSwitcherSelectProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const ownerParams = scopeToOwnerQueryParams(owner);
  const scopeKey = scopeToKey(owner);

  const { data: processesData, isLoading: processesLoading } = useQuery({
    queryKey: ['processes', 'siblings', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/processes?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load processes');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', 'siblings', scopeKey],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/projects?${ownerParams}`);
      if (!res.ok) throw new Error('Failed to load projects');
      return (await res.json()) as { items: SiblingEntityItem[] };
    },
    enabled: ownerParams != null,
  });

  const processes: ContextOption[] = useMemo(
    () =>
      (processesData?.items ?? []).map((p) => ({
        value: p.contextId,
        label: p.name,
      })),
    [processesData?.items]
  );

  const projects: ContextOption[] = useMemo(() => {
    const items: ContextOption[] = [];
    for (const project of projectsData?.items ?? []) {
      items.push({ value: project.contextId, label: project.name });
      for (const sub of project.subcontexts ?? []) {
        items.push({
          value: sub.contextId,
          label: `${project.name} / ${sub.name}`,
        });
      }
    }
    return items;
  }, [projectsData?.items]);

  const selectedLabel = useMemo(() => {
    const all = [...processes, ...projects];
    return all.find((o) => o.value === value)?.label ?? null;
  }, [processes, projects, value]);

  const loading = processesLoading || projectsLoading;
  const hasAny = processes.length > 0 || projects.length > 0;
  const disabled = ownerParams == null || (!hasAny && !loading);

  return (
    <Combobox
      store={combobox}
      withinPortal
      onOptionSubmit={(next) => {
        combobox.closeDropdown();
        if (next !== value) onChange(next);
      }}
    >
      <Combobox.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          onClick={() => combobox.toggleDropdown()}
          disabled={disabled}
          w="100%"
          aria-label="Switch context"
        >
          <Text
            size="sm"
            truncate
            c={selectedLabel ? undefined : 'dimmed'}
            style={{ textAlign: 'left' }}
          >
            {loading && !selectedLabel ? 'Loading…' : (selectedLabel ?? 'Select context')}
          </Text>
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          <ScrollArea.Autosize type="scroll" mah={320}>
            <Stack gap="xs" p={4}>
              <DropdownCollapsibleSection
                sectionId="switcher:processes"
                label="Processes"
                icon={<IconRoute size={16} stroke={1.5} />}
                defaultOpen
              >
                {processes.length === 0 ? (
                  <Text size="sm" c="dimmed" px="xs">
                    No processes yet.
                  </Text>
                ) : (
                  processes.map((p) => (
                    <Combobox.Option key={p.value} value={p.value} active={p.value === value}>
                      {p.label}
                    </Combobox.Option>
                  ))
                )}
              </DropdownCollapsibleSection>

              <DropdownCollapsibleSection
                sectionId="switcher:projects"
                label="Projects"
                icon={<IconBriefcase size={16} stroke={1.5} />}
                defaultOpen
              >
                {projects.length === 0 ? (
                  <Text size="sm" c="dimmed" px="xs">
                    No projects yet.
                  </Text>
                ) : (
                  projects.map((p) => (
                    <Combobox.Option key={p.value} value={p.value} active={p.value === value}>
                      {p.label}
                    </Combobox.Option>
                  ))
                )}
              </DropdownCollapsibleSection>
            </Stack>
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
