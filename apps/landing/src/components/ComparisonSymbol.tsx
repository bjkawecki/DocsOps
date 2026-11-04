import { Box, Text } from '@mantine/core';
import { IconCircleCheck, IconCircleDashed, IconCircleX } from '@tabler/icons-react';
import type { ComparisonValue } from '../content/types';
import { useLocale } from '../i18n/LocaleProvider';

const LABELS: Record<'de' | 'en', Record<ComparisonValue, string>> = {
  de: {
    yes: 'Trifft zu',
    partial: 'Teilweise',
    no: 'Trifft nicht zu',
  },
  en: {
    yes: 'Applies',
    partial: 'Partial',
    no: 'Does not apply',
  },
};

type ComparisonSymbolProps = {
  value: ComparisonValue;
  note?: string;
};

export function ComparisonSymbol({ value, note }: ComparisonSymbolProps) {
  const { locale } = useLocale();
  const labels = LABELS[locale];
  const label = note ? `${labels[value]} (${note})` : labels[value];

  const icon =
    value === 'yes' ? (
      <IconCircleCheck size={22} stroke={1.8} color="var(--mantine-color-blue-4)" />
    ) : value === 'partial' ? (
      <IconCircleDashed size={22} stroke={1.8} color="var(--mantine-color-dimmed)" />
    ) : (
      <IconCircleX size={22} stroke={1.8} color="var(--landing-border-soft)" />
    );

  return (
    <Box aria-label={label} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {icon}
      {note ? (
        <Text component="span" size="sm" c="dimmed" ml={6}>
          {note}
        </Text>
      ) : null}
    </Box>
  );
}
