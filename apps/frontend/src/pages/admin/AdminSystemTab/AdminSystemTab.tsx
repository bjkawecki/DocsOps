import {
  Alert,
  Anchor,
  Badge,
  Button,
  Code,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconExternalLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useCheckForUpdates, useAdminUpdateStatus } from '../../../hooks/useAdminUpdateStatus.js';

function formatCheckedAt(iso: string | null): string | null {
  if (iso == null) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

export function AdminSystemTab() {
  const statusQuery = useAdminUpdateStatus();
  const checkMutation = useCheckForUpdates();
  const status = statusQuery.data;

  const handleCheck = async () => {
    try {
      const result = await checkMutation.mutateAsync();
      if (result.notificationSent) {
        notifications.show({
          color: 'blue',
          message: 'Admins were notified about the available update.',
        });
      } else if (result.status.updateAvailable) {
        notifications.show({ color: 'green', message: 'Update check completed.' });
      } else {
        notifications.show({ color: 'green', message: 'DocsOps is up to date.' });
      }
    } catch {
      notifications.show({ color: 'red', message: 'Update check failed.' });
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>System & updates</Title>
          <Text size="sm" c="dimmed" maw={640}>
            Compare the installed application version with the latest GitHub release. Updates are
            applied on the server with <Code>sudo /opt/docsops/scripts/update.sh vX.Y.Z</Code> after
            a backup.
          </Text>
        </div>
        <Button
          onClick={() => void handleCheck()}
          loading={checkMutation.isPending}
          disabled={statusQuery.isLoading}
        >
          Check for updates
        </Button>
      </Group>

      {statusQuery.isError && (
        <Alert color="red" title="Could not load update status">
          Reload the page or try again later.
        </Alert>
      )}

      {status && (
        <>
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={600}>Installed version</Text>
                <Badge size="lg" variant="light">
                  v{status.installedVersion}
                </Badge>
              </Group>

              {!status.updateCheckEnabled && (
                <Alert color="gray" title="External update check disabled">
                  Set <Code>DOCSOPS_UPDATE_GITHUB_REPO=owner/repo</Code> in{' '}
                  <Code>/etc/docsops/docsops.env</Code> and restart the app container to compare
                  against GitHub Releases.
                </Alert>
              )}

              {status.updateCheckEnabled && status.checkError && (
                <Alert color="yellow" title="Update check failed">
                  {status.checkError}
                </Alert>
              )}

              {status.updateCheckEnabled && !status.checkError && (
                <>
                  <Group justify="space-between" align="center">
                    <Text fw={600}>Latest release</Text>
                    {status.latestVersion != null ? (
                      <Badge size="lg" variant="light" color="blue">
                        v{status.latestVersion}
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Unknown
                      </Text>
                    )}
                  </Group>

                  <Group gap="xs">
                    {status.updateAvailable ? (
                      <Badge color="orange">Update available</Badge>
                    ) : (
                      <Badge color="green">Up to date</Badge>
                    )}
                    {status.checkedAt != null && (
                      <Text size="xs" c="dimmed">
                        Last checked: {formatCheckedAt(status.checkedAt)}
                      </Text>
                    )}
                  </Group>

                  {status.releaseUrl != null && (
                    <Anchor href={status.releaseUrl} target="_blank" rel="noreferrer" size="sm">
                      <Group gap={4} component="span">
                        View release on GitHub
                        <IconExternalLink size={14} />
                      </Group>
                    </Anchor>
                  )}
                </>
              )}
            </Stack>
          </Paper>

          {status.updateAvailable && status.latestReleaseTag != null && (
            <Alert color="blue" title="Apply update on the server">
              <Stack gap="xs">
                <Text size="sm">Run on the host (SSH), after taking a backup:</Text>
                <Code block>
                  {`sudo /opt/docsops/scripts/update.sh ${status.latestReleaseTag}`}
                </Code>
              </Stack>
            </Alert>
          )}

          <Alert color="yellow" variant="light" title="Back up before updating">
            Create an operational backup before upgrading production.{' '}
            <Text component={Link} to="/admin/backup" size="sm" c="blue">
              Open Backup tab
            </Text>
          </Alert>
        </>
      )}
    </Stack>
  );
}
