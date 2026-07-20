import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiFetch } from '../../api/client.js';
import type { RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToKey } from '../../hooks/useRecentItems.js';
import { scopeToOwnerQueryParams } from './contextPaths.js';

type SiblingEntityItem = {
  id: string;
  name: string;
  contextId: string;
  subcontexts?: { id: string; name: string; contextId: string }[];
};

type ContextSwitcherSelectProps = {
  owner: RecentScope;
  value: string;
  onChange: (contextId: string) => void;
};

/**
 * Grouped context picker (Processes / Projects + subcontexts).
 * Changing selection leaves the document and opens the chosen context workspace.
 */
export function ContextSwitcherSelect({ owner, value, onChange }: ContextSwitcherSelectProps) {
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

  const selectData = useMemo(() => {
    const processItems = (processesData?.items ?? []).map((p) => ({
      value: p.contextId,
      label: p.name,
    }));

    const projectItems: { value: string; label: string }[] = [];
    for (const project of projectsData?.items ?? []) {
      projectItems.push({ value: project.contextId, label: project.name });
      for (const sub of project.subcontexts ?? []) {
        projectItems.push({
          value: sub.contextId,
          label: `${project.name} / ${sub.name}`,
        });
      }
    }

    const groups: { group: string; items: { value: string; label: string }[] }[] = [];
    if (processItems.length > 0) {
      groups.push({ group: 'Processes', items: processItems });
    }
    if (projectItems.length > 0) {
      groups.push({ group: 'Projects', items: projectItems });
    }
    return groups;
  }, [processesData?.items, projectsData?.items]);

  const loading = processesLoading || projectsLoading;
  const disabled = ownerParams == null || (selectData.length === 0 && !loading);

  return (
    <Select
      placeholder={loading ? 'Loading…' : 'Select context'}
      data={selectData}
      value={value}
      onChange={(next) => {
        if (next != null && next !== value) onChange(next);
      }}
      searchable={false}
      allowDeselect={false}
      maxDropdownHeight={320}
      disabled={disabled}
      w="100%"
      aria-label="Switch context"
    />
  );
}
