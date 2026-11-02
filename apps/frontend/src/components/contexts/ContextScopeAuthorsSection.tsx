import { MultiSelect, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ScopePersonRow } from '../../api/scopePeople-types.js';
import {
  useCompanyPeople,
  useDepartmentPeople,
  useTeamPeople,
} from '../../hooks/useScopePeople.js';
import {
  useCompanyAuthorMutations,
  useDepartmentAuthorMutations,
  useTeamAuthorMutations,
} from '../../hooks/useScopeAuthorMutations.js';
import type { OwnerResponse } from '../../pages/contextWorkspace/contextWorkspaceTypes.js';

type Props = {
  owner: OwnerResponse;
  canManageAuthors: boolean;
};

type SelectGroup = { group: string; items: { value: string; label: string }[] };
type SelectData = Array<{ value: string; label: string } | SelectGroup>;

type Candidate = { id: string; name: string; teamId: string; groupLabel: string };

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

function buildGroupedData(
  authors: ScopePersonRow[],
  candidates: Candidate[],
  canManageAuthors: boolean
): SelectData {
  const authorOptions = uniqueById(authors).map((a) => ({ value: a.id, label: a.name }));
  if (!canManageAuthors) {
    return authorOptions;
  }

  const authorIds = new Set(authors.map((a) => a.id));
  const eligible = candidates.filter((c) => !authorIds.has(c.id));

  const useFlat = eligible.every((c) => c.groupLabel === '');
  if (useFlat) {
    const memberOptions = uniqueById(eligible)
      .map((c) => ({ value: c.id, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const byValue = new Map<string, { value: string; label: string }>();
    for (const opt of [...authorOptions, ...memberOptions]) byValue.set(opt.value, opt);
    return [...byValue.values()];
  }

  const groups = new Map<string, Map<string, string>>();
  for (const c of eligible) {
    const byId = groups.get(c.groupLabel) ?? new Map<string, string>();
    if (!byId.has(c.id)) byId.set(c.id, c.name);
    groups.set(c.groupLabel, byId);
  }

  const grouped: SelectGroup[] = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, byId]) => ({
      group,
      items: [...byId.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .filter((g) => g.items.length > 0);

  // Selected authors need labels in `data`; keep them as ungrouped options.
  return [...authorOptions, ...grouped];
}

function AuthorsMultiSelect({
  authors,
  candidates,
  canManageAuthors,
  pending,
  onAssign,
  onRemove,
}: {
  authors: ScopePersonRow[];
  candidates: Candidate[];
  canManageAuthors: boolean;
  pending: boolean;
  onAssign: (userId: string) => Promise<unknown>;
  onRemove: (userId: string) => Promise<unknown>;
}) {
  const { t } = useTranslation('contexts');
  const data = useMemo(
    () => buildGroupedData(authors, candidates, canManageAuthors),
    [authors, candidates, canManageAuthors]
  );
  const value = useMemo(() => authors.map((a) => a.id), [authors]);

  const handleChange = async (next: string[]) => {
    if (!canManageAuthors || pending) return;
    const prev = new Set(value);
    const nextSet = new Set(next);
    const added = next.filter((id) => !prev.has(id));
    const removed = value.filter((id) => !nextSet.has(id));

    for (const userId of added) {
      await onAssign(userId);
    }
    for (const userId of removed) {
      await onRemove(userId);
    }
  };

  if (data.length === 0 && value.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {t('modals.editContext.authorsEmpty')}
      </Text>
    );
  }

  return (
    <MultiSelect
      label={t('modals.editContext.authorsSection')}
      placeholder={t('modals.editContext.authorsPlaceholder')}
      data={data}
      value={value}
      onChange={(next) => void handleChange(next)}
      searchable
      clearable={canManageAuthors}
      disabled={!canManageAuthors || pending}
      nothingFoundMessage={t('modals.editContext.authorsNothingFound')}
    />
  );
}

function TeamAuthorsEditor({
  teamId,
  canManageAuthors,
}: {
  teamId: string;
  canManageAuthors: boolean;
}) {
  const { t } = useTranslation('contexts');
  const peopleQuery = useTeamPeople(teamId, true);
  const mutations = useTeamAuthorMutations(teamId);

  if (peopleQuery.isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('modals.editContext.authorsLoading')}
      </Text>
    );
  }
  if (peopleQuery.isError || !peopleQuery.data) {
    return (
      <Text size="sm" c="dimmed">
        {t('modals.editContext.authorsUnavailable')}
      </Text>
    );
  }

  const items = peopleQuery.data.items;
  const authors = items.filter((p) => p.roles?.includes('author') && !p.roles?.includes('lead'));
  const members = items.filter(
    (p) => p.roles?.includes('member') && !p.roles?.includes('lead') && !p.roles?.includes('author')
  );
  const candidates: Candidate[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    teamId,
    groupLabel: '',
  }));

  return (
    <AuthorsMultiSelect
      authors={authors}
      candidates={candidates}
      canManageAuthors={canManageAuthors}
      pending={mutations.isPending}
      onAssign={(userId) => mutations.assignAuthor.mutateAsync(userId)}
      onRemove={(userId) => mutations.removeAuthor.mutateAsync(userId)}
    />
  );
}

function DepartmentAuthorsEditor({
  departmentId,
  canManageAuthors,
}: {
  departmentId: string;
  canManageAuthors: boolean;
}) {
  const { t } = useTranslation('contexts');
  const peopleQuery = useDepartmentPeople(departmentId, true);
  const mutations = useDepartmentAuthorMutations(departmentId);

  if (peopleQuery.isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('modals.editContext.authorsLoading')}
      </Text>
    );
  }
  if (peopleQuery.isError || !peopleQuery.data) {
    return (
      <Text size="sm" c="dimmed">
        {t('modals.editContext.authorsUnavailable')}
      </Text>
    );
  }

  const data = peopleQuery.data;
  const candidates: Candidate[] = data.teams.flatMap((team) =>
    team.members.map((m) => ({
      id: m.id,
      name: m.name,
      teamId: team.id,
      groupLabel: team.name,
    }))
  );

  return (
    <AuthorsMultiSelect
      authors={data.departmentAuthors}
      candidates={candidates}
      canManageAuthors={canManageAuthors}
      pending={mutations.isPending}
      onAssign={(userId) => mutations.assignAuthor.mutateAsync(userId)}
      onRemove={(userId) => mutations.removeAuthor.mutateAsync(userId)}
    />
  );
}

function CompanyAuthorsEditor({
  companyId,
  canManageAuthors,
}: {
  companyId: string;
  canManageAuthors: boolean;
}) {
  const { t } = useTranslation('contexts');
  const peopleQuery = useCompanyPeople(companyId, true);
  const mutations = useCompanyAuthorMutations(companyId);

  if (peopleQuery.isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('modals.editContext.authorsLoading')}
      </Text>
    );
  }
  if (peopleQuery.isError || !peopleQuery.data) {
    return (
      <Text size="sm" c="dimmed">
        {t('modals.editContext.authorsUnavailable')}
      </Text>
    );
  }

  const data = peopleQuery.data;
  const multiDept = data.departments.length > 1;
  const candidates: Candidate[] = data.departments.flatMap((dept) =>
    dept.teams.flatMap((team) =>
      team.members.map((m) => ({
        id: m.id,
        name: m.name,
        teamId: team.id,
        groupLabel: multiDept ? `${dept.name} · ${team.name}` : team.name,
      }))
    )
  );
  return (
    <AuthorsMultiSelect
      authors={data.companyAuthors}
      candidates={candidates}
      canManageAuthors={canManageAuthors}
      pending={mutations.isPending}
      onAssign={(userId) => mutations.assignAuthor.mutateAsync(userId)}
      onRemove={(userId) => mutations.removeAuthor.mutateAsync(userId)}
    />
  );
}

/** Scope authors for the context owner unit (team / department / company). */
export function ContextScopeAuthorsSection({ owner, canManageAuthors }: Props) {
  if (owner.ownerUserId) return null;

  return (
    <Stack gap="xs">
      {owner.teamId != null ? (
        <TeamAuthorsEditor teamId={owner.teamId} canManageAuthors={canManageAuthors} />
      ) : owner.departmentId != null ? (
        <DepartmentAuthorsEditor
          departmentId={owner.departmentId}
          canManageAuthors={canManageAuthors}
        />
      ) : owner.companyId != null ? (
        <CompanyAuthorsEditor companyId={owner.companyId} canManageAuthors={canManageAuthors} />
      ) : null}
    </Stack>
  );
}
