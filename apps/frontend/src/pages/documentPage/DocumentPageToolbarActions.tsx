import { ActionIcon, Button, Group, Menu, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Link } from 'react-router-dom';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconArchive,
  IconArchiveOff,
  IconPencil,
  IconTarget,
  IconArrowsExchange,
  IconTrash,
  IconCloudUpload,
  IconHistory,
  IconDotsVertical,
  IconDownload,
  IconFlag,
  IconFlagOff,
} from '@tabler/icons-react';
import { DESKTOP_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import type { DocumentResponse, PdfExportJobStatusResponse } from './documentPageTypes';

export type DocumentPageToolbarActionsProps = {
  documentId: string;
  data: DocumentResponse;
  mode: 'view' | 'edit';
  editTab: 'draft' | 'metadata' | 'access';
  leadDraftPanelRef: RefObject<DocumentLeadDraftPanelHandle | null>;
  leadDraftLastSynced: string | null;
  leadDraftDirty: boolean;
  metadataDirty: boolean;
  leadDraftPendingSuggestions: number;
  saveLoading: boolean;
  publishLoading: boolean;
  canEnterEditMode: boolean;
  showPublishButton: boolean;
  hasNoContext: boolean;
  pdfExportLoading: boolean;
  pdfExportStatus: PdfExportJobStatusResponse | undefined;
  moveDecisionLoading: boolean;
  startHereScopes: NonNullable<DocumentResponse['startHereScopes']>;
  startHereBusy: boolean;
  handleCancelEdit: () => void;
  handleSave: () => Promise<void>;
  handleEditClick: () => void;
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

/** Breadcrumb-row actions: edit/save/publish plus the overflow menu (versions, PDF, move, start here, archive, delete). */
export function DocumentPageToolbarActions({
  documentId,
  data,
  mode,
  editTab,
  leadDraftPanelRef,
  leadDraftLastSynced,
  leadDraftDirty,
  metadataDirty,
  leadDraftPendingSuggestions,
  saveLoading,
  publishLoading,
  canEnterEditMode,
  showPublishButton,
  hasNoContext,
  pdfExportLoading,
  pdfExportStatus,
  moveDecisionLoading,
  startHereScopes,
  startHereBusy,
  handleCancelEdit,
  handleSave,
  handleEditClick,
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
}: DocumentPageToolbarActionsProps) {
  const { t } = useTranslation(['documents', 'common']);
  const isDesktop = useMediaQuery(DESKTOP_MIN_WIDTH) ?? true;
  const iconBtnSize = isDesktop ? 36 : 44;

  return (
    <Group gap="xs">
      {mode === 'edit' && (
        <>
          <Button variant="default" size="sm" onClick={handleCancelEdit}>
            {t('documentPage.toolbar.cancel')}
          </Button>
          <Button
            size="sm"
            loading={saveLoading}
            disabled={
              (editTab === 'draft' && !leadDraftDirty) ||
              (editTab === 'metadata' && !metadataDirty) ||
              editTab === 'access'
            }
            onClick={() =>
              void (editTab === 'draft' ? leadDraftPanelRef.current?.saveDraft() : handleSave())
            }
          >
            {editTab === 'draft'
              ? t('documentPage.toolbar.saveDraft')
              : t('documentPage.toolbar.save')}
          </Button>
          {editTab === 'draft' && leadDraftLastSynced && (
            <Text size="xs" c="dimmed">
              {t('documentPage.toolbar.lastSynced', {
                time: new Date(leadDraftLastSynced).toLocaleTimeString(),
              })}
            </Text>
          )}
        </>
      )}
      {canEnterEditMode && mode === 'view' && (
        <ActionIcon
          variant="filled"
          size={iconBtnSize}
          aria-label={t('documentPage.toolbar.editDocumentAria')}
          onClick={handleEditClick}
        >
          <IconPencil size={18} />
        </ActionIcon>
      )}
      {mode === 'edit' && showPublishButton && (
        <Button
          variant="filled"
          size="sm"
          color="green"
          leftSection={<IconCloudUpload size={14} />}
          loading={publishLoading}
          onClick={() => void handlePublish()}
        >
          {data.publishedAt
            ? t('documentPage.toolbar.publishChanges')
            : t('documentPage.toolbar.publish')}
        </Button>
      )}
      {mode === 'edit' &&
        data.canPublish &&
        !showPublishButton &&
        leadDraftPendingSuggestions > 0 && (
          <Text size="xs" c="dimmed">
            {t('documentPage.toolbar.resolvePendingSuggestions', {
              count: leadDraftPendingSuggestions,
            })}
          </Text>
        )}
      <Menu shadow="md" position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="default"
            size={iconBtnSize}
            aria-label={t('documentPage.toolbar.moreActionsAria')}
          >
            <IconDotsVertical size={18} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            component={Link}
            to={`/documents/${documentId}/versions`}
            leftSection={<IconHistory size={14} />}
          >
            {t('documentPage.menu.history')}
          </Menu.Item>
          <Menu.Item
            leftSection={<IconDownload size={14} />}
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
              leftSection={<IconDownload size={14} />}
            >
              {t('documentPage.menu.downloadPdf')}
            </Menu.Item>
          )}
          {hasNoContext && data.canWrite && (
            <Menu.Item leftSection={<IconTarget size={14} />} onClick={openAssignContext}>
              {t('documentPage.menu.assignContext')}
            </Menu.Item>
          )}
          {!hasNoContext && (data.canMove || data.canRequestMove) && !data.pendingMoveRequest && (
            <Menu.Item leftSection={<IconArrowsExchange size={14} />} onClick={openMoveContext}>
              {t('documentPage.menu.moveContext')}
            </Menu.Item>
          )}
          {data.pendingMoveRequest?.canWithdraw && (
            <Menu.Item
              leftSection={<IconArrowsExchange size={14} />}
              disabled={moveDecisionLoading}
              onClick={() => onMoveRequestDecision('withdraw')}
            >
              {t('documentPage.menu.withdrawMoveRequest')}
            </Menu.Item>
          )}
          {data.pendingMoveRequest?.canAccept && (
            <Menu.Item
              leftSection={<IconArrowsExchange size={14} />}
              disabled={moveDecisionLoading}
              onClick={() => onMoveRequestDecision('accept')}
            >
              {t('documentPage.menu.acceptMoveRequest')}
            </Menu.Item>
          )}
          {data.pendingMoveRequest?.canReject && (
            <Menu.Item
              leftSection={<IconArrowsExchange size={14} />}
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
                leftSection={<IconFlagOff size={14} />}
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
                leftSection={<IconFlag size={14} />}
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
            <Menu.Item leftSection={<IconArchive size={14} />} onClick={() => void handleArchive()}>
              {t('documentPage.menu.archive')}
            </Menu.Item>
          )}
          {data.canWrite && data.archivedAt && (
            <Menu.Item
              leftSection={<IconArchiveOff size={14} />}
              onClick={() => void handleUnarchive()}
            >
              {t('documentPage.menu.unarchive')}
            </Menu.Item>
          )}
          {data.canDelete && <Menu.Divider />}
          {data.canDelete && (
            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={openDelete}>
              {t('documentPage.menu.moveToTrash')}
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
