import { Box, Card, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import type { MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type EntityListCardProps = {
  /** Primary line (string or custom node). */
  title: ReactNode;
  /** One or two meta lines under the title. */
  meta?: ReactNode;
  /** Status badge or similar on the right. */
  rightSection?: ReactNode;
  /** Entire card navigates (preferred for document rows). */
  to?: string;
  /** Click handler when not using `to` (e.g. open detail modal). */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Optional leading icon. */
  leftSection?: ReactNode;
};

const interactiveButtonStyle = {
  borderRadius: 'var(--mantine-radius-md)',
  textAlign: 'start' as const,
  textDecoration: 'none',
  color: 'inherit',
};

/**
 * Compact-viewport list row: title, optional meta, optional status.
 * Wide viewports keep `dense-list-table`; pages switch via `WIDE_MIN_WIDTH`.
 */
export function EntityListCard({
  title,
  meta,
  rightSection,
  to,
  onClick,
  leftSection,
}: EntityListCardProps) {
  const body = (
    <Group
      gap="sm"
      wrap="nowrap"
      align="flex-start"
      justify="space-between"
      mih={44}
      style={{ width: '100%' }}
    >
      <Group gap="sm" wrap="nowrap" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
        {leftSection != null ? (
          <Box c="dimmed" style={{ display: 'flex', flexShrink: 0, marginTop: 2 }}>
            {leftSection}
          </Box>
        ) : null}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          {typeof title === 'string' ? (
            <Text fw={600} size="sm" lineClamp={2}>
              {title}
            </Text>
          ) : (
            title
          )}
          {meta != null ? (
            typeof meta === 'string' ? (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {meta}
              </Text>
            ) : (
              meta
            )
          ) : null}
        </Stack>
      </Group>
      {rightSection != null ? <Box style={{ flexShrink: 0 }}>{rightSection}</Box> : null}
    </Group>
  );

  const cardProps = {
    withBorder: true as const,
    radius: 'md' as const,
    w: '100%' as const,
  };

  if (to != null) {
    return (
      <Card {...cardProps} padding={0} className="entity-list-card">
        <UnstyledButton component={Link} to={to} w="100%" p="sm" style={interactiveButtonStyle}>
          {body}
        </UnstyledButton>
      </Card>
    );
  }

  if (onClick != null) {
    return (
      <Card {...cardProps} padding={0} className="entity-list-card">
        <UnstyledButton onClick={onClick} w="100%" p="sm" style={interactiveButtonStyle}>
          {body}
        </UnstyledButton>
      </Card>
    );
  }

  return (
    <Card {...cardProps} padding="sm" className="entity-list-card">
      {body}
    </Card>
  );
}
