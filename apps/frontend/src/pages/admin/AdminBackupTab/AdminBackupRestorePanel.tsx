import { useRef, useState } from 'react';
import { Alert, Button, Group, Modal, Radio, Stack, Text, Tooltip } from '@mantine/core';
import { Trans, useTranslation } from 'react-i18next';
import { apiFetch } from '../../../api/client';
import type { BackupRun } from './adminBackupTypes';
import { formatBackupRunLabel, listRestorableBackups } from './backupRestoreHelpers';

type RestoreSource = 'history' | 'upload';

type Props = {
  backups: BackupRun[] | undefined;
  maintenanceActive: boolean;
  restoreFromBackupLoading: boolean;
  onClose: () => void;
  onRestoreFromBackup: (backupRunId: string) => void;
  onUploadComplete: (restoreRunId: string) => void;
};

export function AdminBackupRestorePanel({
  backups,
  maintenanceActive,
  restoreFromBackupLoading,
  onClose,
  onRestoreFromBackup,
  onUploadComplete,
}: Props) {
  const { t } = useTranslation(['admin', 'common']);
  const [source, setSource] = useState<RestoreSource>('history');
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const restorableBackups = listRestorableBackups(backups);
  const selectedBackup = restorableBackups.find((b) => b.id === selectedBackupId) ?? null;

  const handleSourceChange = (value: string) => {
    const next = value as RestoreSource;
    setSource(next);
    if (next === 'history') {
      setUploadOpen(false);
      setUploadError(null);
    } else {
      setSelectedBackupId(null);
      setConfirmOpen(false);
    }
  };

  const handleHistoryStart = () => {
    if (!selectedBackupId) return;
    setConfirmOpen(true);
  };

  const handleConfirmRestore = () => {
    if (!selectedBackupId) return;
    onRestoreFromBackup(selectedBackupId);
    setConfirmOpen(false);
  };

  const closeUpload = () => {
    setUploadOpen(false);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    if (!file.name.endsWith('.tar.zst')) {
      setUploadError(t('backup.restorePanel.uploadModal.invalidFile'));
      return;
    }
    setUploadLoading(true);
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      const res = await apiFetch('/api/v1/admin/restores/upload', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? t('backup.restorePanel.uploadModal.uploadFailed'));
      }
      const result = (await res.json()) as { restoreRunId: string };
      closeUpload();
      onUploadComplete(result.restoreRunId);
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : t('backup.restorePanel.uploadModal.uploadFailed')
      );
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const backupLabel = selectedBackup
    ? t('backup.restorePanel.confirmModal.specificBackup', {
        date: new Date(selectedBackup.createdAt).toLocaleString(),
      })
    : t('backup.restorePanel.confirmModal.selectedBackupFallback');

  return (
    <>
      <Stack gap="md">
        <Alert color="red" title={t('backup.restorePanel.destructiveTitle')} variant="filled">
          <Trans
            t={t}
            i18nKey="backup.restorePanel.destructiveBody"
            components={{ code: <code /> }}
          />
        </Alert>

        <Radio.Group
          label={t('backup.restorePanel.sourceLabel')}
          value={source}
          onChange={handleSourceChange}
        >
          <Group gap="lg" mt="xs" wrap="wrap">
            <Radio value="history" label={t('backup.restorePanel.sourceHistory')} />
            <Radio value="upload" label={t('backup.restorePanel.sourceUpload')} />
          </Group>
        </Radio.Group>

        {source === 'history' ? (
          restorableBackups.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('backup.restorePanel.noRestorableBackups')}
            </Text>
          ) : (
            <Radio.Group
              value={selectedBackupId}
              onChange={setSelectedBackupId}
              label={t('backup.restorePanel.selectBackupLabel')}
            >
              <Stack gap="xs" mt="xs">
                {restorableBackups.map((run) => (
                  <Radio key={run.id} value={run.id} label={formatBackupRunLabel(run)} />
                ))}
              </Stack>
            </Radio.Group>
          )
        ) : (
          <Text size="sm" c="dimmed">
            <Trans t={t} i18nKey="backup.restorePanel.uploadHint" components={{ code: <code /> }} />
          </Text>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            {t('common:actions.close')}
          </Button>
          {source === 'history' ? (
            <Tooltip
              label={maintenanceActive ? t('backup.maintenanceActiveTooltip') : undefined}
              disabled={!maintenanceActive}
            >
              <Button
                color="red"
                disabled={!selectedBackupId || maintenanceActive}
                loading={restoreFromBackupLoading}
                onClick={handleHistoryStart}
              >
                {t('backup.restorePanel.startRestore')}
              </Button>
            </Tooltip>
          ) : (
            <Tooltip
              label={maintenanceActive ? t('backup.maintenanceActiveTooltip') : undefined}
              disabled={!maintenanceActive}
            >
              <Button color="red" disabled={maintenanceActive} onClick={() => setUploadOpen(true)}>
                {t('backup.restorePanel.selectArchiveAndStart')}
              </Button>
            </Tooltip>
          )}
        </Group>
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('backup.restorePanel.confirmModal.title')}
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            <Trans
              t={t}
              i18nKey="backup.restorePanel.confirmModal.body"
              values={{ backupLabel }}
              components={{ dbEmphasis: <strong />, backupEmphasis: <strong /> }}
            />
          </Text>
          <Text size="sm" c="dimmed">
            {t('backup.restorePanel.confirmModal.writeBlockedNote')}
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setConfirmOpen(false)}
              disabled={restoreFromBackupLoading}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button color="red" loading={restoreFromBackupLoading} onClick={handleConfirmRestore}>
              {t('backup.restorePanel.startRestore')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={uploadOpen}
        onClose={closeUpload}
        title={t('backup.restorePanel.uploadModal.title')}
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            <Trans
              t={t}
              i18nKey="backup.restorePanel.uploadModal.hint"
              components={{ code: <code /> }}
            />
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept=".tar.zst,application/zstd"
            hidden
            onChange={(e) => void handleFileChange(e.target.files?.[0] ?? null)}
          />
          {uploadError ? (
            <Text size="sm" c="red">
              {uploadError}
            </Text>
          ) : null}
          <Group justify="flex-end">
            <Button variant="default" onClick={closeUpload} disabled={uploadLoading}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              color="red"
              loading={uploadLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('backup.restorePanel.uploadModal.chooseFile')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
