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
  Title,
} from '@mantine/core';
import { useState, type KeyboardEvent, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentAccessPanel } from '../../components/documents/DocumentAccessPanel';
import { DocumentLeadDraftPanel } from '../../components/documents/DocumentLeadDraftPanel';
import type { DocumentLeadDraftPanelHandle } from '../../components/documents/DocumentLeadDraftPanel';
import { DraftEditingHelpPopover } from '../../components/documents/documentLeadDraft/DraftEditingHelpPopover.js';
import '../../components/ui/TagBadge.css';
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
  leadDraftDirty: boolean;
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
  openManageTags: () => void;
  onCreateTag: (name: string) => Promise<string | null>;
  createTagLoading: boolean;
  metadataDirty: boolean;
  saveLoading: boolean;
  onSaveMetadata: () => Promise<void>;
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
  leadDraftDirty,
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
  openManageTags,
  onCreateTag,
  createTagLoading,
  metadataDirty,
  saveLoading,
  onSaveMetadata,
}: DocumentPageEditPanelsProps) {
  const { t } = useTranslation(['documents', 'common']);
  const [tagSearch, setTagSearch] = useState('');
  const draftEditorMode =
    data.canPublish || data.contextId === null ? ('lead' as const) : ('author' as const);
  const canEditDraftHelp = !!data.canPublish || data.contextId === null || !!data.canWrite;

  const handleTagSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    const name = tagSearch.trim();
    if (!name) return;
    event.preventDefault();
    event.stopPropagation();
    const existing = tagOptions.find((opt) => opt.label.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!editTagIds.includes(existing.value)) {
        setEditTagIds([...editTagIds, existing.value]);
      }
      setTagSearch('');
      return;
    }
    void onCreateTag(name).then((id) => {
      if (id) setTagSearch('');
    });
  };

  return (
    <Tabs
      className="document-page-edit-tabs"
      value={editTab}
      onChange={(v) => setEditTab((v as typeof editTab) ?? 'draft')}
    >
      <Box className="document-page-edit-sticky-stack">
        <Box className="document-page-edit-tabs-row">
          <Tabs.List className="document-page-edit-tabs-list">
            <Tabs.Tab value="draft">{t('documentPage.tabs.draft')}</Tabs.Tab>
            <Tabs.Tab value="metadata">{t('documentPage.tabs.metadata')}</Tabs.Tab>
            {canManageAccess && <Tabs.Tab value="access">{t('documentPage.tabs.access')}</Tabs.Tab>}
          </Tabs.List>
          <Group gap="sm" wrap="nowrap" align="center" className="document-page-edit-tabs-status">
            {editTab === 'draft' && leadDraftDirty ? (
              <Text size="xs" c="dimmed" component="span">
                {t('leadDraft.unsavedChanges')}
              </Text>
            ) : null}
            {editTab === 'draft' ? (
              <DraftEditingHelpPopover editorMode={draftEditorMode} canEdit={canEditDraftHelp} />
            ) : null}
          </Group>
        </Box>
        {editTab === 'draft' ? (
          <Title order={2} className="document-page-edit-title">
            {editTitle.trim() || t('common:status.untitled')}
          </Title>
        ) : null}
        {/* Host stays mounted so the toolbar portal keeps its target across tabs. */}
        <Box
          className="document-page-edit-sticky-chrome-host"
          data-document-edit-sticky-chrome
          hidden={editTab !== 'draft'}
        />
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
          contextId={data.contextId}
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
      <Tabs.Panel value="metadata" className="document-page-edit-panel-scroll">
        <Box className="document-page-edit-form-shell">
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
                className="app-tag-multiselect"
                classNames={{ pill: 'app-tag-pill' }}
                label={t('documentPage.metadataFields.tags')}
                placeholder={t('documentPage.metadataFields.tagsPlaceholder')}
                data={tagOptions}
                value={editTagIds}
                onChange={setEditTagIds}
                searchable
                searchValue={tagSearch}
                onSearchChange={setTagSearch}
                onKeyDown={handleTagSearchKeyDown}
                clearable
                disabled={createTagLoading}
                style={{ flex: 1 }}
              />
              <Button variant="subtle" size="sm" onClick={openManageTags}>
                {t('documentPage.metadataFields.manageTags')}
              </Button>
            </Group>
            <Group justify="flex-end">
              <Button
                variant="outline"
                loading={saveLoading}
                disabled={!metadataDirty}
                onClick={() => void onSaveMetadata()}
              >
                {t('documentPage.metadataFields.save')}
              </Button>
            </Group>
          </Stack>
        </Box>
      </Tabs.Panel>
      {canManageAccess && (
        <Tabs.Panel value="access" className="document-page-edit-panel-scroll">
          <Box className="document-page-edit-form-shell">
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
          </Box>
        </Tabs.Panel>
      )}
    </Tabs>
  );
}
