import { Alert, Button, Group, Text } from '@mantine/core';
import type { LiveEventsStatus } from '../../hooks/liveEventsContext.js';

type Props = {
  status: LiveEventsStatus;
  onRetry: () => void;
};

export function AppShellLiveEventsBanner({ status, onRetry }: Props) {
  if (status === 'connected') return null;

  if (status === 'reconnecting') {
    return (
      <Alert color="yellow" variant="filled" py="xs">
        <Text size="sm">Reconnecting to live updates…</Text>
      </Alert>
    );
  }

  return (
    <Alert color="red" variant="filled" title="Live updates unavailable">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Text size="sm">
          The connection to the server was lost. Document and notification updates may be outdated
          until the connection is restored.
        </Text>
        <Button size="compact-sm" variant="white" color="red" onClick={onRetry}>
          Retry now
        </Button>
      </Group>
    </Alert>
  );
}
