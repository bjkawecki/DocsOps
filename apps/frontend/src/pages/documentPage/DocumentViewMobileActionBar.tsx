import { useTranslation } from 'react-i18next';
import { IconDotsVertical, IconPencil } from '@tabler/icons-react';
import {
  PageMobileActionBar,
  type PageMobileAction,
} from '../../components/ui/PageMobileActionBar.js';
import { buildPageMobileNavAction } from '../../components/ui/pageMobileNav.js';
import {
  DocumentMobileOverflowMenu,
  type DocumentOverflowMenuCoreProps,
} from './DocumentMobileOverflowMenu.js';

export type DocumentViewMobileActionBarProps = DocumentOverflowMenuCoreProps & {
  navTitle: string;
  onOpenNav: () => void;
  canEnterEditMode: boolean;
  handleEditClick: () => void;
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
    />
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
