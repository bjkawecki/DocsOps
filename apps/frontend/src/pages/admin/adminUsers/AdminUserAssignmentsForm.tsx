import { Alert, Button, Group, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { apiFetch } from '../../../api/client';
import type { DepartmentWithTeams, UserRow, UserTeam } from './adminUsersTypes';

type TeamRole = 'Member' | 'Author' | 'Lead';

function teamRoleLabel(t: TFunction, role: TeamRole): string {
  if (role === 'Lead') return t('roles.lead');
  if (role === 'Author') return t('roles.author');
  return t('roles.member');
}

type Props = {
  user: UserRow;
  departments: DepartmentWithTeams[];
  onSave: () => void;
  onCancel: () => void;
};

function currentTeamRole(team: UserTeam | undefined): TeamRole {
  if (!team) return 'Member';
  if (team.isLead) return 'Lead';
  if (team.isAuthor) return 'Author';
  return 'Member';
}

export function AdminUserAssignmentsForm({ user, departments, onSave, onCancel }: Props) {
  const { t } = useTranslation('admin');
  const isPlatformAdmin = user.isAdmin || user.role === 'Admin';

  const allTeams = departments.flatMap((d) =>
    (d.teams ?? []).map((team) => ({
      id: team.id,
      name: team.name,
      departmentId: d.id,
      departmentName: d.name,
    }))
  );
  const currentTeam = user.teams?.[0];
  const currentDeptLead = user.departmentsAsLead?.[0];
  const currentDeptAuthor = user.departmentsAsAuthor?.[0];

  const [teamId, setTeamId] = useState(currentTeam?.id ?? '');
  const [teamRole, setTeamRole] = useState<TeamRole>(currentTeamRole(currentTeam));
  const [departmentLeadId, setDepartmentLeadId] = useState(currentDeptLead?.id ?? '');
  const [departmentAuthorId, setDepartmentAuthorId] = useState(currentDeptAuthor?.id ?? '');

  const removeFromTeam = useMutation({
    mutationFn: async (tid: string) => {
      const res = await apiFetch(`/api/v1/teams/${tid}/members/${user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const addToTeam = useMutation({
    mutationFn: async (tid: string) => {
      const res = await apiFetch(`/api/v1/teams/${tid}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const addTeamLead = useMutation({
    mutationFn: async (tid: string) => {
      const res = await apiFetch(`/api/v1/teams/${tid}/team-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const removeTeamLead = useMutation({
    mutationFn: async (tid: string) => {
      const res = await apiFetch(`/api/v1/teams/${tid}/team-leads/${user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const promoteTeamAuthor = useMutation({
    mutationFn: async (tid: string) => {
      const res = await apiFetch(`/api/v1/teams/${tid}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const demoteTeamAuthor = useMutation({
    mutationFn: async (tid: string) => {
      const res = await apiFetch(`/api/v1/teams/${tid}/authors/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const addDepartmentLead = useMutation({
    mutationFn: async (departmentId: string) => {
      const res = await apiFetch(`/api/v1/departments/${departmentId}/department-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const removeDepartmentLead = useMutation({
    mutationFn: async (departmentId: string) => {
      const res = await apiFetch(
        `/api/v1/departments/${departmentId}/department-leads/${user.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const promoteDepartmentAuthor = useMutation({
    mutationFn: async (departmentId: string) => {
      const res = await apiFetch(`/api/v1/departments/${departmentId}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const demoteDepartmentAuthor = useMutation({
    mutationFn: async ({
      departmentId,
      targetTeamId,
    }: {
      departmentId: string;
      targetTeamId: string;
    }) => {
      const res = await apiFetch(
        `/api/v1/departments/${departmentId}/authors/${user.id}?teamId=${encodeURIComponent(targetTeamId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const removeFromTeamSilent = async (tid: string) => {
    const res = await apiFetch(`/api/v1/teams/${tid}/members/${user.id}`, {
      method: 'DELETE',
    });
    if (res.status === 404) return;
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? res.statusText);
    }
  };

  const isPendingMut =
    removeFromTeam.isPending ||
    addToTeam.isPending ||
    addTeamLead.isPending ||
    removeTeamLead.isPending ||
    promoteTeamAuthor.isPending ||
    demoteTeamAuthor.isPending ||
    addDepartmentLead.isPending ||
    removeDepartmentLead.isPending ||
    promoteDepartmentAuthor.isPending ||
    demoteDepartmentAuthor.isPending;

  const clearTeamAssignment = async (team: UserTeam) => {
    if (team.isLead) {
      await removeTeamLead.mutateAsync(team.id);
      await removeFromTeamSilent(team.id);
    } else if (team.isAuthor) {
      await demoteTeamAuthor.mutateAsync(team.id);
    } else {
      await removeFromTeam.mutateAsync(team.id);
    }
  };

  const clearDepartmentAuthor = async (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    const fallbackTeamId = dept?.teams?.[0]?.id;
    if (!fallbackTeamId) {
      throw new Error(t('users.assignmentsForm.demoteWithoutTeamError'));
    }
    await demoteDepartmentAuthor.mutateAsync({ departmentId, targetTeamId: fallbackTeamId });
  };

  const handleSave = async () => {
    try {
      for (const team of user.teams ?? []) {
        if (team.id !== teamId) await clearTeamAssignment(team);
      }

      if (teamId) {
        const existing = user.teams?.find((t) => t.id === teamId);
        const existingRole = currentTeamRole(existing);

        if (teamRole === 'Lead') {
          if (existingRole === 'Member') await removeFromTeam.mutateAsync(teamId);
          if (existingRole === 'Author') await demoteTeamAuthor.mutateAsync(teamId);
          if (existingRole !== 'Lead') await addTeamLead.mutateAsync(teamId);
        } else if (teamRole === 'Author') {
          if (existingRole === 'Lead') {
            await removeTeamLead.mutateAsync(teamId);
            await removeFromTeamSilent(teamId);
          }
          if (!existing || existingRole === 'Lead') {
            await addToTeam.mutateAsync(teamId);
          }
          if (existingRole !== 'Author') await promoteTeamAuthor.mutateAsync(teamId);
        } else {
          if (existingRole === 'Lead') await removeTeamLead.mutateAsync(teamId);
          if (existingRole === 'Author') await demoteTeamAuthor.mutateAsync(teamId);
          if (!existing || existingRole === 'Lead') await addToTeam.mutateAsync(teamId);
        }
      } else {
        for (const team of user.teams ?? []) {
          await clearTeamAssignment(team);
        }
      }

      for (const d of user.departmentsAsLead ?? []) {
        if (d.id !== departmentLeadId) await removeDepartmentLead.mutateAsync(d.id);
      }
      if (departmentLeadId && !user.departmentsAsLead?.some((d) => d.id === departmentLeadId)) {
        await addDepartmentLead.mutateAsync(departmentLeadId);
      }

      for (const d of user.departmentsAsAuthor ?? []) {
        if (d.id !== departmentAuthorId) await clearDepartmentAuthor(d.id);
      }
      if (
        departmentAuthorId &&
        !user.departmentsAsAuthor?.some((d) => d.id === departmentAuthorId)
      ) {
        await promoteDepartmentAuthor.mutateAsync(departmentAuthorId);
      }

      notifications.show({
        title: t('users.assignmentsForm.toasts.updatedTitle'),
        message: t('users.assignmentsForm.toasts.updatedMessage'),
        color: 'green',
      });
      onSave();
    } catch {
      // errors already shown via mutation onError
    }
  };

  if (isPlatformAdmin) {
    return (
      <Stack gap="sm">
        <Alert color="blue" title={t('users.assignmentsForm.platformAdminAlertTitle')}>
          {t('users.assignmentsForm.platformAdminAlertBody')}
        </Alert>
        <Group gap="xs">
          <Button size="sm" variant="default" onClick={onCancel}>
            {t('common:actions.close')}
          </Button>
        </Group>
      </Stack>
    );
  }

  const teamOptions = allTeams.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.departmentName})`,
  }));

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const hasChanges =
    teamId !== (currentTeam?.id ?? '') ||
    (teamId !== '' && teamRole !== currentTeamRole(currentTeam)) ||
    departmentLeadId !== (currentDeptLead?.id ?? '') ||
    departmentAuthorId !== (currentDeptAuthor?.id ?? '');

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">
        {t('users.assignmentsForm.hint')}
      </Text>
      <Select
        label={t('users.assignmentsForm.teamLabel')}
        placeholder={t('users.assignmentsForm.teamPlaceholder')}
        data={teamOptions}
        value={teamId || null}
        onChange={(v) => setTeamId(v ?? '')}
        clearable
        size="sm"
      />
      <Select
        label={t('users.assignmentsForm.teamRoleLabel')}
        data={[
          { value: 'Member', label: teamRoleLabel(t, 'Member') },
          { value: 'Author', label: teamRoleLabel(t, 'Author') },
          { value: 'Lead', label: teamRoleLabel(t, 'Lead') },
        ]}
        value={teamRole}
        onChange={(v) => v && setTeamRole(v as TeamRole)}
        disabled={!teamId}
        size="sm"
      />
      <Select
        label={t('users.assignmentsForm.departmentLeadLabel')}
        placeholder={t('shared.leadOptionalNone')}
        description={t('users.assignmentsForm.departmentLeadDescription')}
        data={departmentOptions}
        value={departmentLeadId || null}
        onChange={(v) => setDepartmentLeadId(v ?? '')}
        clearable
        size="sm"
      />
      <Select
        label={t('users.assignmentsForm.departmentAuthorLabel')}
        placeholder={t('shared.leadOptionalNone')}
        description={t('users.assignmentsForm.departmentAuthorDescription')}
        data={departmentOptions}
        value={departmentAuthorId || null}
        onChange={(v) => setDepartmentAuthorId(v ?? '')}
        clearable
        size="sm"
      />
      <Group gap="xs" mt="xs">
        <Button size="sm" variant="default" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          size="sm"
          onClick={() => void handleSave()}
          loading={isPendingMut}
          disabled={!hasChanges}
        >
          {t('common:actions.save')}
        </Button>
      </Group>
    </Stack>
  );
}
