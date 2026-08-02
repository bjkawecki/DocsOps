import {
  Button,
  Group,
  NumberInput,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdminSystemSettings } from 'backend/api-types';
import { useSetAppShellBreadcrumbActions } from '../../../components/appShell/AppShellBreadcrumbsContext.js';
import { useMe } from '../../../hooks/useMe.js';
import {
  usePatchAdminSystemSettings,
  useSendAdminSmtpTestEmail,
} from '../../../hooks/useAdminUpdateStatus.js';

type Props = {
  settings: AdminSystemSettings;
};

/**
 * Admin Platform → Mail: platform SMTP configuration + send test email.
 */
export function AdminSystemMailSection({ settings }: Props) {
  const { data: me } = useMe();
  const patchMutation = usePatchAdminSystemSettings();
  const testMutation = useSendAdminSmtpTestEmail();

  const [smtpEnabled, setSmtpEnabled] = useState(settings.smtpEnabled);
  const [smtpHost, setSmtpHost] = useState(settings.smtpHost ?? '');
  const [smtpPort, setSmtpPort] = useState<number | string>(settings.smtpPort ?? 587);
  const [smtpEncryption, setSmtpEncryption] = useState<string | null>(
    settings.smtpEncryption ?? 'starttls'
  );
  const [smtpUsername, setSmtpUsername] = useState(settings.smtpUsername ?? '');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFromAddress, setSmtpFromAddress] = useState(settings.smtpFromAddress ?? '');
  const [smtpFromName, setSmtpFromName] = useState(settings.smtpFromName ?? '');
  const [testTo, setTestTo] = useState(me?.user?.email ?? '');

  useEffect(() => {
    setSmtpEnabled(settings.smtpEnabled);
    setSmtpHost(settings.smtpHost ?? '');
    setSmtpPort(settings.smtpPort ?? 587);
    setSmtpEncryption(settings.smtpEncryption ?? 'starttls');
    setSmtpUsername(settings.smtpUsername ?? '');
    setSmtpFromAddress(settings.smtpFromAddress ?? '');
    setSmtpFromName(settings.smtpFromName ?? '');
    setSmtpPassword('');
  }, [settings]);

  useEffect(() => {
    if (me?.user?.email && !testTo) {
      setTestTo(me.user.email);
    }
  }, [me?.user?.email, testTo]);

  const handleSave = async () => {
    const portNum = typeof smtpPort === 'number' ? smtpPort : Number.parseInt(String(smtpPort), 10);
    try {
      await patchMutation.mutateAsync({
        smtpEnabled,
        smtpHost: smtpHost.trim() || null,
        smtpPort: Number.isFinite(portNum) ? portNum : null,
        smtpEncryption:
          smtpEncryption === 'none' || smtpEncryption === 'starttls' || smtpEncryption === 'tls'
            ? smtpEncryption
            : null,
        smtpUsername: smtpUsername.trim() || null,
        ...(smtpPassword.trim() !== '' ? { smtpPassword: smtpPassword } : {}),
        smtpFromAddress: smtpFromAddress.trim() || null,
        smtpFromName: smtpFromName.trim() || null,
      });
      setSmtpPassword('');
      notifications.show({ color: 'green', message: 'Mail settings saved.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof Error ? err.message : 'Could not save mail settings.',
      });
    }
  };

  const handleTest = async () => {
    try {
      await testMutation.mutateAsync({ to: testTo.trim() || undefined });
      notifications.show({ color: 'green', message: 'Test email sent.' });
    } catch (err) {
      notifications.show({
        color: 'red',
        message: err instanceof Error ? err.message : 'Test email failed.',
      });
    }
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const handleTestRef = useRef(handleTest);
  handleTestRef.current = handleTest;

  const testDisabled = !settings.smtpEnabled && !smtpEnabled;
  const chromeActions = useMemo(
    () => (
      <Group gap="sm" align="center" wrap="nowrap">
        <Button
          loading={patchMutation.isPending}
          onClick={() => void handleSaveRef.current()}
          size="xs"
        >
          Save mail settings
        </Button>
        <Button
          variant="light"
          size="xs"
          loading={testMutation.isPending}
          disabled={testDisabled}
          onClick={() => void handleTestRef.current()}
        >
          Send test email
        </Button>
      </Group>
    ),
    [patchMutation.isPending, testMutation.isPending, testDisabled]
  );
  useSetAppShellBreadcrumbActions(
    chromeActions,
    `admin-mail:${patchMutation.isPending}:${testMutation.isPending}:${testDisabled}`
  );

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <div>
          <Title order={4}>Outgoing email (SMTP)</Title>
          <Text size="sm" c="dimmed">
            Platform mail server for notification emails. Passwords are stored encrypted and never
            shown again. Send a test email after saving.
          </Text>
        </div>

        <Switch
          label="Enable SMTP"
          checked={smtpEnabled}
          onChange={(e) => setSmtpEnabled(e.currentTarget.checked)}
        />

        <Group grow align="flex-start">
          <TextInput
            label="Host"
            placeholder="smtp.example.com"
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.currentTarget.value)}
          />
          <NumberInput
            label="Port"
            value={smtpPort}
            onChange={setSmtpPort}
            min={1}
            max={65535}
            allowDecimal={false}
          />
        </Group>

        <Select
          label="Encryption"
          data={[
            { value: 'none', label: 'None' },
            { value: 'starttls', label: 'STARTTLS' },
            { value: 'tls', label: 'TLS' },
          ]}
          value={smtpEncryption}
          onChange={setSmtpEncryption}
          allowDeselect={false}
        />

        <Group grow align="flex-start">
          <TextInput
            label="Username"
            value={smtpUsername}
            onChange={(e) => setSmtpUsername(e.currentTarget.value)}
            autoComplete="off"
          />
          <PasswordInput
            label={
              settings.smtpPasswordConfigured
                ? 'Password (leave blank to keep current)'
                : 'Password'
            }
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.currentTarget.value)}
            autoComplete="new-password"
          />
        </Group>

        <Group grow align="flex-start">
          <TextInput
            label="From address"
            placeholder="noreply@example.com"
            value={smtpFromAddress}
            onChange={(e) => setSmtpFromAddress(e.currentTarget.value)}
          />
          <TextInput
            label="From name"
            placeholder="DocsOps"
            value={smtpFromName}
            onChange={(e) => setSmtpFromName(e.currentTarget.value)}
          />
        </Group>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Send test email
          </Text>
          <TextInput
            label="Recipient"
            description="Defaults to your admin account email"
            value={testTo}
            onChange={(e) => setTestTo(e.currentTarget.value)}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
