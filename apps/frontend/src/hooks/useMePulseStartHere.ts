import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';

export type MePulseStartHereItem = {
  documentId: string;
  title: string;
  scopeType: 'team' | 'department' | 'company';
  scopeId: string;
  scopeName: string;
};

export type MePulseStartHereResponse = { items: MePulseStartHereItem[] };

export function mePulseStartHereQueryKey(): unknown[] {
  return ['me', 'pulse', 'start-here'];
}

export async function fetchMePulseStartHere(): Promise<MePulseStartHereResponse> {
  const res = await apiFetch('/api/v1/me/pulse/start-here');
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Failed to load start here');
  }
  return (await res.json()) as MePulseStartHereResponse;
}

/** Start here documents for Pulse home (one per readable scope). */
export function useMePulseStartHere(enabled: boolean) {
  return useQuery({
    queryKey: mePulseStartHereQueryKey(),
    queryFn: fetchMePulseStartHere,
    enabled,
  });
}
