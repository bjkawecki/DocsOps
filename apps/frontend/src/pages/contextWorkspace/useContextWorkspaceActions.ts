import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BLANK_DOCUMENT_SELECTION,
  type DocumentTypeSelection,
} from '../../components/documents/documentTypeTypes.js';
import { notifyApiErrorResponse } from '../../lib/notifyApiError';
import { scopeToUrl } from '../../lib/scopeNav';
import type { RecentScope } from '../../hooks/useRecentItems';
import { apiFetch } from '../../api/client';
import { submitNewContextDocumentDraft } from '../contextScope/submitNewContextDocumentDraft';
import { contextUrl } from './contextPaths.js';
import { entityEndpointBase, type ContextResponse } from './contextWorkspaceTypes.js';
import {
  showScopePdfExportQueuedNotification,
  updateScopePdfExportStatusNotification,
  type ScopePdfExportStatusResponse,
} from './scopePdfExportNotification.js';

type UseContextWorkspaceActionsArgs = {
  contextId: string | undefined;
  data: ContextResponse | undefined;
  scope: RecentScope | null;
  scopeKey: string | null;
};

export function useContextWorkspaceActions({
  contextId,
  data,
  scope,
  scopeKey,
}: UseContextWorkspaceActionsArgs) {
  const { t } = useTranslation(['contexts', 'common']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newDocOpened, { open: openNewDoc, close: closeNewDoc }] = useDisclosure(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocTagIds, setNewDocTagIds] = useState<string[]>([]);
  const [newDocTypeSelection, setNewDocTypeSelection] =
    useState<DocumentTypeSelection>(BLANK_DOCUMENT_SELECTION);
  const [newDocLoading, setNewDocLoading] = useState(false);
  const [newSubcontextOpened, { open: openNewSubcontext, close: closeNewSubcontext }] =
    useDisclosure(false);
  const [newSubcontextName, setNewSubcontextName] = useState('');
  const [newSubcontextLoading, setNewSubcontextLoading] = useState(false);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['context', contextId] });
    void queryClient.invalidateQueries({ queryKey: ['processes', 'siblings', scopeKey] });
    void queryClient.invalidateQueries({ queryKey: ['projects', 'siblings', scopeKey] });
  };

  const handleEditClick = () => {
    if (data) openEdit();
  };

  const handleEditSuccess = () => {
    invalidateAll();
    notifications.show({
      title: t('toasts.nameUpdatedTitle'),
      message: t('toasts.nameUpdatedMessage'),
      color: 'green',
    });
  };

  const pollScopePdfExport = async (runId: string, ctxId: string) => {
    const maxAttempts = 120;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await new Promise((r) => setTimeout(r, attempt === 0 ? 800 : 2500));
      const res = await apiFetch(`/api/v1/scope-pdf-exports/${runId}`);
      if (!res.ok) continue;
      const status = (await res.json()) as ScopePdfExportStatusResponse;
      updateScopePdfExportStatusNotification(ctxId, status);
      if (status.status === 'succeeded' || status.status === 'failed') return;
    }
    updateScopePdfExportStatusNotification(ctxId, {
      id: runId,
      status: 'failed',
      downloadUrl: null,
      errorMessage: t('pdfExport.timeoutMessage'),
      scopeKind: null,
      docsOk: 0,
      docsFailed: 0,
      docsTotal: 0,
    });
  };

  const handleExportPdfs = async () => {
    if (!contextId || !data) return;
    if (data.owner?.ownerUserId) return;
    const res = await apiFetch(`/api/v1/contexts/${contextId}/pdf-export`, { method: 'POST' });
    if (!res.ok) {
      await notifyApiErrorResponse(res, { title: t('pdfExport.startFailed') });
      return;
    }
    const body = (await res.json()) as { runId: string };
    showScopePdfExportQueuedNotification(contextId);
    void pollScopePdfExport(body.runId, contextId);
  };

  const handleArchive = async () => {
    if (!data || data.contextType === 'subcontext') return;
    const res = await apiFetch(`${entityEndpointBase(data.contextType)}/${data.entityId}`, {
      method: 'PATCH',
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    });
    if (res.ok) {
      invalidateAll();
      void queryClient.invalidateQueries({ queryKey: ['me', 'archive'] });
      void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
      notifications.show({
        title: t('toasts.archivedTitle'),
        message: t('toasts.archivedMessage'),
        color: 'green',
      });
    } else {
      void notifyApiErrorResponse(res);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!data) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`${entityEndpointBase(data.contextType)}/${data.entityId}`, {
        method: 'DELETE',
      });
      if (res.status === 204) {
        invalidateAll();
        void queryClient.invalidateQueries({ queryKey: ['me', 'trash'] });
        closeDelete();
        const target =
          data.contextType === 'subcontext' && data.parentProject
            ? contextUrl(data.parentProject.contextId)
            : scope
              ? scopeToUrl(scope)
              : '/';
        void navigate(target, { replace: true });
        notifications.show({
          title:
            data.contextType === 'subcontext'
              ? t('toasts.deletedTitle')
              : t('toasts.movedToTrashTitle'),
          message:
            data.contextType === 'subcontext'
              ? t('toasts.deletedMessage')
              : t('toasts.movedToTrashMessage'),
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!contextId) return;
    await submitNewContextDocumentDraft({
      contextId,
      title: newDocTitle,
      tagIds: newDocTagIds,
      typeId: newDocTypeSelection.typeId,
      templateId: newDocTypeSelection.templateId,
      queryClient,
      navigate,
      setLoading: setNewDocLoading,
      onSuccessCleanup: () => {
        closeNewDoc();
        setNewDocTitle('');
        setNewDocTagIds([]);
        setNewDocTypeSelection(BLANK_DOCUMENT_SELECTION);
      },
    });
  };

  const handleCreateSubcontext = async () => {
    if (!data || data.contextType !== 'project') return;
    const name = newSubcontextName.trim();
    if (!name) {
      notifications.show({
        title: t('toasts.nameRequiredTitle'),
        message: t('toasts.nameRequiredMessage'),
        color: 'yellow',
      });
      return;
    }
    setNewSubcontextLoading(true);
    try {
      const res = await apiFetch(`/api/v1/projects/${data.entityId}/subcontexts`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { contextId: string };
        invalidateAll();
        closeNewSubcontext();
        setNewSubcontextName('');
        void navigate(contextUrl(created.contextId));
        notifications.show({
          title: t('toasts.subcontextCreatedTitle'),
          message: t('toasts.subcontextCreatedMessage'),
          color: 'green',
        });
      } else {
        void notifyApiErrorResponse(res);
      }
    } finally {
      setNewSubcontextLoading(false);
    }
  };

  return {
    editOpened,
    closeEdit,
    handleEditClick,
    handleEditSuccess,
    deleteOpened,
    openDelete,
    closeDelete,
    deleteLoading,
    handleDeleteConfirm,
    handleArchive,
    handleExportPdfs,
    newDocOpened,
    openNewDoc,
    closeNewDoc,
    newDocTitle,
    setNewDocTitle,
    newDocTagIds,
    setNewDocTagIds,
    newDocTypeSelection,
    setNewDocTypeSelection,
    newDocLoading,
    handleCreateDocument,
    newSubcontextOpened,
    openNewSubcontext,
    closeNewSubcontext,
    newSubcontextName,
    setNewSubcontextName,
    newSubcontextLoading,
    handleCreateSubcontext,
  };
}
