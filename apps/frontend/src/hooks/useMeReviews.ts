import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';

export type ReviewPendingSuggestionsItem = {
  documentId: string;
  documentTitle: string;
  scopeType: 'team' | 'department' | 'company' | 'personal';
  scopeId: string | null;
  scopeName: string;
  pendingSuggestionCount: number;
  lastSuggestionAt: string | null;
  authorIds: string[];
};

export type MeReviewsResponse = {
  pendingForReview: ReviewPendingSuggestionsItem[];
  totalPendingForReview: number;
  limit: number;
  offset: number;
};

export type MeReviewsQueryParams = {
  limit?: number;
  offset?: number;
};

export function meReviewsQueryKey(params?: MeReviewsQueryParams): unknown[] {
  const key: unknown[] = ['me', 'reviews'];
  if (params?.limit != null) key.push('limit', params.limit);
  if (params?.offset != null) key.push('offset', params.offset);
  return key;
}

export async function fetchMeReviews(params?: MeReviewsQueryParams): Promise<MeReviewsResponse> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  const url = qs ? `/api/v1/me/reviews?${qs}` : '/api/v1/me/reviews';
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to load reviews');
  return (await res.json()) as MeReviewsResponse;
}

export function useMeReviews(
  params?: MeReviewsQueryParams,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  const limit = params?.limit ?? 20;
  const offset = params?.offset ?? 0;
  return useQuery({
    queryKey: meReviewsQueryKey({ limit, offset }),
    queryFn: () => fetchMeReviews({ limit, offset }),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval ?? false,
  });
}
