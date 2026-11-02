import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';

export type MeMoveRequestItem = {
  id: string;
  documentId: string;
  documentTitle: string;
  fromContextId: string;
  toContextId: string;
  fromOwnerId: string;
  toOwnerId: string;
  status: string;
  note: string | null;
  decisionNote: string | null;
  requestedById: string;
  requestedByName: string | null;
  decidedById: string | null;
  createdAt: string;
  decidedAt: string | null;
  fromScopeName: string;
  toScopeName: string;
  canAccept: boolean;
  canReject: boolean;
  canWithdraw: boolean;
};

export type MeMoveRequestsResponse = {
  items: MeMoveRequestItem[];
  total: number;
  limit: number;
  offset: number;
  direction: 'inbound' | 'outbound';
  status: string;
};

export type MeMoveRequestsQueryParams = {
  direction?: 'inbound' | 'outbound';
  status?: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  limit?: number;
  offset?: number;
};

export function meMoveRequestsQueryKey(params?: MeMoveRequestsQueryParams): unknown[] {
  return [
    'me',
    'move-requests',
    params?.direction ?? 'inbound',
    params?.status ?? 'pending',
    params?.limit ?? 20,
    params?.offset ?? 0,
  ];
}

export async function fetchMeMoveRequests(
  params?: MeMoveRequestsQueryParams
): Promise<MeMoveRequestsResponse> {
  const search = new URLSearchParams();
  search.set('direction', params?.direction ?? 'inbound');
  search.set('status', params?.status ?? 'pending');
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.offset != null) search.set('offset', String(params.offset));
  const res = await apiFetch(`/api/v1/me/move-requests?${search.toString()}`);
  if (!res.ok) throw new Error('Failed to load move requests');
  return (await res.json()) as MeMoveRequestsResponse;
}

export function useMeMoveRequests(
  params?: MeMoveRequestsQueryParams,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  const direction = params?.direction ?? 'inbound';
  const status = params?.status ?? 'pending';
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  return useQuery({
    queryKey: meMoveRequestsQueryKey({ direction, status, limit, offset }),
    queryFn: () => fetchMeMoveRequests({ direction, status, limit, offset }),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval ?? false,
  });
}
