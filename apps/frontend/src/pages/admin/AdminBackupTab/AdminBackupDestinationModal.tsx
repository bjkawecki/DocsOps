import { useEffect, useState } from 'react';
import { Button, Group, Modal, Select, Stack, TextInput, Textarea } from '@mantine/core';
import type { Destination } from './adminBackupTypes';

export type DestinationFormState = {
  name: string;
  type: 'S3_COMPATIBLE' | 'SSH';
  enabled: boolean;
  s3Endpoint: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  sshHost: string;
  sshPort: string;
  sshPath: string;
  sshUser: string;
  sshPassword: string;
  sshPrivateKey: string;
};

const EMPTY_FORM: DestinationFormState = {
  name: '',
  type: 'S3_COMPATIBLE',
  enabled: true,
  s3Endpoint: '',
  s3Bucket: '',
  s3AccessKey: '',
  s3SecretKey: '',
  sshHost: '',
  sshPort: '22',
  sshPath: '/var/backups/docsops',
  sshUser: '',
  sshPassword: '',
  sshPrivateKey: '',
};

function configString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function formFromDestination(dest: Destination): DestinationFormState {
  const config = dest.configJson;
  if (dest.type === 'S3_COMPATIBLE') {
    return {
      ...EMPTY_FORM,
      name: dest.name,
      type: 'S3_COMPATIBLE',
      enabled: dest.enabled,
      s3Endpoint: configString(config.endpoint, ''),
      s3Bucket: configString(config.bucket, ''),
    };
  }
  return {
    ...EMPTY_FORM,
    name: dest.name,
    type: 'SSH',
    enabled: dest.enabled,
    sshHost: configString(config.host, ''),
    sshPort: configString(config.port, '22'),
    sshPath: configString(config.remotePath, '/var/backups/docsops'),
    sshUser: '',
  };
}

type Props = {
  opened: boolean;
  onClose: () => void;
  destination: Destination | null;
  saving: boolean;
  onSave: (form: DestinationFormState, destinationId: string | null) => void;
};

export function AdminBackupDestinationModal({
  opened,
  onClose,
  destination,
  saving,
  onSave,
}: Props) {
  const [form, setForm] = useState<DestinationFormState>(EMPTY_FORM);
  const isEdit = destination != null;

  useEffect(() => {
    if (opened) {
      setForm(destination ? formFromDestination(destination) : EMPTY_FORM);
    }
  }, [opened, destination]);

  const set = <K extends keyof DestinationFormState>(key: K, value: DestinationFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit destination' : 'Add destination'}
      size="md"
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          value={form.name}
          onChange={(e) => set('name', e.currentTarget.value)}
        />
        <Select
          label="Type"
          value={form.type}
          disabled={isEdit}
          onChange={(v) => v && set('type', v as 'S3_COMPATIBLE' | 'SSH')}
          data={[
            { value: 'S3_COMPATIBLE', label: 'S3 compatible' },
            { value: 'SSH', label: 'SSH / SFTP' },
          ]}
        />
        {form.type === 'S3_COMPATIBLE' ? (
          <>
            <TextInput
              label="Endpoint (https)"
              value={form.s3Endpoint}
              onChange={(e) => set('s3Endpoint', e.currentTarget.value)}
            />
            <TextInput
              label="Bucket"
              value={form.s3Bucket}
              onChange={(e) => set('s3Bucket', e.currentTarget.value)}
            />
            <TextInput
              label="Access key"
              value={form.s3AccessKey}
              onChange={(e) => set('s3AccessKey', e.currentTarget.value)}
              placeholder={isEdit ? 'Leave blank to keep current' : undefined}
            />
            <TextInput
              label="Secret key"
              type="password"
              value={form.s3SecretKey}
              onChange={(e) => set('s3SecretKey', e.currentTarget.value)}
              placeholder={isEdit ? 'Leave blank to keep current' : undefined}
            />
          </>
        ) : (
          <>
            <TextInput
              label="Host"
              value={form.sshHost}
              onChange={(e) => set('sshHost', e.currentTarget.value)}
            />
            <TextInput
              label="Port"
              value={form.sshPort}
              onChange={(e) => set('sshPort', e.currentTarget.value)}
            />
            <TextInput
              label="Remote path"
              value={form.sshPath}
              onChange={(e) => set('sshPath', e.currentTarget.value)}
            />
            <TextInput
              label="Username"
              value={form.sshUser}
              onChange={(e) => set('sshUser', e.currentTarget.value)}
            />
            <TextInput
              label="Password"
              type="password"
              value={form.sshPassword}
              onChange={(e) => set('sshPassword', e.currentTarget.value)}
              placeholder={isEdit ? 'Leave blank to keep current' : undefined}
            />
            <Textarea
              label="Private key (PEM)"
              value={form.sshPrivateKey}
              onChange={(e) => set('sshPrivateKey', e.currentTarget.value)}
              minRows={3}
              placeholder={isEdit ? 'Leave blank to keep current' : undefined}
            />
          </>
        )}
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(form, destination?.id ?? null)}
            loading={saving}
            disabled={!form.name.trim()}
          >
            {isEdit ? 'Save' : 'Add destination'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
