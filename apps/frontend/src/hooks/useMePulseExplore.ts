import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';

export type PulseExploreItem = { id: string; title: string };
export type PulseExploreColumn = {
  key: string;
  title: string;
  items: PulseExploreItem[];
};
export type MePulseExploreResponse = { columns: PulseExploreColumn[] };

export function mePulseExploreQueryKey(): unknown[] {
  return ['me', 'pulse', 'explore'];
}

export async function fetchMePulseExplore(): Promise<MePulseExploreResponse> {
  const res = await apiFetch('/api/v1/me/pulse/explore');
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Failed to load explore');
  }
  return (await res.json()) as MePulseExploreResponse;
}

/** Explore columns for Pulse home (always-on under the feed). */
export function useMePulseExplore(enabled: boolean) {
  return useQuery({
    queryKey: mePulseExploreQueryKey(),
    queryFn: fetchMePulseExplore,
    enabled,
  });
}
