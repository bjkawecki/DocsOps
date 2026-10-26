import { ActionIcon, Button, Group, Menu, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBraces, IconCloudUpload, IconDotsVertical, IconPencil } from '@tabler/icons-react';
import { DESKTOP_MIN_WIDTH } from '../../components/appShell/appShellLayoutConstants.js';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import {
  DocumentMobileOverflowMenu,
  type DocumentOverflowMenuCoreProps,
} from './DocumentMobileOverflowMenu.js';
import { useWideLayout } from '../../components/appShell/useWideLayout.js';

export type DocumentPageToolbarActionsProps = DocumentOverflowMenuCoreProps & {
  mode: 'view' | 'edit';
  editTab: 'draft' | 'metadata' | 'access';
  leadDraftPanelRef: RefObject<DocumentLeadDraftPanelHandle | null>;
  leadDraftLastSynced: string | null;
  leadDraftDirty: boolean;
  leadDraftPendingSuggestions: number;
  publishLoading: boolean;
  canEnterEditMode: boolean;
  showPublishButton: boolean;
  handleCancelEdit: () => void;
  handleEditClick: () => void;
  handlePublish: () => Promise<void>;
  /** Admin-only: open raw draft JSON (edit / draft tab). */
  isAdmin?: boolean;
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
  leadDraftPendingSuggestions,
  publishLoading,
  canEnterEditMode,
  showPublishButton,
  hasNoContext,
  pdfExportLoading,
  moveDecisionLoading,
  startHereScopes,
  startHereBusy,
  handleCancelEdit,
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
  isAdmin = false,
}: DocumentPageToolbarActionsProps) {
  const { t } = useTranslation(['documents', 'common']);
  const isDesktop = useMediaQuery(DESKTOP_MIN_WIDTH) ?? true;
  const isWide = useWideLayout();
  const iconBtnSize = isDesktop ? 36 : 44;
  const compactChrome = !isWide;

  const showCompactPublishInMenu = mode === 'edit' && showPublishButton && compactChrome;
  const showCompactPendingInMenu =
    mode === 'edit' &&
    compactChrome &&
    data.canPublish &&
    !showPublishButton &&
    leadDraftPendingSuggestions > 0;

  const leadingItems = (
    <>
      {showCompactPublishInMenu && (
        <Menu.Item
          leftSection={<IconCloudUpload size={14} />}
          disabled={publishLoading}
          onClick={() => void handlePublish()}
        >
          {data.publishedAt
            ? t('documentPage.toolbar.publishChanges')
            : t('documentPage.toolbar.publish')}
        </Menu.Item>
      )}
      {showCompactPendingInMenu && (
        <Menu.Item disabled>
          {t('documentPage.toolbar.resolvePendingSuggestions', {
            count: leadDraftPendingSuggestions,
          })}
        </Menu.Item>
      )}
      {(showCompactPublishInMenu || showCompactPendingInMenu) && <Menu.Divider />}
    </>
  );

  const trailingBeforeDelete =
    isAdmin && mode === 'edit' && editTab === 'draft' ? (
      <Menu.Item
        leftSection={<IconBraces size={14} />}
        onClick={() => leadDraftPanelRef.current?.openRawJson()}
      >
        {t('documentPage.menu.viewRawJson')}
      </Menu.Item>
    ) : null;

  return (
    <Group gap="xs" wrap="nowrap">
      {mode === 'edit' && (
        <>
          <Button
            variant="default"
            size={compactChrome ? 'compact-md' : 'sm'}
            onClick={handleCancelEdit}
          >
            {t('documentPage.toolbar.cancel')}
          </Button>
          <Button
            variant="outline"
            size={compactChrome ? 'compact-md' : 'sm'}
            disabled={!leadDraftDirty}
            onClick={() => void leadDraftPanelRef.current?.saveDraft()}
          >
            {t('documentPage.toolbar.saveDraft')}
          </Button>
          {!compactChrome && leadDraftLastSynced && (
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
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
      {mode === 'edit' && showPublishButton && !compactChrome && (
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
        !compactChrome &&
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
            iconSize={14}
            leadingItems={leadingItems}
            trailingBeforeDelete={trailingBeforeDelete}
          />
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
