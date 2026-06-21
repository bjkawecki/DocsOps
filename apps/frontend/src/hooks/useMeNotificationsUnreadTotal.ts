import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { useMe } from './useMe';
import { useLiveEventsContext } from './liveEventsContext';

function getFallbackPollIntervalMs(): number {
  const raw = import.meta.env.VITE_LIVE_EVENTS_FALLBACK_POLL_SECONDS;
  if (raw == null || raw === '') return 0;
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return seconds * 1000;
}

type NotificationsResponse = {
  items: unknown[];
  total: number;
};

/**
 * Unread in-app notification count for sidebar badge (uses list endpoint total).
 */
export function useMeNotificationsUnreadTotal() {
  const { data: me } = useMe();
  const { fallbackPollingActive } = useLiveEventsContext();
  const fallbackMs = getFallbackPollIntervalMs();
  const refetchInterval = fallbackPollingActive && fallbackMs > 0 ? fallbackMs : false;

  return useQuery({
    queryKey: ['me', 'notifications', 'unread-count'] as const,
    queryFn: async (): Promise<number> => {
      const sp = new URLSearchParams();
      sp.set('limit', '1');
      sp.set('offset', '0');
      sp.set('unreadOnly', 'true');
      const res = await apiFetch(`/api/v1/me/notifications?${sp.toString()}`);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? 'Failed to load notifications');
      }
      const body = (await res.json()) as NotificationsResponse;
      return body.total;
    },
    enabled: !!me,
    staleTime: 30_000,
    refetchInterval,
  });
}
