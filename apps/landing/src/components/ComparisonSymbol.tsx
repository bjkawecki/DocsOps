import { Box, Text } from '@mantine/core';
import { IconCircleCheck, IconCircleDashed, IconCircleX } from '@tabler/icons-react';
import type { ComparisonValue } from '../content/comparison';

const LABELS: Record<ComparisonValue, string> = {
  yes: 'Ja',
  partial: 'Teilweise',
  no: 'Nein',
};

type ComparisonSymbolProps = {
  value: ComparisonValue;
  note?: string;
};

export function ComparisonSymbol({ value, note }: ComparisonSymbolProps) {
  const label = note ? `${LABELS[value]} (${note})` : LABELS[value];

  const icon =
    value === 'yes' ? (
      <IconCircleCheck size={22} stroke={1.8} color="var(--mantine-color-blue-4)" />
    ) : value === 'partial' ? (
      <IconCircleDashed size={22} stroke={1.8} color="var(--mantine-color-dimmed)" />
    ) : (
      <IconCircleX size={22} stroke={1.8} color="var(--mantine-color-dark-3)" />
    );

  return (
    <Box aria-label={label} title={label} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {icon}
      {note ? (
        <Text component="span" size="sm" c="dimmed" ml={6}>
          {note}
        </Text>
      ) : null}
    </Box>
  );
}
