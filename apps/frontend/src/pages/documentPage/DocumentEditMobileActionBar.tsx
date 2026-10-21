import { Menu } from '@mantine/core';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconBraces,
  IconCloudUpload,
  IconDeviceFloppy,
  IconDotsVertical,
  IconX,
} from '@tabler/icons-react';
import {
  PageMobileActionBar,
  type PageMobileAction,
} from '../../components/ui/PageMobileActionBar.js';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import type { DocumentResponse } from './documentPageTypes';
import { DocumentMobileOverflowMenu } from './DocumentMobileOverflowMenu.js';

export type DocumentEditMobileActionBarProps = {
  documentId: string;
  data: DocumentResponse;
  editTab: 'draft' | 'metadata' | 'access';
  leadDraftPanelRef: RefObject<DocumentLeadDraftPanelHandle | null>;
  leadDraftDirty: boolean;
  leadDraftPendingSuggestions: number;
  publishLoading: boolean;
  showPublishButton: boolean;
  hasNoContext: boolean;
  pdfExportLoading: boolean;
  moveDecisionLoading: boolean;
  startHereScopes: NonNullable<DocumentResponse['startHereScopes']>;
  startHereBusy: boolean;
  handleCancelEdit: () => void;
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
  isAdmin?: boolean;
};

/**
 * Compact edit focus chrome via shared PageMobileActionBar.
 */
export function DocumentEditMobileActionBar({
  documentId,
  data,
  editTab,
  leadDraftPanelRef,
  leadDraftDirty,
  leadDraftPendingSuggestions,
  publishLoading,
  showPublishButton,
  hasNoContext,
  pdfExportLoading,
  moveDecisionLoading,
  startHereScopes,
  startHereBusy,
  handleCancelEdit,
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
  isAdmin = false,
}: DocumentEditMobileActionBarProps) {
  const { t } = useTranslation(['documents', 'common', 'shell']);

  const leadingItems = (
    <>
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
    </>
  );

  const trailingBeforeDelete =
    isAdmin && editTab === 'draft' ? (
      <Menu.Item
        leftSection={<IconBraces size={12} />}
        onClick={() => leadDraftPanelRef.current?.openRawJson()}
      >
        {t('documentPage.menu.viewRawJson')}
      </Menu.Item>
    ) : null;

  const moreMenu = (
    <DocumentMobileOverflowMenu
      documentId={documentId}
      data={data}
      hasNoContext={hasNoContext}
      pdfExportLoading={pdfExportLoading}
      moveDecisionLoading={moveDecisionLoading}
      startHereScopes={startHereScopes}
      startHereBusy={startHereBusy}
      handleStartPdfExport={handleStartPdfExport}
      handleArchive={handleArchive}
      handleUnarchive={handleUnarchive}
      openAssignContext={openAssignContext}
      openMoveContext={openMoveContext}
      onMoveRequestDecision={onMoveRequestDecision}
      openDelete={openDelete}
      onSetStartHere={onSetStartHere}
      onClearStartHere={onClearStartHere}
      leadingItems={leadingItems}
      trailingBeforeDelete={trailingBeforeDelete}
    />
  );

  const actions: PageMobileAction[] = [
    {
      key: 'cancel',
      label: t('documentPage.toolbar.cancel'),
      icon: <IconX size={16} stroke={1.5} />,
      tone: 'danger',
      onClick: handleCancelEdit,
    },
    {
      key: 'save',
      label: t('documentPage.toolbar.saveDraft'),
      icon: <IconDeviceFloppy size={16} stroke={1.5} />,
      tone: 'save',
      disabled: !leadDraftDirty,
      onClick: () => void leadDraftPanelRef.current?.saveDraft(),
    },
    {
      key: 'more',
      label: t('documentPage.toolbar.moreActionsAria'),
      icon: <IconDotsVertical size={16} />,
      tone: 'more',
      menu: moreMenu,
    },
  ];

  return (
    <PageMobileActionBar ariaLabel={t('documentPage.toolbar.editDocumentAria')} actions={actions} />
  );
}
