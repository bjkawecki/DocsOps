import { useEffect, useState, type SubmitEvent } from 'react';
import { Select, Stack, TextInput, Textarea } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Destination, TranslateFn } from './adminBackupTypes';
import {
  destinationFormFromDestination,
  EMPTY_DESTINATION_FORM,
  type DestinationFormState,
} from './adminBackupDestinationForm';

export const BACKUP_DESTINATION_FORM_ID = 'backup-destination-form';

type Props = {
  destination: Destination | null;
  onSave: (form: DestinationFormState, destinationId: string | null) => void;
};

function addPlaceholder(isEdit: boolean, example: string): string | undefined {
  return isEdit ? undefined : example;
}

function secretPlaceholder(isEdit: boolean, t: TranslateFn, example?: string): string | undefined {
  if (isEdit) return t('backup.destinations.form.secretPlaceholderEdit');
  return example;
}

export function AdminBackupDestinationForm({ destination, onSave }: Props) {
  const { t } = useTranslation('admin');
  const [form, setForm] = useState<DestinationFormState>(EMPTY_DESTINATION_FORM);
  const isEdit = destination != null;

  useEffect(() => {
    setForm(destination ? destinationFormFromDestination(destination) : EMPTY_DESTINATION_FORM);
  }, [destination]);

  const set = <K extends keyof DestinationFormState>(key: K, value: DestinationFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(form, destination?.id ?? null);
  };

  return (
    <form id={BACKUP_DESTINATION_FORM_ID} onSubmit={handleSubmit}>
      <Stack gap="sm">
        <TextInput
          label={t('backup.destinations.form.nameLabel')}
          required
          value={form.name}
          onChange={(e) => set('name', e.currentTarget.value)}
          placeholder={addPlaceholder(isEdit, t('backup.destinations.form.namePlaceholder'))}
        />
        <Select
          label={t('backup.destinations.form.typeLabel')}
          value={form.type}
          disabled={isEdit}
          onChange={(v) => v && set('type', v as DestinationFormState['type'])}
          data={[
            { value: 'S3_COMPATIBLE', label: t('backup.destinations.form.typeS3') },
            { value: 'SSH', label: t('backup.destinations.form.typeSsh') },
            { value: 'WEBDAV', label: t('backup.destinations.form.typeWebdav') },
          ]}
        />
        {form.type === 'S3_COMPATIBLE' ? (
          <>
            <TextInput
              label={t('backup.destinations.form.s3EndpointLabel')}
              value={form.s3Endpoint}
              onChange={(e) => set('s3Endpoint', e.currentTarget.value)}
              placeholder={addPlaceholder(
                isEdit,
                t('backup.destinations.form.s3EndpointPlaceholder')
              )}
              description={isEdit ? undefined : t('backup.destinations.form.s3EndpointDescription')}
            />
            <TextInput
              label={t('backup.destinations.form.s3BucketLabel')}
              value={form.s3Bucket}
              onChange={(e) => set('s3Bucket', e.currentTarget.value)}
              placeholder={addPlaceholder(
                isEdit,
                t('backup.destinations.form.s3BucketPlaceholder')
              )}
            />
            <TextInput
              label={t('backup.destinations.form.s3RegionLabel')}
              value={form.s3Region}
              onChange={(e) => set('s3Region', e.currentTarget.value)}
              placeholder={addPlaceholder(
                isEdit,
                t('backup.destinations.form.s3RegionPlaceholder')
              )}
              description={isEdit ? undefined : t('backup.destinations.form.s3RegionDescription')}
            />
            <TextInput
              label={t('backup.destinations.form.s3AccessKeyLabel')}
              value={form.s3AccessKey}
              onChange={(e) => set('s3AccessKey', e.currentTarget.value)}
              placeholder={secretPlaceholder(
                isEdit,
                t,
                t('backup.destinations.form.s3AccessKeyPlaceholder')
              )}
            />
            <TextInput
              label={t('backup.destinations.form.s3SecretKeyLabel')}
              type="password"
              value={form.s3SecretKey}
              onChange={(e) => set('s3SecretKey', e.currentTarget.value)}
              placeholder={secretPlaceholder(isEdit, t)}
            />
          </>
        ) : form.type === 'SSH' ? (
          <>
            <TextInput
              label={t('backup.destinations.form.sshHostLabel')}
              value={form.sshHost}
              onChange={(e) => set('sshHost', e.currentTarget.value)}
              placeholder={addPlaceholder(isEdit, t('backup.destinations.form.sshHostPlaceholder'))}
            />
            <TextInput
              label={t('backup.destinations.form.sshPortLabel')}
              value={form.sshPort}
              onChange={(e) => set('sshPort', e.currentTarget.value)}
              placeholder={addPlaceholder(isEdit, t('backup.destinations.form.sshPortPlaceholder'))}
              description={isEdit ? undefined : t('backup.destinations.form.sshPortDescription')}
            />
            <TextInput
              label={t('backup.destinations.form.sshPathLabel')}
              value={form.sshPath}
              onChange={(e) => set('sshPath', e.currentTarget.value)}
              placeholder={addPlaceholder(isEdit, t('backup.destinations.form.sshPathPlaceholder'))}
              description={isEdit ? undefined : t('backup.destinations.form.sshPathDescription')}
            />
            <TextInput
              label={t('backup.destinations.form.sshUserLabel')}
              value={form.sshUser}
              onChange={(e) => set('sshUser', e.currentTarget.value)}
              placeholder={addPlaceholder(isEdit, t('backup.destinations.form.sshUserPlaceholder'))}
            />
            <TextInput
              label={t('backup.destinations.form.sshPasswordLabel')}
              type="password"
              value={form.sshPassword}
              onChange={(e) => set('sshPassword', e.currentTarget.value)}
              placeholder={secretPlaceholder(isEdit, t)}
              description={
                isEdit ? undefined : t('backup.destinations.form.sshPasswordDescription')
              }
            />
            <Textarea
              label={t('backup.destinations.form.sshPrivateKeyLabel')}
              value={form.sshPrivateKey}
              onChange={(e) => set('sshPrivateKey', e.currentTarget.value)}
              minRows={3}
              placeholder={secretPlaceholder(
                isEdit,
                t,
                t('backup.destinations.form.sshPrivateKeyPlaceholder')
              )}
              description={
                isEdit ? undefined : t('backup.destinations.form.sshPrivateKeyDescription')
              }
            />
          </>
        ) : (
          <>
            <TextInput
              label={t('backup.destinations.form.webdavBaseUrlLabel')}
              value={form.webdavBaseUrl}
              onChange={(e) => set('webdavBaseUrl', e.currentTarget.value)}
              placeholder={addPlaceholder(
                isEdit,
                t('backup.destinations.form.webdavBaseUrlPlaceholder')
              )}
              description={
                isEdit ? undefined : t('backup.destinations.form.webdavBaseUrlDescription')
              }
            />
            <TextInput
              label={t('backup.destinations.form.webdavRemotePathLabel')}
              value={form.webdavRemotePath}
              onChange={(e) => set('webdavRemotePath', e.currentTarget.value)}
              placeholder={addPlaceholder(
                isEdit,
                t('backup.destinations.form.webdavRemotePathPlaceholder')
              )}
              description={
                isEdit ? undefined : t('backup.destinations.form.webdavRemotePathDescription')
              }
            />
            <TextInput
              label={t('backup.destinations.form.webdavHostHeaderLabel')}
              value={form.webdavHostHeader}
              onChange={(e) => set('webdavHostHeader', e.currentTarget.value)}
              placeholder={addPlaceholder(
                isEdit,
                t('backup.destinations.form.webdavHostHeaderPlaceholder')
              )}
              description={
                isEdit ? undefined : t('backup.destinations.form.webdavHostHeaderDescription')
              }
            />
            <TextInput
              label={t('backup.destinations.form.webdavUsernameLabel')}
              value={form.webdavUsername}
              onChange={(e) => set('webdavUsername', e.currentTarget.value)}
              placeholder={addPlaceholder(
                isEdit,
                t('backup.destinations.form.webdavUsernamePlaceholder')
              )}
            />
            <TextInput
              label={t('backup.destinations.form.webdavPasswordLabel')}
              type="password"
              value={form.webdavPassword}
              onChange={(e) => set('webdavPassword', e.currentTarget.value)}
              placeholder={secretPlaceholder(isEdit, t)}
            />
          </>
        )}
      </Stack>
    </form>
  );
}
