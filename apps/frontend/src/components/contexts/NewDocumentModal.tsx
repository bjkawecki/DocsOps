import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { notifications } from '@mantine/notifications';
import type { NewContextScope } from './NewContextModal';
import { DocumentTypePicker } from '../documents/DocumentTypePicker.js';
import {
  BLANK_DOCUMENT_SELECTION,
  type DocumentTypeSelection,
} from '../documents/documentTypeTypes.js';

export interface NewDocumentModalProps {
  opened: boolean;
  onClose: () => void;
  scope: NewContextScope;
  onSuccess?: () => void;
  /** When true (e.g. on Personal page), allow creating a draft without context (ungrouped). */
  allowNoContext?: boolean;
}

type ProcessItem = { id: string; name: string; contextId: string };
type ProjectItem = { id: string; name: string; contextId: string };

function buildProcessParams(scope: NewContextScope): string {
  const base = 'limit=100&offset=0';
  if (scope.type === 'personal') return `${base}&ownerUserId=me`;
  if (scope.type === 'company') return `${base}&companyId=${scope.companyId}`;
  if (scope.type === 'department') return `${base}&departmentId=${scope.departmentId}`;
  return `${base}&teamId=${scope.teamId}`;
}

function buildProjectParams(scope: NewContextScope): string {
  const base = 'limit=100&offset=0';
  if (scope.type === 'personal') return `${base}&ownerUserId=me`;
  if (scope.type === 'company') return `${base}&companyId=${scope.companyId}`;
  if (scope.type === 'department') return `${base}&departmentId=${scope.departmentId}`;
  return `${base}&teamId=${scope.teamId}`;
}

type DraftMode = 'in_context' | 'no_context';

export function NewDocumentModal({
  opened,
  onClose,
  scope,
  onSuccess,
  allowNoContext = false,
}: NewDocumentModalProps) {
  const { t } = useTranslation(['contexts', 'common']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<DraftMode>('in_context');
  const [contextId, setContextId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [typeSelection, setTypeSelection] =
    useState<DocumentTypeSelection>(BLANK_DOCUMENT_SELECTION);
  const [loading, setLoading] = useState(false);

  const processParams = buildProcessParams(scope);
  const projectParams = buildProjectParams(scope);

  const { data: processesData } = useQuery({
    queryKey: ['processes', 'for-document', processParams],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/processes?${processParams}`);
      if (!res.ok) throw new Error('Failed to load processes');
      const data = (await res.json()) as { items: ProcessItem[] };
      return data.items;
    },
    enabled: opened,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'for-document', projectParams],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/projects?${projectParams}`);
      if (!res.ok) throw new Error('Failed to load projects');
      const data = (await res.json()) as { items: ProjectItem[] };
      return data.items;
    },
    enabled: opened,
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags', contextId],
    queryFn: async () => {
      const res = await apiFetch(`/api/v1/tags?contextId=${contextId}`);
      if (!res.ok) throw new Error('Failed to load tags');
      return res.json() as Promise<{ id: string; name: string }[]>;
    },
    enabled: opened && !!contextId,
  });

  const processes = processesData ?? [];
  const projects = projectsData ?? [];
  const tags = tagsData ?? [];
  const contextOptions = [
    ...processes.map((p) => ({
      value: p.contextId,
      label: t('modals.newDocument.processOptionLabel', { name: p.name }),
    })),
    ...projects.map((p) => ({
      value: p.contextId,
      label: t('modals.newDocument.projectOptionLabel', { name: p.name }),
    })),
  ];
  const tagOptions = tags.map((t) => ({ value: t.id, label: t.name }));

  const reset = () => {
    setMode('in_context');
    setContextId(null);
    setTitle('');
    setTagIds([]);
    setTypeSelection(BLANK_DOCUMENT_SELECTION);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const noContext = allowNoContext && mode === 'no_context';
  const canSubmit = noContext
    ? title.trim().length > 0
    : contextId != null && title.trim().length > 0;

  const handleTypeChange = (next: DocumentTypeSelection) => {
    setTypeSelection(next);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!noContext && !contextId) return;
    setLoading(true);
    try {
      const typePayload =
        typeSelection.templateId != null
          ? { templateId: typeSelection.templateId, typeId: typeSelection.typeId ?? undefined }
          : typeSelection.typeId != null
            ? { typeId: typeSelection.typeId }
            : {};
      const body = noContext
        ? { title: title.trim(), ...typePayload }
        : { title: title.trim(), contextId: contextId!, tagIds, ...typePayload };
      const res = await apiFetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 201) {
        const doc = (await res.json()) as { id: string };
        if (contextId) {
          void queryClient.invalidateQueries({ queryKey: ['contexts', contextId, 'documents'] });
        }
        void queryClient.invalidateQueries({ queryKey: ['catalog-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'personal-documents'] });
        void queryClient.invalidateQueries({ queryKey: ['me', 'drafts'] });
        onSuccess?.();
        handleClose();
        notifications.show({
          title: t('toasts.draftCreatedTitle'),
          message: t('toasts.draftCreatedMessage'),
          color: 'green',
        });
        void navigate(`/documents/${doc.id}?mode=edit&tab=draft`);
      } else {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        notifications.show({
          title: t('toasts.errorTitle'),
          message: errBody?.error ?? res.statusText,
          color: 'red',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={t('modals.newDocument.title')} size="lg">
      <Stack gap="md">
        {allowNoContext && (
          <Radio.Group
            label={t('modals.newDocument.createDraftLabel')}
            value={mode}
            onChange={(v) => setMode(v as DraftMode)}
            description={t('modals.newDocument.createDraftDescription')}
          >
            <Stack gap="xs" mt="xs">
              <Radio value="in_context" label={t('modals.newDocument.inContextOption')} />
              <Radio value="no_context" label={t('modals.newDocument.noContextOption')} />
            </Stack>
          </Radio.Group>
        )}
        {!noContext && (
          <>
            <Select
              label={t('modals.newDocument.contextLabel')}
              placeholder={t('modals.newDocument.contextPlaceholder')}
              data={contextOptions}
              value={contextId}
              onChange={(v) => setContextId(v)}
              required
            />
            {contextOptions.length === 0 && (
              <Text size="sm" c="dimmed">
                {t('modals.newDocument.noContextsHint')}
              </Text>
            )}
          </>
        )}
        <TextInput
          label={t('modals.newDocument.titleLabel')}
          placeholder={t('modals.newDocument.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
        />
        <DocumentTypePicker
          contextId={noContext ? null : contextId}
          value={typeSelection}
          onChange={handleTypeChange}
          applyTemplateOnSelect
          mode="create"
        />
        {!noContext && (
          <MultiSelect
            label={t('modals.newDocument.tagsLabel')}
            data={tagOptions}
            value={tagIds}
            onChange={setTagIds}
            placeholder={t('modals.newDocument.tagsPlaceholder')}
            searchable
            clearable
          />
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button disabled={!canSubmit} loading={loading} onClick={() => void handleSubmit()}>
            {t('common:actions.create')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
