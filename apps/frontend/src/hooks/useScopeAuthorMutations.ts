import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../api/client';
import { scopePeopleKeys } from './useScopePeople';

async function readError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
}

export function useTeamAuthorMutations(teamId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!teamId) return;
    await queryClient.invalidateQueries({ queryKey: scopePeopleKeys.team(teamId) });
    await queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
  };

  const assignAuthor = useMutation({
    mutationFn: async (userId: string) => {
      if (!teamId) return;
      const res = await apiFetch(`/api/v1/teams/${teamId}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Could not assign author role.'));
    },
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'green', message: 'Author role assigned.' });
    },
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    },
  });

  const removeAuthor = useMutation({
    mutationFn: async (userId: string) => {
      if (!teamId) return;
      const res = await apiFetch(`/api/v1/teams/${teamId}/authors/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readError(res, 'Could not remove author role.'));
    },
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'green', message: 'Author role removed.' });
    },
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    },
  });

  return {
    assignAuthor,
    removeAuthor,
    isPending: assignAuthor.isPending || removeAuthor.isPending,
  };
}

export function useDepartmentAuthorMutations(departmentId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    if (!departmentId) return;
    await queryClient.invalidateQueries({ queryKey: scopePeopleKeys.department(departmentId) });
    await queryClient.invalidateQueries({ queryKey: ['departments', departmentId] });
  };

  const assignAuthor = useMutation({
    mutationFn: async (userId: string) => {
      if (!departmentId) return;
      const res = await apiFetch(`/api/v1/departments/${departmentId}/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(await readError(res, 'Could not assign author role.'));
    },
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'green', message: 'Author role assigned.' });
    },
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    },
  });

  const removeAuthor = useMutation({
    mutationFn: async ({ userId, teamId }: { userId: string; teamId: string }) => {
      if (!departmentId) return;
      const res = await apiFetch(
        `/api/v1/departments/${departmentId}/authors/${userId}?teamId=${encodeURIComponent(teamId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error(await readError(res, 'Could not remove author role.'));
    },
    onSuccess: async () => {
      await invalidate();
      notifications.show({ color: 'green', message: 'Author role removed.' });
    },
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    },
  });

  return {
    assignAuthor,
    removeAuthor,
    isPending: assignAuthor.isPending || removeAuthor.isPending,
  };
}
