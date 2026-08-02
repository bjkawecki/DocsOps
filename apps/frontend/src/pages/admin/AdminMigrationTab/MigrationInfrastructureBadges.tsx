import { Badge, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  minioAvailable: boolean;
  workerConnected: boolean;
};

export function MigrationInfrastructureBadges({ minioAvailable, workerConnected }: Props) {
  const { t } = useTranslation('admin');
  return (
    <Group gap="xs" wrap="wrap">
      <Badge color={minioAvailable ? 'green' : 'red'} variant="filled">
        {minioAvailable
          ? t('migration.infrastructureBadges.minioOk')
          : t('migration.infrastructureBadges.minioUnavailable')}
      </Badge>
      <Badge color={workerConnected ? 'green' : 'red'} variant="filled">
        {workerConnected
          ? t('migration.infrastructureBadges.workerOk')
          : t('migration.infrastructureBadges.workerDisconnected')}
      </Badge>
    </Group>
  );
}
