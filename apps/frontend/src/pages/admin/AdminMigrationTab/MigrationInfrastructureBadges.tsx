import { Badge, Group } from '@mantine/core';

type Props = {
  minioAvailable: boolean;
  workerConnected: boolean;
};

export function MigrationInfrastructureBadges({ minioAvailable, workerConnected }: Props) {
  return (
    <Group gap="xs" wrap="wrap">
      <Badge color={minioAvailable ? 'green' : 'red'} variant="filled">
        MinIO {minioAvailable ? 'OK' : 'unavailable'}
      </Badge>
      <Badge color={workerConnected ? 'green' : 'red'} variant="filled">
        Job worker {workerConnected ? 'OK' : 'disconnected'}
      </Badge>
    </Group>
  );
}
