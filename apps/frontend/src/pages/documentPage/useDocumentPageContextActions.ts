import type { QueryClient } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import type { DocumentResponse } from './documentPageTypes';

export type MoveContextSelectOption = {
  value: string;
  label: string;
  ownerId?: string | null;
};

export type UseDocumentPageContextActionsArgs = {
  documentId: string | undefined;
  data: DocumentResponse | undefined;
  contextOwnerId: string | null;
  queryClient: QueryClient;
  t: TFunction;
  assignContextId: string | null;
  setAssignContextId: (id: string | null) => void;
  closeAssignContext: () => void;
  setAssignContextLoading: (v: boolean) => void;
  moveContextId: string | null;
  setMoveContextId: (id: string | null) => void;
  closeMoveContext: () => void;
  moveRequestNote: string;
  setMoveRequestNote: (v: string) => void;
  moveContextOptions: MoveContextSelectOption[];
  setMoveContextLoading: (v: boolean) => void;
  setMoveDecisionLoading: (v: boolean) => void;
};

/** Assign-context / move-context handlers, plus the move-request accept/reject/withdraw decisions. */
export function useDocumentPageContextActions({
  documentId,
  data,
  contextOwnerId,
  queryClient,
  t,
  assignContextId,
  setAssignContextId,
  closeAssignContext,
  setAssignContextLoading,
  moveContextId,
  setMoveContextId,
  closeMoveContext,
  moveRequestNote,
  setMoveRequestNote,
  moveContextOptions,
  setMoveContextLoading,
  setMoveDecisionLoading,
}: UseDocumentPageContextActionsArgs) {
  const handleAssignContext = async () => {
    if (!documentId || !assignContextId) return;
    setAssignContextLoading(true);
    try {
      const res = await apiFetch(`/api/v1/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextId: assignContextId }),
      });
      if (res.ok) {
        closeAssignContext();
        if (data?.contextId)
          void queryClient.invalidateQueries({
            queryKey: ['contexts', data.contextId, 'documents'],
          });
        if (assignContextId)
          void queryClient.invalidateQueries({
            queryKey: ['contexts', assignContextId, 'documents'],
          });
        setAssignContextId(null);
        void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'drafts'] });
        notifications.show({
          title: t('documentPage.toasts.contextAssignedTitle'),
          message: t('documentPage.toasts.contextAssignedMessage'),
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setAssignContextLoading(false);
    }
  };

  const onCloseMoveContext = () => {
    closeMoveContext();
    setMoveContextId(null);
    setMoveRequestNote('');
  };

  const selectedMoveOption = moveContextOptions.find((o) => o.value === moveContextId);
  const moveTargetIsCrossOwner =
    selectedMoveOption != null &&
    contextOwnerId != null &&
    selectedMoveOption.ownerId != null &&
    selectedMoveOption.ownerId !== contextOwnerId;

  const handleMoveContext = async () => {
    if (!documentId || !moveContextId) return;
    setMoveContextLoading(true);
    try {
      const fromContextId = data?.contextId ?? null;
      const isRequest = moveTargetIsCrossOwner;
      const res = await apiFetch(
        isRequest
          ? `/api/v1/documents/${documentId}/move-requests`
          : `/api/v1/documents/${documentId}/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isRequest
              ? {
                  targetContextId: moveContextId,
                  note: moveRequestNote.trim() ? moveRequestNote.trim() : null,
                }
              : { targetContextId: moveContextId }
          ),
        }
      );
      if (res.ok) {
        onCloseMoveContext();
        if (!isRequest && fromContextId) {
          void queryClient.invalidateQueries({
            queryKey: ['contexts', fromContextId, 'documents'],
          });
          void queryClient.invalidateQueries({
            queryKey: ['contexts', moveContextId, 'documents'],
          });
        }
        void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'drafts'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'move-requests'] });
        notifications.show({
          title: isRequest
            ? t('documentPage.toasts.moveRequestedTitle')
            : t('documentPage.toasts.movedTitle'),
          message: isRequest
            ? t('documentPage.toasts.moveRequestedMessage')
            : t('documentPage.toasts.movedMessage'),
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setMoveContextLoading(false);
    }
  };

  const handleMoveRequestDecision = async (action: 'accept' | 'reject' | 'withdraw') => {
    const pending = data?.pendingMoveRequest;
    if (!documentId || !pending) return;
    setMoveDecisionLoading(true);
    try {
      const res = await apiFetch(
        `/api/v1/documents/${documentId}/move-requests/${pending.id}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) {
        void queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'move-requests'] });
        notifications.show({
          title:
            action === 'accept'
              ? t('documentPage.toasts.moveAcceptedTitle')
              : action === 'reject'
                ? t('documentPage.toasts.moveRejectedTitle')
                : t('documentPage.toasts.moveWithdrawnTitle'),
          message:
            action === 'accept'
              ? t('documentPage.toasts.moveAcceptedMessage')
              : action === 'reject'
                ? t('documentPage.toasts.moveRejectedMessage')
                : t('documentPage.toasts.moveWithdrawnMessage'),
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setMoveDecisionLoading(false);
    }
  };

  const onCloseAssignContext = () => {
    closeAssignContext();
    setAssignContextId(null);
  };

  return {
    handleAssignContext,
    onCloseMoveContext,
    onCloseAssignContext,
    moveTargetIsCrossOwner,
    handleMoveContext,
    handleMoveRequestDecision,
  };
}
