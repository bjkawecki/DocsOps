import {
  Alert,
  Box,
  Button,
  Group,
  MultiSelect,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentAccessPanel } from '../../components/documents/DocumentAccessPanel';
import { DocumentLeadDraftPanel } from '../../components/documents/DocumentLeadDraftPanel';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import { DocumentTypeMetadataSection } from './DocumentTypeMetadataSection.js';
import type { DocumentResponse } from './documentPageTypes';

export type DocumentPageEditPanelsProps = {
  documentId: string;
  data: DocumentResponse;
  editTab: 'draft' | 'metadata' | 'access';
  setEditTab: (v: 'draft' | 'metadata' | 'access') => void;
  canManageAccess: boolean;
  hasDraftBlocks: boolean;
  hasPublishedBlocks: boolean;
  leadDraftPanelRef: RefObject<DocumentLeadDraftPanelHandle | null>;
  leadDraftLastSynced: string | null;
  isTabVisible: boolean;
  publishedVersionIsStale: boolean;
  latestPublishedVersion: number;
  ackPublishedVersion: number | null;
  onReloadPublishedContent: () => void;
  me: { user?: { id?: string; name?: string; isAdmin?: boolean } } | undefined;
  setLeadDraftDirty: (dirty: boolean) => void;
  setLeadDraftLastSynced: (iso: string | null) => void;
  setLeadDraftPendingSuggestions: (count: number) => void;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editDescription: string;
  setEditDescription: (v: string) => void;
  editTypeId: string | null;
  setEditTypeId: (v: string | null) => void;
  tagOptions: { value: string; label: string }[];
  editTagIds: string[];
  setEditTagIds: (v: string[]) => void;
  openCreateTag: () => void;
  openManageTags: () => void;
};

/** Edit-mode tab body: lead draft editor, metadata form, and access panel. */
export function DocumentPageEditPanels({
  documentId,
  data,
  editTab,
  setEditTab,
  canManageAccess,
  hasDraftBlocks,
  hasPublishedBlocks,
  leadDraftPanelRef,
  leadDraftLastSynced,
  isTabVisible,
  publishedVersionIsStale,
  latestPublishedVersion,
  ackPublishedVersion,
  onReloadPublishedContent,
  me,
  setLeadDraftDirty,
  setLeadDraftLastSynced,
  setLeadDraftPendingSuggestions,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editTypeId,
  setEditTypeId,
  tagOptions,
  editTagIds,
  setEditTagIds,
  openCreateTag,
  openManageTags,
}: DocumentPageEditPanelsProps) {
  const { t } = useTranslation(['documents', 'common']);

  return (
    <Tabs
      className="document-page-edit-tabs"
      value={editTab}
      onChange={(v) => setEditTab((v as typeof editTab) ?? 'draft')}
    >
      <Box className="document-page-edit-sticky-stack">
        <Tabs.List>
          <Tabs.Tab value="draft">{t('documentPage.tabs.draft')}</Tabs.Tab>
          <Tabs.Tab value="metadata">{t('documentPage.tabs.metadata')}</Tabs.Tab>
          {canManageAccess && <Tabs.Tab value="access">{t('documentPage.tabs.access')}</Tabs.Tab>}
        </Tabs.List>
        <Box className="document-page-edit-sticky-chrome-host" data-document-edit-sticky-chrome />
      </Box>
      <Tabs.Panel value="draft" className="document-page-edit-fill">
        {!hasDraftBlocks && !hasPublishedBlocks && leadDraftLastSynced != null && (
          <Alert
            color="yellow"
            mb="md"
            title={t('documentPage.emptyDraftAlertTitle')}
            style={{ flexShrink: 0 }}
          >
            <Text size="sm">{t('documentPage.emptyDraftAlertBody')}</Text>
          </Alert>
        )}
        <DocumentLeadDraftPanel
          ref={leadDraftPanelRef}
          documentId={documentId}
          refetchWhenVisible={isTabVisible}
          canPublish={!!data.canPublish}
          publishedVersionIsStale={publishedVersionIsStale}
          currentPublishedVersionNumber={latestPublishedVersion}
          ackPublishedVersion={ackPublishedVersion}
          onReloadPublishedContent={onReloadPublishedContent}
          currentUserId={me?.user?.id}
          currentUserName={me?.user?.name}
          isAdmin={me?.user?.isAdmin === true}
          fallbackBlocks={data.publishedBlocks ?? null}
          onDirtyChange={setLeadDraftDirty}
          onLastSyncedChange={setLeadDraftLastSynced}
          onPendingSuggestionCountChange={setLeadDraftPendingSuggestions}
        />
      </Tabs.Panel>
      <Tabs.Panel value="metadata" pt="md" className="document-page-edit-panel-scroll">
        <Stack gap="md">
          <TextInput
            label={t('documentPage.metadataFields.title')}
            value={editTitle}
            onChange={(e) => setEditTitle(e.currentTarget.value)}
            maxLength={500}
          />
          <TextInput
            label={t('documentPage.metadataFields.description')}
            placeholder={t('documentPage.metadataFields.descriptionPlaceholder')}
            value={editDescription}
            onChange={(e) => setEditDescription(e.currentTarget.value)}
            maxLength={500}
          />
          {data.canWrite ? (
            <DocumentTypeMetadataSection
              contextId={data.contextId}
              typeId={editTypeId}
              onTypeIdChange={setEditTypeId}
            />
          ) : null}
          <Group align="flex-end" gap="xs">
            <MultiSelect
              label={t('documentPage.metadataFields.tags')}
              placeholder={t('documentPage.metadataFields.tagsPlaceholder')}
              data={tagOptions}
              value={editTagIds}
              onChange={setEditTagIds}
              searchable
              clearable
              style={{ flex: 1 }}
            />
            <Button variant="filled" size="sm" onClick={openCreateTag}>
              {t('documentPage.metadataFields.createTag')}
            </Button>
            <Button variant="subtle" size="sm" onClick={openManageTags}>
              {t('documentPage.metadataFields.manageTags')}
            </Button>
          </Group>
        </Stack>
      </Tabs.Panel>
      {canManageAccess && (
        <Tabs.Panel value="access" pt="md" className="document-page-edit-panel-scroll">
          <DocumentAccessPanel
            documentId={documentId}
            canEditAccess={canManageAccess}
            documentScope={
              data.scope?.type === 'team' ||
              data.scope?.type === 'department' ||
              data.scope?.type === 'company'
                ? { type: data.scope.type, id: data.scope.id }
                : data.scope?.type === 'personal'
                  ? { type: 'personal' }
                  : null
            }
          />
        </Tabs.Panel>
      )}
    </Tabs>
  );
}
