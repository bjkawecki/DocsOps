import { useEffect, useMemo, useRef } from 'react';
import { Alert, Anchor, Container, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import type { UserPreferences } from '../../components/system/ThemeFromPreferences';
import { useAppVersion } from '../../hooks/useAppVersion';
import { useMe, meQueryKey } from '../../hooks/useMe';
import {
  fetchReleaseDetail,
  releaseDetailQueryKey,
  useReleasesList,
} from '../../hooks/useReleases';
import { WhatsNewReleaseCard } from './WhatsNewReleaseCard.js';

export function WhatsNewPage() {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: versionData } = useAppVersion();
  const installedVersion = versionData?.version;

  const { data: releasesList, isPending: listPending, isError: listError } = useReleasesList();

  const versions = useMemo(
    () => releasesList?.releases.map((item) => item.version) ?? [],
    [releasesList]
  );

  const detailQueries = useQueries({
    queries: versions.map((version) => ({
      queryKey: releaseDetailQueryKey(version),
      queryFn: () => fetchReleaseDetail(version),
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    })),
  });

  const markSeenAttemptRef = useRef<string | null>(null);

  const { mutate: markReleaseSeen } = useMutation({
    mutationFn: async (version: string) => {
      const res = await apiFetch('/api/v1/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ lastSeenReleaseVersion: version }),
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      return (await res.json()) as UserPreferences;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });

  useEffect(() => {
    if (!installedVersion) return;
    if (me?.preferences?.lastSeenReleaseVersion === installedVersion) return;
    if (markSeenAttemptRef.current === installedVersion) return;
    markSeenAttemptRef.current = installedVersion;
    markReleaseSeen(installedVersion);
  }, [installedVersion, me?.preferences?.lastSeenReleaseVersion, markReleaseSeen]);

  const detailsPending = detailQueries.some((query) => query.isPending);
  const detailsError = detailQueries.find((query) => query.isError);
  const releases = detailQueries
    .map((query) => query.data)
    .filter((item): item is NonNullable<typeof item> => item != null);

  return (
    <Container fluid maw={720} px="md" mb="xl">
      <Stack gap="lg" mt="md">
        <Group gap="sm" align="center">
          <IconSparkles size={32} stroke={1.5} color="var(--mantine-color-dimmed)" aria-hidden />
          <Stack gap={2}>
            <Title order={1}>What&apos;s new</Title>
            {installedVersion && (
              <Text size="sm" c="dimmed">
                You&apos;re on v{installedVersion}
              </Text>
            )}
          </Stack>
        </Group>

        {(listPending || detailsPending) && (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        )}

        {(listError || detailsError) && (
          <Alert color="red" title="Could not load release notes">
            Please try again later.
          </Alert>
        )}

        {!listPending && !listError && !detailsPending && releases.length === 0 && (
          <Text size="sm" c="dimmed">
            No release notes available yet.
          </Text>
        )}

        {!listPending && !detailsPending && releases.length > 0 && (
          <Stack gap="lg">
            {releases.map((release, index) => (
              <WhatsNewReleaseCard
                key={release.version}
                release={release}
                isLatest={index === 0}
                isInstalled={release.version === installedVersion}
                defaultExpanded={index === 0}
              />
            ))}
          </Stack>
        )}

        <Text size="sm" c="dimmed">
          <Anchor component={Link} to="/help/overview" size="sm">
            Help &amp; guides →
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
