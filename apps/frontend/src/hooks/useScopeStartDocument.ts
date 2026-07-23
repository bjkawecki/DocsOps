import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';
import { mePulseStartHereQueryKey } from './useMePulseStartHere.js';

export type StartHereScopeType = 'team' | 'department' | 'company';

function scopePath(scopeType: StartHereScopeType, scopeId: string): string {
  if (scopeType === 'team') return `/api/v1/teams/${scopeId}/start-document`;
  if (scopeType === 'department') return `/api/v1/departments/${scopeId}/start-document`;
  return `/api/v1/companies/${scopeId}/start-document`;
}

async function throwIfNotOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  const err = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(err.error ?? fallback);
}

export function useSetScopeStartDocument(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { scopeType: StartHereScopeType; scopeId: string }) => {
      const res = await apiFetch(scopePath(args.scopeType, args.scopeId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      await throwIfNotOk(res, 'Failed to set Start here');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      void queryClient.invalidateQueries({ queryKey: mePulseStartHereQueryKey() });
    },
  });
}

export function useClearScopeStartDocument(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { scopeType: StartHereScopeType; scopeId: string }) => {
      const res = await apiFetch(scopePath(args.scopeType, args.scopeId), {
        method: 'DELETE',
      });
      await throwIfNotOk(res, 'Failed to clear Start here');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
      void queryClient.invalidateQueries({ queryKey: mePulseStartHereQueryKey() });
    },
  });
}
