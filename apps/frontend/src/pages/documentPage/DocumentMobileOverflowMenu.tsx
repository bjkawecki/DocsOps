import type { ReactNode } from 'react';
import { Menu } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  IconArchive,
  IconArchiveOff,
  IconArrowsExchange,
  IconFlag,
  IconFlagOff,
  IconHistory,
  IconTarget,
  IconTrash,
} from '@tabler/icons-react';
import type { DocumentResponse } from './documentPageTypes';
import { DocumentPdfMenuItems } from './DocumentPdfMenuItems.js';

export type DocumentStartHereScope = {
  scopeType: 'team' | 'department' | 'company';
  scopeId: string;
};

export type DocumentOverflowMenuCoreProps = {
  documentId: string;
  data: DocumentResponse;
  hasNoContext: boolean;
  pdfExportLoading: boolean;
  moveDecisionLoading: boolean;
  startHereScopes: NonNullable<DocumentResponse['startHereScopes']>;
  startHereBusy: boolean;
  handleStartPdfExport: () => Promise<void>;
  handleArchive: () => Promise<void>;
  handleUnarchive: () => Promise<void>;
  openAssignContext: () => void;
  openMoveContext: () => void;
  onMoveRequestDecision: (action: 'accept' | 'reject' | 'withdraw') => void;
  openDelete: () => void;
  onSetStartHere: (scope: DocumentStartHereScope) => void;
  onClearStartHere: (scope: DocumentStartHereScope) => void;
};

export type DocumentMobileOverflowMenuProps = DocumentOverflowMenuCoreProps & {
  iconSize?: number;
  /** Edit-only items before History (e.g. publish). */
  leadingItems?: ReactNode;
  /** Items after archive/unarchive, before trash (e.g. raw JSON). */
  trailingBeforeDelete?: ReactNode;
};

/**
 * Shared overflow menu for document mobile action bars (view + edit).
 */
export function DocumentMobileOverflowMenu({
  documentId,
  data,
  hasNoContext,
  pdfExportLoading,
  moveDecisionLoading,
  startHereScopes,
  startHereBusy,
  handleStartPdfExport,
  handleArchive,
  handleUnarchive,
  openAssignContext,
  openMoveContext,
  onMoveRequestDecision,
  openDelete,
  onSetStartHere,
  onClearStartHere,
  iconSize = 12,
  leadingItems,
  trailingBeforeDelete,
}: DocumentMobileOverflowMenuProps) {
  const { t } = useTranslation('documents');

  return (
    <>
      {leadingItems}
      <Menu.Item
        component={Link}
        to={`/documents/${documentId}/versions`}
        leftSection={<IconHistory size={iconSize} />}
      >
        {t('documentPage.menu.history')}
      </Menu.Item>
      <DocumentPdfMenuItems
        documentId={documentId}
        data={data}
        pdfExportLoading={pdfExportLoading}
        iconSize={iconSize}
        handleStartPdfExport={handleStartPdfExport}
      />
      {hasNoContext && data.canWrite && (
        <Menu.Item leftSection={<IconTarget size={iconSize} />} onClick={openAssignContext}>
          {t('documentPage.menu.assignContext')}
        </Menu.Item>
      )}
      {!hasNoContext && (data.canMove || data.canRequestMove) && !data.pendingMoveRequest && (
        <Menu.Item leftSection={<IconArrowsExchange size={iconSize} />} onClick={openMoveContext}>
          {t('documentPage.menu.moveContext')}
        </Menu.Item>
      )}
      {data.pendingMoveRequest?.canWithdraw && (
        <Menu.Item
          leftSection={<IconArrowsExchange size={iconSize} />}
          disabled={moveDecisionLoading}
          onClick={() => onMoveRequestDecision('withdraw')}
        >
          {t('documentPage.menu.withdrawMoveRequest')}
        </Menu.Item>
      )}
      {data.pendingMoveRequest?.canAccept && (
        <Menu.Item
          leftSection={<IconArrowsExchange size={iconSize} />}
          disabled={moveDecisionLoading}
          onClick={() => onMoveRequestDecision('accept')}
        >
          {t('documentPage.menu.acceptMoveRequest')}
        </Menu.Item>
      )}
      {data.pendingMoveRequest?.canReject && (
        <Menu.Item
          leftSection={<IconArrowsExchange size={iconSize} />}
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
            leftSection={<IconFlagOff size={iconSize} />}
            disabled={startHereBusy}
            onClick={() => onClearStartHere({ scopeType: scope.scopeType, scopeId: scope.scopeId })}
          >
            {t('documentPage.menu.removeStartHere', { scope: scope.scopeName })}
          </Menu.Item>
        ) : (
          <Menu.Item
            key={`${scope.scopeType}:${scope.scopeId}`}
            leftSection={<IconFlag size={iconSize} />}
            disabled={startHereBusy}
            onClick={() => onSetStartHere({ scopeType: scope.scopeType, scopeId: scope.scopeId })}
          >
            {t('documentPage.menu.setStartHere', { scope: scope.scopeName })}
          </Menu.Item>
        )
      )}
      {data.canWrite && !data.archivedAt && (
        <Menu.Item
          leftSection={<IconArchive size={iconSize} />}
          onClick={() => void handleArchive()}
        >
          {t('documentPage.menu.archive')}
        </Menu.Item>
      )}
      {data.canWrite && data.archivedAt && (
        <Menu.Item
          leftSection={<IconArchiveOff size={iconSize} />}
          onClick={() => void handleUnarchive()}
        >
          {t('documentPage.menu.unarchive')}
        </Menu.Item>
      )}
      {trailingBeforeDelete}
      {data.canDelete && <Menu.Divider />}
      {data.canDelete && (
        <Menu.Item color="red" leftSection={<IconTrash size={iconSize} />} onClick={openDelete}>
          {t('documentPage.menu.moveToTrash')}
        </Menu.Item>
      )}
    </>
  );
}
