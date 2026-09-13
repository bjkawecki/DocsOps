import { Box, Card, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import type { MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './EntityListCard.css';

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
  /**
   * `card` – thin border, transparent fill (default; catalog, context docs, …).
   * `flat` – divider rows for dense lists (trash, approvals, …).
   */
  variant?: 'card' | 'flat';
};

const interactiveButtonStyle = {
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
  variant = 'card',
}: EntityListCardProps) {
  const flat = variant === 'flat';
  const rootClass = flat ? 'entity-list-card entity-list-card--flat' : 'entity-list-card';

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
        <Stack gap={10} style={{ flex: 1, minWidth: 0 }}>
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

  const hitStyle = {
    ...interactiveButtonStyle,
    borderRadius: flat ? 0 : 'var(--mantine-radius-md)',
  };

  if (to != null) {
    if (flat) {
      return (
        <Box className={rootClass} w="100%">
          <UnstyledButton
            component={Link}
            to={to}
            w="100%"
            className="entity-list-card-hit"
            style={hitStyle}
          >
            {body}
          </UnstyledButton>
        </Box>
      );
    }
    return (
      <Card withBorder radius="md" w="100%" padding={0} bg="transparent" className={rootClass}>
        <UnstyledButton
          component={Link}
          to={to}
          w="100%"
          p="sm"
          className="entity-list-card-hit"
          style={hitStyle}
        >
          {body}
        </UnstyledButton>
      </Card>
    );
  }

  if (onClick != null) {
    if (flat) {
      return (
        <Box className={rootClass} w="100%">
          <UnstyledButton
            onClick={onClick}
            w="100%"
            className="entity-list-card-hit"
            style={hitStyle}
          >
            {body}
          </UnstyledButton>
        </Box>
      );
    }
    return (
      <Card withBorder radius="md" w="100%" padding={0} bg="transparent" className={rootClass}>
        <UnstyledButton
          onClick={onClick}
          w="100%"
          p="sm"
          className="entity-list-card-hit"
          style={hitStyle}
        >
          {body}
        </UnstyledButton>
      </Card>
    );
  }

  if (flat) {
    return (
      <Box className={rootClass} w="100%" py="sm">
        {body}
      </Box>
    );
  }

  return (
    <Card withBorder radius="md" w="100%" padding="sm" bg="transparent" className={rootClass}>
      {body}
    </Card>
  );
}
