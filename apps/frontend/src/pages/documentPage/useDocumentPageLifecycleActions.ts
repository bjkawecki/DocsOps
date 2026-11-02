import type { QueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import type { NavigateFunction } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import { scopeToUrl } from '../../lib/scopeNav';
import {
  invalidateDocumentArchivedTransitionCaches,
  invalidateDocumentIndexCaches,
} from './documentQueryInvalidation';
import type { DocumentResponse } from './documentPageTypes';

export type UseDocumentPageLifecycleActionsArgs = {
  documentId: string | undefined;
  data: DocumentResponse | undefined;
  queryClient: QueryClient;
  t: TFunction;
  navigate: NavigateFunction;
  setDeleteLoading: (v: boolean) => void;
  closeDelete: () => void;
};

/** Delete (move to trash), archive, and unarchive handlers for the document lifecycle. */
export function useDocumentPageLifecycleActions({
  documentId,
  data,
  queryClient,
  t,
  navigate,
  setDeleteLoading,
  closeDelete,
}: UseDocumentPageLifecycleActionsArgs) {
  const handleDeleteConfirm = async () => {
    if (!documentId) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/api/v1/documents/${documentId}`, { method: 'DELETE' });
      if (res.status === 204) {
        invalidateDocumentIndexCaches(queryClient, documentId, data?.contextId);
        void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
        closeDelete();
        notifications.show({
          title: t('documentPage.toasts.movedToTrashTitle'),
          message: t('documentPage.toasts.movedToTrashMessage'),
          color: 'green',
        });
        const scope = data?.scope;
        const target = scope != null ? scopeToUrl(scope) : '/catalog';
        void navigate(target, { replace: true });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!documentId) return;
    const res = await apiFetch(`/api/v1/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      invalidateDocumentArchivedTransitionCaches(queryClient, documentId, data?.contextId);
      notifications.show({
        title: t('documentPage.toasts.archivedTitle'),
        message: t('documentPage.toasts.archivedMessage'),
        color: 'green',
      });
      const scope = data?.scope;
      const target = scope != null ? scopeToUrl(scope) : '/catalog';
      void navigate(target, { replace: true });
    } else {
      void notifyApiErrorResponse(res);
    }
  };

  const handleUnarchive = async () => {
    if (!documentId) return;
    const res = await apiFetch(`/api/v1/documents/${documentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: null }),
    });
    if (res.ok) {
      invalidateDocumentArchivedTransitionCaches(queryClient, documentId, data?.contextId);
      notifications.show({
        title: t('documentPage.toasts.unarchivedTitle'),
        message: t('documentPage.toasts.unarchivedMessage'),
        color: 'green',
      });
    } else {
      void notifyApiErrorResponse(res);
    }
  };

  return { handleDeleteConfirm, handleArchive, handleUnarchive };
}
