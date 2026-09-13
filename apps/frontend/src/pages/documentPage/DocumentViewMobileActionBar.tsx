import { Menu } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconArchive,
  IconArchiveOff,
  IconArrowsExchange,
  IconDotsVertical,
  IconDownload,
  IconFlag,
  IconFlagOff,
  IconHistory,
  IconPencil,
  IconTarget,
  IconTrash,
} from '@tabler/icons-react';
import {
  PageMobileActionBar,
  type PageMobileAction,
} from '../../components/ui/PageMobileActionBar.js';
import { buildPageMobileNavAction } from '../../components/ui/pageMobileNav.js';
import type { DocumentResponse, PdfExportJobStatusResponse } from './documentPageTypes';

export type DocumentViewMobileActionBarProps = {
  documentId: string;
  data: DocumentResponse;
  navTitle: string;
  onOpenNav: () => void;
  canEnterEditMode: boolean;
  hasNoContext: boolean;
  pdfExportLoading: boolean;
  pdfExportStatus: PdfExportJobStatusResponse | undefined;
  moveDecisionLoading: boolean;
  startHereScopes: NonNullable<DocumentResponse['startHereScopes']>;
  startHereBusy: boolean;
  handleEditClick: () => void;
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

/** Compact view-mode chrome: content nav, edit, and overflow menu via PageMobileActionBar. */
export function DocumentViewMobileActionBar({
  documentId,
  data,
  navTitle,
  onOpenNav,
  canEnterEditMode,
  hasNoContext,
  pdfExportLoading,
  pdfExportStatus,
  moveDecisionLoading,
  startHereScopes,
  startHereBusy,
  handleEditClick,
  handleStartPdfExport,
  handleArchive,
  handleUnarchive,
  openAssignContext,
  openMoveContext,
  onMoveRequestDecision,
  openDelete,
  onSetStartHere,
  onClearStartHere,
}: DocumentViewMobileActionBarProps) {
  const { t } = useTranslation(['documents', 'shell']);

  const moreMenu = (
    <>
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
        {pdfExportLoading ? t('documentPage.menu.exportingPdf') : t('documentPage.menu.exportPdf')}
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
            onClick={() => onClearStartHere({ scopeType: scope.scopeType, scopeId: scope.scopeId })}
          >
            {t('documentPage.menu.removeStartHere', { scope: scope.scopeName })}
          </Menu.Item>
        ) : (
          <Menu.Item
            key={`${scope.scopeType}:${scope.scopeId}`}
            leftSection={<IconFlag size={12} />}
            disabled={startHereBusy}
            onClick={() => onSetStartHere({ scopeType: scope.scopeType, scopeId: scope.scopeId })}
          >
            {t('documentPage.menu.setStartHere', { scope: scope.scopeName })}
          </Menu.Item>
        )
      )}
      {data.canWrite && !data.archivedAt && (
        <Menu.Item leftSection={<IconArchive size={12} />} onClick={() => void handleArchive()}>
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
    </>
  );

  const actions: PageMobileAction[] = [
    buildPageMobileNavAction(
      navTitle,
      onOpenNav,
      t('shell:nav.contentNavOpenAria', { title: navTitle })
    ),
  ];
  if (canEnterEditMode) {
    actions.push({
      key: 'edit',
      label: t('documentPage.toolbar.editDocumentAria'),
      icon: <IconPencil size={16} stroke={1.5} />,
      tone: 'edit',
      onClick: handleEditClick,
    });
  }
  actions.push({
    key: 'more',
    label: t('documentPage.toolbar.moreActionsAria'),
    icon: <IconDotsVertical size={16} />,
    tone: 'more',
    menu: moreMenu,
  });

  return <PageMobileActionBar ariaLabel={t('shell:nav.pageMobileActionsAria')} actions={actions} />;
}
