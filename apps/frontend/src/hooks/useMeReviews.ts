import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { useLiveEventsContext } from './liveEventsContext';

const REVIEWS_POLL_MS = 15_000;

export type ReviewDraftChangeDocumentItem = {
  documentId: string;
  documentTitle: string;
  scopeType: 'team' | 'department' | 'company' | 'personal';
  scopeId: string | null;
  scopeName: string;
  changeCount: number;
  lastChangeAt: string;
  lastAuthorId: string;
  lastAuthorName: string | null;
  affectedBlockSummary: string | null;
};

export type ReviewMyDraftChangeItem = {
  changeId: string;
  documentId: string;
  documentTitle: string;
  scopeType: 'team' | 'department' | 'company' | 'personal';
  scopeId: string | null;
  scopeName: string;
  savedAt: string;
  revisionFrom: number;
  revisionTo: number;
  affectedBlockSummary: string | null;
};

export type MeReviewsResponse = {
  pendingForReview: ReviewDraftChangeDocumentItem[];
  myChanges: ReviewMyDraftChangeItem[];
  totalPendingForReview: number;
  totalMyChanges: number;
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
  const { fallbackPollingActive } = useLiveEventsContext();
  const pollInterval =
    options?.refetchInterval !== undefined
      ? options.refetchInterval
      : fallbackPollingActive
        ? REVIEWS_POLL_MS
        : false;
  return useQuery({
    queryKey: meReviewsQueryKey({ limit, offset }),
    queryFn: () => fetchMeReviews({ limit, offset }),
    enabled: options?.enabled !== false,
    refetchInterval: pollInterval,
  });
}
