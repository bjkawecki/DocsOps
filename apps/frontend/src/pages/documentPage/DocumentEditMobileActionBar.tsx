import { ActionIcon, Menu, Stack } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconArchive,
  IconArchiveOff,
  IconArrowsExchange,
  IconCloudUpload,
  IconDeviceFloppy,
  IconDotsVertical,
  IconDownload,
  IconFlag,
  IconFlagOff,
  IconHistory,
  IconTarget,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import type { DocumentResponse, PdfExportJobStatusResponse } from './documentPageTypes';
import './DocumentEditMobileActionBar.css';

export type DocumentEditMobileActionBarProps = {
  documentId: string;
  data: DocumentResponse;
  editTab: 'draft' | 'metadata' | 'access';
  leadDraftPanelRef: RefObject<DocumentLeadDraftPanelHandle | null>;
  leadDraftDirty: boolean;
  metadataDirty: boolean;
  leadDraftPendingSuggestions: number;
  saveLoading: boolean;
  publishLoading: boolean;
  showPublishButton: boolean;
  hasNoContext: boolean;
  pdfExportLoading: boolean;
  pdfExportStatus: PdfExportJobStatusResponse | undefined;
  moveDecisionLoading: boolean;
  startHereScopes: NonNullable<DocumentResponse['startHereScopes']>;
  startHereBusy: boolean;
  handleCancelEdit: () => void;
  handleSave: () => Promise<void>;
  handlePublish: () => Promise<void>;
  handleStartPdfExport: () => Promise<void>;
  handleArchive: () => Promise<void>;
  handleUnarchive: () => Promise<void>;
  openAssignContext: () => void;
  openMoveContext: () => void;
  onMoveRequestDecision: (action: 'accept' | 'reject' | 'withdraw') => void;
  openDelete: () => void;
  onSetStartHere: (scope: {
    scopeType: 'team' | 'department' | 'company';
    scopeId: string;
  }) => void;
  onClearStartHere: (scope: {
    scopeType: 'team' | 'department' | 'company';
    scopeId: string;
  }) => void;
};

/**
 * Compact edit focus chrome: cancel / save / overflow as a small vertical stack
 * at the bottom-right, floating over the document (above the shell debug FAB).
 */
export function DocumentEditMobileActionBar({
  documentId,
  data,
  editTab,
  leadDraftPanelRef,
  leadDraftDirty,
  metadataDirty,
  leadDraftPendingSuggestions,
  saveLoading,
  publishLoading,
  showPublishButton,
  hasNoContext,
  pdfExportLoading,
  pdfExportStatus,
  moveDecisionLoading,
  startHereScopes,
  startHereBusy,
  handleCancelEdit,
  handleSave,
  handlePublish,
  handleStartPdfExport,
  handleArchive,
  handleUnarchive,
  openAssignContext,
  openMoveContext,
  onMoveRequestDecision,
  openDelete,
  onSetStartHere,
  onClearStartHere,
}: DocumentEditMobileActionBarProps) {
  const { t } = useTranslation(['documents', 'common']);

  const saveDisabled =
    (editTab === 'draft' && !leadDraftDirty) ||
    (editTab === 'metadata' && !metadataDirty) ||
    editTab === 'access';

  const onSave = () =>
    void (editTab === 'draft' ? leadDraftPanelRef.current?.saveDraft() : handleSave());

  return (
    <div
      className="document-edit-mobile-actions"
      role="toolbar"
      aria-label={t('documentPage.toolbar.editDocumentAria')}
    >
      <Stack gap={6} align="center">
        <ActionIcon
          variant="filled"
          color="red"
          size={32}
          radius="xl"
          aria-label={t('documentPage.toolbar.cancel')}
          onClick={handleCancelEdit}
        >
          <IconX size={16} stroke={1.5} />
        </ActionIcon>
        <ActionIcon
          variant="filled"
          color="teal"
          size={32}
          radius="xl"
          aria-label={t('documentPage.toolbar.save')}
          loading={saveLoading}
          disabled={saveDisabled}
          onClick={onSave}
        >
          <IconDeviceFloppy size={16} stroke={1.5} />
        </ActionIcon>
        <Menu shadow="sm" position="left-end" withinPortal width={200}>
          <Menu.Target>
            <ActionIcon
              variant="filled"
              color="gray"
              size={32}
              radius="xl"
              aria-label={t('documentPage.toolbar.moreActionsAria')}
            >
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown className="document-edit-mobile-actions-menu">
            {showPublishButton && (
              <Menu.Item
                leftSection={<IconCloudUpload size={12} />}
                disabled={publishLoading}
                onClick={() => void handlePublish()}
              >
                {data.publishedAt
                  ? t('documentPage.toolbar.publishChanges')
                  : t('documentPage.toolbar.publish')}
              </Menu.Item>
            )}
            {data.canPublish && !showPublishButton && leadDraftPendingSuggestions > 0 && (
              <Menu.Item disabled>
                {t('documentPage.toolbar.resolvePendingSuggestions', {
                  count: leadDraftPendingSuggestions,
                })}
              </Menu.Item>
            )}
            {(showPublishButton ||
              (data.canPublish && !showPublishButton && leadDraftPendingSuggestions > 0)) && (
              <Menu.Divider />
            )}
            <Menu.Item
              component={Link}
              to={`/documents/${documentId}/versions`}
              leftSection={<IconHistory size={12} />}
            >
              {t('documentPage.menu.history')}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload size={12} />}
              disabled={pdfExportLoading}
              onClick={() => void handleStartPdfExport()}
            >
              {pdfExportLoading
                ? t('documentPage.menu.exportingPdf')
                : t('documentPage.menu.exportPdf')}
            </Menu.Item>
            {pdfExportStatus?.status === 'succeeded' && pdfExportStatus.downloadUrl && (
              <Menu.Item
                component="a"
                href={pdfExportStatus.downloadUrl}
                target="_blank"
                rel="noreferrer"
                leftSection={<IconDownload size={12} />}
              >
                {t('documentPage.menu.downloadPdf')}
              </Menu.Item>
            )}
            {hasNoContext && data.canWrite && (
              <Menu.Item leftSection={<IconTarget size={12} />} onClick={openAssignContext}>
                {t('documentPage.menu.assignContext')}
              </Menu.Item>
            )}
            {!hasNoContext && (data.canMove || data.canRequestMove) && !data.pendingMoveRequest && (
              <Menu.Item leftSection={<IconArrowsExchange size={12} />} onClick={openMoveContext}>
                {t('documentPage.menu.moveContext')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest?.canWithdraw && (
              <Menu.Item
                leftSection={<IconArrowsExchange size={12} />}
                disabled={moveDecisionLoading}
                onClick={() => onMoveRequestDecision('withdraw')}
              >
                {t('documentPage.menu.withdrawMoveRequest')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest?.canAccept && (
              <Menu.Item
                leftSection={<IconArrowsExchange size={12} />}
                disabled={moveDecisionLoading}
                onClick={() => onMoveRequestDecision('accept')}
              >
                {t('documentPage.menu.acceptMoveRequest')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest?.canReject && (
              <Menu.Item
                leftSection={<IconArrowsExchange size={12} />}
                disabled={moveDecisionLoading}
                onClick={() => onMoveRequestDecision('reject')}
              >
                {t('documentPage.menu.rejectMoveRequest')}
              </Menu.Item>
            )}
            {data.pendingMoveRequest && (
              <Menu.Item component={Link} to="/approvals?tab=moves">
                {t('documentPage.menu.openInApprovals')}
              </Menu.Item>
            )}
            {startHereScopes.length > 0 && <Menu.Divider />}
            {startHereScopes.map((scope) =>
              scope.isCurrent ? (
                <Menu.Item
                  key={`${scope.scopeType}:${scope.scopeId}`}
                  leftSection={<IconFlagOff size={12} />}
                  disabled={startHereBusy}
                  onClick={() =>
                    onClearStartHere({ scopeType: scope.scopeType, scopeId: scope.scopeId })
                  }
                >
                  {t('documentPage.menu.removeStartHere', { scope: scope.scopeName })}
                </Menu.Item>
              ) : (
                <Menu.Item
                  key={`${scope.scopeType}:${scope.scopeId}`}
                  leftSection={<IconFlag size={12} />}
                  disabled={startHereBusy}
                  onClick={() =>
                    onSetStartHere({ scopeType: scope.scopeType, scopeId: scope.scopeId })
                  }
                >
                  {t('documentPage.menu.setStartHere', { scope: scope.scopeName })}
                </Menu.Item>
              )
            )}
            {data.canWrite && !data.archivedAt && (
              <Menu.Item
                leftSection={<IconArchive size={12} />}
                onClick={() => void handleArchive()}
              >
                {t('documentPage.menu.archive')}
              </Menu.Item>
            )}
            {data.canWrite && data.archivedAt && (
              <Menu.Item
                leftSection={<IconArchiveOff size={12} />}
                onClick={() => void handleUnarchive()}
              >
                {t('documentPage.menu.unarchive')}
              </Menu.Item>
            )}
            {data.canDelete && <Menu.Divider />}
            {data.canDelete && (
              <Menu.Item color="red" leftSection={<IconTrash size={12} />} onClick={openDelete}>
                {t('documentPage.menu.moveToTrash')}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Stack>
    </div>
  );
}
