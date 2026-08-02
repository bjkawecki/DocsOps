import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';

const NAME_MAX_LENGTH = 255;

export interface EditContextNameModalProps {
  opened: boolean;
  onClose: () => void;
  type: 'process' | 'project';
  /** Process or project ID (for PATCH). */
  contextId: string;
  currentName: string;
  onSuccess?: () => void;
}

export function EditContextNameModal({
  opened,
  onClose,
  type,
  contextId,
  currentName,
  onSuccess,
}: EditContextNameModalProps) {
  const { t } = useTranslation(['contexts', 'common']);
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) setName(currentName);
  }, [opened, currentName]);

  const canSubmit = name.trim().length > 0 && name.length <= NAME_MAX_LENGTH;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    const endpoint = type === 'process' ? '/api/v1/processes' : '/api/v1/projects';
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
    <Modal opened={opened} onClose={onClose} title={t('modals.editName.title')} size="sm">
      <Stack gap="md">
        <TextInput
          label={t('modals.editName.nameLabel')}
          placeholder={t('modals.editName.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          maxLength={NAME_MAX_LENGTH}
          required
        />
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
