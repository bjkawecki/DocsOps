import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
};

export function mePulseQueryKey(kind?: PulseItemKind): unknown[] {
  return kind ? ['me', 'pulse', kind] : ['me', 'pulse'];
}

export async function fetchMePulse(kind?: PulseItemKind): Promise<MePulseResponse> {
  const qs = new URLSearchParams({ limit: '50' });
  if (kind) qs.set('kind', kind);
  const res = await apiFetch(`/api/v1/me/pulse?${qs.toString()}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Failed to load pulse');
  }
  return (await res.json()) as MePulseResponse;
}

export function useMePulse(kind?: PulseItemKind, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: mePulseQueryKey(kind),
    queryFn: () => fetchMePulse(kind),
    enabled: options?.enabled !== false,
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
