import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api/client.js';

export type PulseItemKind =
  | 'draft-open'
  | 'review-awaiting'
  | 'review-decided'
  | 'document-new'
  | 'document-updated'
  | 'document-comments';

export type PulseSettings = {
  showDrafts: boolean;
  showReviews: boolean;
  showNewDocuments: boolean;
  showUpdatedDocuments: boolean;
  showComments: boolean;
};

export type PulseStats = {
  openDrafts: number;
  reviewsAwaiting: number;
  reviewsDecidedUnread: number;
  newDocuments: number;
  updatedDocuments: number;
  comments: number;
  newDocumentsLast24h: number;
  updatedDocumentsLast24h: number;
  commentsLast24h: number;
};

export type PulseItem = {
  id: string;
  kind: PulseItemKind;
  title: string;
  body: string;
  href: string;
  occurredAt: string;
  documentId: string;
  meta: {
    scopeName?: string;
    contextName?: string;
    commentCount?: number;
    pendingSuggestionCount?: number;
    decision?: 'merged' | 'rejected';
  };
};

export type MePulseResponse = {
  stats: PulseStats;
  items: PulseItem[];
  settings: PulseSettings;
  total: number;
  limit: number;
  offset: number;
};

export const PULSE_PAGE_SIZE = 20;

export function mePulseQueryKey(kind?: PulseItemKind): unknown[] {
  return kind ? ['me', 'pulse', kind] : ['me', 'pulse'];
}

export async function fetchMePulsePage(
  kind: PulseItemKind | undefined,
  offset: number,
  limit: number = PULSE_PAGE_SIZE
): Promise<MePulseResponse> {
  const qs = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (kind) qs.set('kind', kind);
  const res = await apiFetch(`/api/v1/me/pulse?${qs.toString()}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Failed to load pulse');
  }
  return (await res.json()) as MePulseResponse;
}

export function useMePulseInfinite(kind?: PulseItemKind, options?: { enabled?: boolean }) {
  return useInfiniteQuery({
    queryKey: mePulseQueryKey(kind),
    initialPageParam: 0,
    enabled: options?.enabled !== false,
    queryFn: ({ pageParam }) => fetchMePulsePage(kind, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      if (loaded >= lastPage.total) return undefined;
      return loaded;
    },
  });
}

export function isPulseActivityKind(kind: PulseItemKind): boolean {
  return (
    kind === 'document-new' ||
    kind === 'document-updated' ||
    kind === 'document-comments' ||
    kind === 'review-decided'
  );
}

export function useMarkPulseItemRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiFetch(`/api/v1/me/pulse/items/${encodeURIComponent(itemId)}/read`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to mark pulse item as read');
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me', 'pulse'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    },
  });
}
