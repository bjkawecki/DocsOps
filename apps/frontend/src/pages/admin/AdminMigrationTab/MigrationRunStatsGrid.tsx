import { SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { MigrationRunCounts } from './adminMigrationTypes';

type Props = {
  counts: MigrationRunCounts | null | undefined;
};

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="lg" fw={600}>
        {value}
      </Text>
    </Stack>
  );
}

export function MigrationRunStatsGrid({ counts }: Props) {
  const { t } = useTranslation('admin');
  if (!counts) return null;

  const thirdLabel =
    counts.companies != null ? t('migration.runStats.companies') : t('migration.runStats.files');
  const thirdValue = counts.companies ?? counts.attachmentFiles ?? 0;

  return (
    <SimpleGrid cols={3} spacing="sm">
      <StatCell label={t('migration.runStats.users')} value={counts.users ?? 0} />
      <StatCell label={t('migration.runStats.documents')} value={counts.documents ?? 0} />
      <StatCell label={thirdLabel} value={thirdValue} />
    </SimpleGrid>
  );
}
