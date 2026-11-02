import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import type { OwnerResponse } from '../../pages/contextWorkspace/contextWorkspaceTypes.js';
import { ContextScopeAuthorsSection } from './ContextScopeAuthorsSection.js';

const NAME_MAX_LENGTH = 255;

export interface EditContextNameModalProps {
  opened: boolean;
  onClose: () => void;
  type: 'process' | 'project' | 'subcontext';
  /** Process, project, or subcontext entity ID (for PATCH). */
  contextId: string;
  currentName: string;
  owner?: OwnerResponse | null;
  canManageAuthors?: boolean;
  onSuccess?: () => void;
}

/**
 * Edit context name and (for org-owned contexts) manage scope authors of the owner unit.
 */
export function EditContextNameModal({
  opened,
  onClose,
  type,
  contextId,
  currentName,
  owner = null,
  canManageAuthors = false,
  onSuccess,
}: EditContextNameModalProps) {
  const { t } = useTranslation(['contexts', 'common']);
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) setName(currentName);
  }, [opened, currentName]);

  const canSubmit = name.trim().length > 0 && name.length <= NAME_MAX_LENGTH;
  const showAuthors = owner != null && owner.ownerUserId == null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const endpoint =
      type === 'process'
        ? '/api/v1/processes'
        : type === 'project'
          ? '/api/v1/projects'
          : '/api/v1/subcontexts';
    try {
      const res = await apiFetch(`${endpoint}/${contextId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        onSuccess?.();
        onClose();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        notifications.show({
          title: t('toasts.errorTitle'),
          message: data?.error ?? res.statusText,
          color: 'red',
        });
      }
    } catch (e) {
      notifications.show({
        title: t('toasts.errorTitle'),
        message: e instanceof Error ? e.message : 'Network error',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('modals.editContext.title')} size="md">
      <Stack gap="md">
        <TextInput
          label={t('modals.editContext.nameLabel')}
          placeholder={t('modals.editContext.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          maxLength={NAME_MAX_LENGTH}
          required
        />
        {showAuthors && owner != null ? (
          <ContextScopeAuthorsSection owner={owner} canManageAuthors={canManageAuthors} />
        ) : null}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            disabled={!canSubmit}
            loading={loading}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {t('common:actions.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
