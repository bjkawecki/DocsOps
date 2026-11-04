import { Button, Group, Tooltip } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

export type HealthCheckConfirmKind =
  'still_valid' | 'needs_update' | 'archive' | 'revoke_needs_update' | 'revoke_archive';

export type HealthCheckActionItem = {
  outcome: 'open' | 'needs_update' | 'archive';
};

type Props = {
  item: HealthCheckActionItem;
  loading: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onOpen: (kind: HealthCheckConfirmKind) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

/** Solid neutral surface so buttons read as controls in light and dark mode. */
const actionButtonStyles = {
  root: {
    background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))',
    border: '1px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-3))',
    color: 'light-dark(var(--mantine-color-gray-9), var(--mantine-color-gray-0))',
  },
} as const;

export function HealthCheckActionButtons({
  item,
  loading,
  disabled = false,
  disabledReason,
  onOpen,
  t,
}: Props) {
  const needsUpdateActive = item.outcome === 'needs_update';
  const archiveActive = item.outcome === 'archive';
  const tip = disabled ? (disabledReason ?? undefined) : undefined;

  return (
    <Tooltip label={tip ?? ''} disabled={!tip}>
      <Group gap={4} wrap="nowrap">
        <Button
          size="compact-xs"
          variant="default"
          styles={actionButtonStyles}
          loading={loading}
          disabled={disabled}
          onClick={() => onOpen('still_valid')}
        >
          {t('actions.stillValid')}
        </Button>
        <Button
          size="compact-xs"
          variant="default"
          styles={actionButtonStyles}
          loading={loading}
          disabled={disabled}
          leftSection={needsUpdateActive ? <IconCheck size={12} stroke={2} /> : undefined}
          onClick={() => onOpen(needsUpdateActive ? 'revoke_needs_update' : 'needs_update')}
        >
          {t('actions.needsUpdate')}
        </Button>
        <Button
          size="compact-xs"
          variant="default"
          styles={actionButtonStyles}
          loading={loading}
          disabled={disabled}
          leftSection={archiveActive ? <IconCheck size={12} stroke={2} /> : undefined}
          onClick={() => onOpen(archiveActive ? 'revoke_archive' : 'archive')}
        >
          {t('actions.archive')}
        </Button>
      </Group>
    </Tooltip>
  );
}
