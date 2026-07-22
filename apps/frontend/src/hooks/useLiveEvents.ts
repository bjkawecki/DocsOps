import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiBase } from '../api/client';
import {
  collaborationHintQueryKey,
  fetchLeadDraft,
  leadDraftQueryKey,
} from '../components/documents/documentLeadDraft/leadDraftQuery.js';
import { fetchDocument } from '../pages/documentPage/fetchDocument.js';
import { maintenanceStatusQueryKey, type MaintenanceStatus } from './useMaintenanceStatus';
import { adminUpdateStatusQueryKey } from './useAdminUpdateStatus';
import { appVersionQueryKey } from './useAppVersion';
import { LiveEventsContext, type LiveEventsStatus } from './liveEventsContext';

const INITIAL_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;
const DISCONNECTED_AFTER_ATTEMPTS = 3;
const SILENT_RECONNECT_BANNER_MS = 1_500;

type ConnectOptions = {
  /** Tab focus resume: reconnect without an immediate banner flash. */
  silent?: boolean;
};

export type DocumentCollaborationHint = {
  draftRevision?: number;
  pendingSuggestionCount?: number;
  publishedVersionNumber?: number;
  reason?: 'draft' | 'published';
};

type LiveClientEvent =
  | { v: 1; type: 'notification.unread-changed' }
  | { v: 1; type: 'pulse.changed' }
  | {
      v: 1;
      type: 'maintenance.status-changed';
      payload: MaintenanceStatus;
    }
  | {
      v: 1;
      type: 'document.collaboration-changed';
      payload: { documentId: string } & DocumentCollaborationHint;
    }
  | {
      v: 1;
      type: 'document.draft-presence';
      payload: { documentId: string; editors: Array<{ userId: string; name: string }> };
    };

async function handleDocumentCollaborationChanged(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
  hint?: DocumentCollaborationHint
): Promise<void> {
  if (hint && Object.keys(hint).length > 0) {
    queryClient.setQueryData(
      collaborationHintQueryKey(documentId),
      (prev: DocumentCollaborationHint | null | undefined) => ({
        ...(prev ?? {}),
        ...hint,
      })
    );
    if (hint.reason === 'published' && hint.publishedVersionNumber != null) {
      queryClient.setQueryData(
        ['document', documentId],
        (prev: { currentPublishedVersionNumber?: number | null } | undefined) => {
          if (!prev) return prev;
          return { ...prev, currentPublishedVersionNumber: hint.publishedVersionNumber };
        }
      );
    }
  }

  await Promise.all([
    queryClient.fetchQuery({
      queryKey: ['document', documentId],
      queryFn: () => fetchDocument(documentId),
    }),
    queryClient.fetchQuery({
      queryKey: leadDraftQueryKey(documentId),
      queryFn: () => fetchLeadDraft(documentId),
    }),
  ]);

  void queryClient.invalidateQueries({ queryKey: ['me', 'reviews'] });
  void queryClient.invalidateQueries({ queryKey: ['me', 'pulse'] });
}

function applyDraftPresencePayload(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
  editors: Array<{ userId: string; name: string }>
): void {
  queryClient.setQueryData(['document', documentId, 'draft-presence'], editors);
}

function parseLiveClientEvent(data: string): LiveClientEvent | null {
  try {
    const parsed: unknown = JSON.parse(data);
    if (parsed == null || typeof parsed !== 'object') return null;
    const event = parsed as Record<string, unknown>;
    if (event.v !== 1 || typeof event.type !== 'string') return null;
    if (event.type === 'notification.unread-changed') {
      return { v: 1, type: 'notification.unread-changed' };
    }
    if (event.type === 'pulse.changed') {
      return { v: 1, type: 'pulse.changed' };
    }
    if (event.type === 'maintenance.status-changed') {
      const payload = event.payload;
      if (payload == null || typeof payload !== 'object') return null;
      const p = payload as Record<string, unknown>;
      if (typeof p.active !== 'boolean') return null;
      const reason = p.reason;
      if (
        reason !== undefined &&
        reason !== 'backup' &&
        reason !== 'restore' &&
        reason !== 'platform-import' &&
        reason !== 'update'
      ) {
        return null;
      }
      const startedAt = p.startedAt;
      if (startedAt !== undefined && typeof startedAt !== 'string') return null;
      return {
        v: 1,
        type: 'maintenance.status-changed',
        payload: {
          active: p.active,
          ...(reason != null ? { reason } : {}),
          ...(typeof startedAt === 'string' ? { startedAt } : {}),
        },
      };
    }
    if (event.type === 'document.collaboration-changed') {
      const payload = event.payload;
      if (payload == null || typeof payload !== 'object') return null;
      const p = payload as Record<string, unknown>;
      const documentId = p.documentId;
      if (typeof documentId !== 'string' || documentId.length === 0) return null;
      const hint: DocumentCollaborationHint = {};
      if (
        typeof p.draftRevision === 'number' &&
        Number.isInteger(p.draftRevision) &&
        p.draftRevision >= 0
      ) {
        hint.draftRevision = p.draftRevision;
      }
      if (
        typeof p.pendingSuggestionCount === 'number' &&
        Number.isInteger(p.pendingSuggestionCount) &&
        p.pendingSuggestionCount >= 0
      ) {
        hint.pendingSuggestionCount = p.pendingSuggestionCount;
      }
      if (
        typeof p.publishedVersionNumber === 'number' &&
        Number.isInteger(p.publishedVersionNumber) &&
        p.publishedVersionNumber > 0
      ) {
        hint.publishedVersionNumber = p.publishedVersionNumber;
      }
      if (p.reason === 'draft' || p.reason === 'published') {
        hint.reason = p.reason;
      }
      return {
        v: 1,
        type: 'document.collaboration-changed',
        payload: { documentId, ...hint },
      };
    }
    if (event.type === 'document.draft-presence') {
      const payload = event.payload;
      if (payload == null || typeof payload !== 'object') return null;
      const p = payload as Record<string, unknown>;
      const documentId = p.documentId;
      if (typeof documentId !== 'string' || documentId.length === 0) return null;
      const editorsRaw = p.editors;
      if (!Array.isArray(editorsRaw)) return null;
      const editors: Array<{ userId: string; name: string }> = [];
      for (const entry of editorsRaw) {
        if (entry == null || typeof entry !== 'object') return null;
        const row = entry as Record<string, unknown>;
        if (typeof row.userId !== 'string' || typeof row.name !== 'string') return null;
        editors.push({ userId: row.userId, name: row.name });
      }
      return {
        v: 1,
        type: 'document.draft-presence',
        payload: { documentId, editors },
      };
    }
    return null;
  } catch {
    return null;
  }
}

function buildEventsUrl(): string {
  const path = '/api/v1/me/events';
  return apiBase ? `${apiBase}${path}` : path;
}

function invalidatePostMaintenanceQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: appVersionQueryKey() });
  void queryClient.invalidateQueries({ queryKey: adminUpdateStatusQueryKey });
}

function catchUpQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ['me', 'notifications', 'unread-count'] });
  void queryClient.invalidateQueries({ queryKey: ['me', 'pulse'] });
  void queryClient.invalidateQueries({ queryKey: maintenanceStatusQueryKey() });
  invalidatePostMaintenanceQueries(queryClient);
}

export type UseLiveEventsResult = {
  status: LiveEventsStatus;
  retryConnect: () => void;
};

/**
 * Holds the authenticated SSE stream for live UI signals (§23a).
 * Disconnects when the tab is hidden; reconnects silently on focus, with banner only
 * after delay or on error-driven backoff.
 */
export function useLiveEvents(): UseLiveEventsResult {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<LiveEventsStatus>('connected');
  const hasConnectedOnceRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_MS);
  const silentBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current != null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearSilentBannerTimer = useCallback(() => {
    if (silentBannerTimerRef.current != null) {
      clearTimeout(silentBannerTimerRef.current);
      silentBannerTimerRef.current = null;
    }
  }, []);

  const closeEventSource = useCallback(() => {
    const es = eventSourceRef.current;
    if (es) {
      es.close();
      eventSourceRef.current = null;
    }
  }, []);

  const handleLiveEvent = useCallback(
    (event: LiveClientEvent) => {
      if (event.type === 'notification.unread-changed') {
        void queryClient.invalidateQueries({ queryKey: ['me', 'notifications', 'unread-count'] });
        return;
      }
      if (event.type === 'pulse.changed') {
        void queryClient.invalidateQueries({ queryKey: ['me', 'pulse'] });
        return;
      }
      if (event.type === 'document.collaboration-changed') {
        void handleDocumentCollaborationChanged(
          queryClient,
          event.payload.documentId,
          event.payload
        );
        return;
      }
      if (event.type === 'document.draft-presence') {
        applyDraftPresencePayload(queryClient, event.payload.documentId, event.payload.editors);
        return;
      }
      queryClient.setQueryData(maintenanceStatusQueryKey(), event.payload);
      if (!event.payload.active) {
        invalidatePostMaintenanceQueries(queryClient);
      }
    },
    [queryClient]
  );

  const connectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (!visibleRef.current) return;

    reconnectAttemptRef.current += 1;
    if (reconnectAttemptRef.current >= DISCONNECTED_AFTER_ATTEMPTS) {
      setStatus('disconnected');
    } else if (hasConnectedOnceRef.current) {
      setStatus('reconnecting');
    }

    clearReconnectTimer();
    const delay = reconnectDelayRef.current;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (!visibleRef.current) return;
      connectRef.current();
    }, delay);
    reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_MS);
  }, [clearReconnectTimer]);

  const connect = useCallback(
    (options?: ConnectOptions) => {
      if (!visibleRef.current) return;

      closeEventSource();
      clearReconnectTimer();
      clearSilentBannerTimer();

      if (hasConnectedOnceRef.current && !options?.silent) {
        setStatus('reconnecting');
      } else if (hasConnectedOnceRef.current && options?.silent) {
        silentBannerTimerRef.current = setTimeout(() => {
          silentBannerTimerRef.current = null;
          if (!visibleRef.current) return;
          setStatus('reconnecting');
        }, SILENT_RECONNECT_BANNER_MS);
      }

      const es = new EventSource(buildEventsUrl(), { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        clearSilentBannerTimer();
        hasConnectedOnceRef.current = true;
        reconnectAttemptRef.current = 0;
        reconnectDelayRef.current = INITIAL_RECONNECT_MS;
        setStatus('connected');
      };

      es.onmessage = (message: MessageEvent<string>) => {
        const event = parseLiveClientEvent(message.data);
        if (event) handleLiveEvent(event);
      };

      es.addEventListener('ping', () => {
        // keep-alive only
      });

      es.onerror = () => {
        clearSilentBannerTimer();
        closeEventSource();
        scheduleReconnect();
      };
    },
    [
      clearReconnectTimer,
      clearSilentBannerTimer,
      closeEventSource,
      handleLiveEvent,
      scheduleReconnect,
    ]
  );

  connectRef.current = connect;

  const retryConnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    reconnectDelayRef.current = INITIAL_RECONNECT_MS;
    if (hasConnectedOnceRef.current) {
      setStatus('reconnecting');
    }
    connect();
  }, [connect]);

  useEffect(() => {
    const onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      visibleRef.current = visible;

      if (!visible) {
        clearReconnectTimer();
        clearSilentBannerTimer();
        closeEventSource();
        return;
      }

      reconnectAttemptRef.current = 0;
      reconnectDelayRef.current = INITIAL_RECONNECT_MS;
      catchUpQueries(queryClient);
      connect({ silent: true });
    };

    if (visibleRef.current) {
      connect();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearReconnectTimer();
      clearSilentBannerTimer();
      closeEventSource();
    };
  }, [clearReconnectTimer, clearSilentBannerTimer, closeEventSource, connect, queryClient]);

  return { status, retryConnect };
}

export { LiveEventsContext };
