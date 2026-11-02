import { useQuery } from '@tanstack/react-query';
import type { ReleaseDetailResponse, ReleasesListResponse } from 'backend/api-types';
import { apiFetch } from '../api/client';

export function releasesQueryKey(): readonly ['releases', 'list'] {
  return ['releases', 'list'] as const;
}

export function releaseDetailQueryKey(version: string): readonly ['releases', 'detail', string] {
  return ['releases', 'detail', version] as const;
}

export async function fetchReleasesList(): Promise<ReleasesListResponse> {
  const res = await apiFetch('/api/v1/releases');
  if (!res.ok) throw new Error('Failed to load releases');
  return res.json() as Promise<ReleasesListResponse>;
}

export async function fetchReleaseDetail(version: string): Promise<ReleaseDetailResponse> {
  const res = await apiFetch(`/api/v1/releases/${encodeURIComponent(version)}`);
  if (!res.ok) throw new Error(`Failed to load release ${version}`);
  return res.json() as Promise<ReleaseDetailResponse>;
}

export function useReleasesList() {
  return useQuery({
    queryKey: releasesQueryKey(),
    queryFn: fetchReleasesList,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
