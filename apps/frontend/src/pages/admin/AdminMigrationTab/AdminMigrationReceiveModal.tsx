import { useEffect, useState } from 'react';
import { Alert, Button, Code, CopyButton, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../api/client';
import { readApiErrorMessage } from '../../../api/readApiErrorMessage';
import { usePublicConfig } from '../../../hooks/usePublicConfig.js';
import type { PlatformImportRun } from './adminMigrationTypes';

type ReceiveSlotCreated = {
  id: string;
  token: string;
  path: string;
  expiresAt: string;
  open: boolean;
  platformImportRunId: string | null;
  createdAt: string;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  onContinueImport: (platformImportRunId: string) => void;
};

export function AdminMigrationReceiveModal({ opened, onClose, onContinueImport }: Props) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const { data: publicConfig } = usePublicConfig();
  const demoDisabled = publicConfig?.demoMode === true;
  const [created, setCreated] = useState<ReceiveSlotCreated | null>(null);
  const [receivedImportRunId, setReceivedImportRunId] = useState<string | null>(null);

  const receiveUrl = created != null ? `${window.location.origin}${created.path}` : null;

  const importsQuery = useQuery({
    queryKey: ['admin', 'platform-imports', 'push-poll', created?.id],
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/platform-imports?limit=10');
      if (!res.ok) throw new Error('Failed to load imports');
      return res.json() as Promise<{ items: PlatformImportRun[] }>;
    },
    enabled: opened && created != null && receivedImportRunId == null,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!opened) {
      setCreated(null);
      setReceivedImportRunId(null);
    }
  }, [opened]);

  useEffect(() => {
    if (!created || receivedImportRunId) return;
    const createdAtMs = new Date(created.createdAt).getTime();
    const match = importsQuery.data?.items.find(
      (item) =>
        item.source === 'push' &&
        new Date(item.createdAt).getTime() >= createdAtMs - 1000 &&
        (item.status === 'awaiting_confirm' || item.status === 'preflight_failed')
    );
    if (!match) return;
    setReceivedImportRunId(match.id);
    void queryClient.invalidateQueries({ queryKey: ['admin', 'platform-migration', 'status'] });
    notifications.show({
      color: 'green',
      message: t('migration.receiveModal.pushReceived'),
    });
  }, [created, importsQuery.data?.items, queryClient, receivedImportRunId, t]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/admin/platform-imports/receive-slots', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, t('migration.receiveModal.createFailed')));
      }
      return res.json() as Promise<ReceiveSlotCreated>;
    },
    onSuccess: (slot) => {
      setCreated(slot);
      setReceivedImportRunId(null);
    },
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/v1/admin/platform-imports/receive-slots/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(await readApiErrorMessage(res, t('migration.receiveModal.revokeFailed')));
      }
    },
    onSuccess: () => {
      setCreated(null);
      setReceivedImportRunId(null);
    },
    onError: (error: Error) => {
      notifications.show({ color: 'red', message: error.message });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title={t('migration.receiveModal.title')} size="lg">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('migration.receiveModal.description')}
        </Text>

        {demoDisabled ? <Alert color="yellow">{t('demo.limitedAdmin')}</Alert> : null}

        {created == null ? (
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={demoDisabled}
          >
            {t('migration.receiveModal.createSlot')}
          </Button>
        ) : (
          <Stack gap="sm">
            {receiveUrl && receivedImportRunId == null ? (
              <>
                <Text size="sm" fw={600}>
                  {t('migration.receiveModal.receiveUrlLabel')}
                </Text>
                <Code block>{receiveUrl}</Code>
                <Group gap="sm">
                  <CopyButton value={receiveUrl}>
                    {({ copied, copy }) => (
                      <Button variant="default" onClick={copy}>
                        {copied
                          ? t('migration.receiveModal.copied')
                          : t('migration.receiveModal.copyUrl')}
                      </Button>
                    )}
                  </CopyButton>
                  <Button
                    variant="subtle"
                    color="red"
                    loading={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(created.id)}
                  >
                    {t('migration.receiveModal.revoke')}
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">
                  {t('migration.receiveModal.expiresAt', {
                    time: new Date(created.expiresAt).toLocaleString(),
                  })}
                </Text>
                <Group gap="xs">
                  <Loader size="sm" />
                  <Text size="sm">{t('migration.receiveModal.waitingForPush')}</Text>
                </Group>
              </>
            ) : null}

            {receivedImportRunId ? (
              <Alert color="green" title={t('migration.receiveModal.pushReceivedTitle')}>
                <Stack gap="sm">
                  <Text size="sm">{t('migration.receiveModal.pushReceived')}</Text>
                  <Button
                    onClick={() => {
                      onContinueImport(receivedImportRunId);
                      onClose();
                    }}
                  >
                    {t('migration.receiveModal.continueImport')}
                  </Button>
                </Stack>
              </Alert>
            ) : null}
          </Stack>
        )}

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('migration.footer.close')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
