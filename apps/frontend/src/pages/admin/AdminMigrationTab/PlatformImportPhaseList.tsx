import type { ReactNode } from 'react';
import { List, Loader, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';
import { formatPlatformImportStatus, getImportPhaseProgress } from './adminMigrationTypes';

type Props = {
  status: string;
};

export function PlatformImportPhaseList({ status }: Props) {
  const progress = getImportPhaseProgress(status);

  return (
    <List spacing="xs" size="sm" center>
      {progress.phases.map((phase, index) => {
        const isCompleted = index < progress.currentIndex;
        const isCurrent = index === progress.currentIndex && !progress.isTerminal;
        const isFailed =
          progress.isFailed && index === progress.currentIndex && progress.isTerminal;

        let icon: ReactNode;
        if (isFailed) {
          icon = (
            <ThemeIcon color="red" size={20} radius="xl" variant="light">
              <IconX size={12} />
            </ThemeIcon>
          );
        } else if (isCompleted) {
          icon = (
            <ThemeIcon color="green" size={20} radius="xl" variant="light">
              <IconCheck size={12} />
            </ThemeIcon>
          );
        } else if (isCurrent) {
          icon = <Loader size={16} />;
        } else {
          icon = (
            <ThemeIcon color="gray" size={20} radius="xl" variant="outline">
              <span
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}
              />
            </ThemeIcon>
          );
        }

        return (
          <List.Item key={phase} icon={icon}>
            <Text
              size="sm"
              c={isFailed ? 'red' : isCompleted ? 'dimmed' : undefined}
              fw={isCurrent || isFailed ? 500 : undefined}
            >
              {formatPlatformImportStatus(phase)}
            </Text>
          </List.Item>
        );
      })}
      {progress.isTerminal && progress.isFailed && status === 'failed' ? (
        <List.Item
          icon={
            <ThemeIcon color="red" size={20} radius="xl" variant="filled">
              <IconX size={12} />
            </ThemeIcon>
          }
        >
          <Text size="sm" c="red" fw={500}>
            Import failed
          </Text>
        </List.Item>
      ) : null}
      {progress.isTerminal && !progress.isFailed ? (
        <List.Item
          icon={
            <ThemeIcon color="green" size={20} radius="xl" variant="light">
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          <Text size="sm" fw={500}>
            Import complete
          </Text>
        </List.Item>
      ) : null}
    </List>
  );
}
