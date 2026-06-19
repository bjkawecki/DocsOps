import { Box, Text } from '@mantine/core';
import type { MaintenanceStatus } from '../../hooks/useMaintenanceStatus';

type Props = {
  status: MaintenanceStatus | undefined;
};

function bannerMessage(status: MaintenanceStatus): string {
  if (status.reason === 'restore') {
    return 'Disaster recovery restore in progress – write operations are temporarily blocked. You may need to sign in again when complete.';
  }
  return 'Backup in progress – write operations are temporarily blocked.';
}

export function AppShellMaintenanceBanner({ status }: Props) {
  if (!status?.active) return null;

  const isRestore = status.reason === 'restore';

  return (
    <Box
      px="md"
      py={6}
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}
      bg={isRestore ? 'orange.9' : 'blue.9'}
      role="status"
      aria-live="polite"
    >
      <Text size="sm" c="white" ta="center" lineClamp={2}>
        {bannerMessage(status)}
      </Text>
    </Box>
  );
}
