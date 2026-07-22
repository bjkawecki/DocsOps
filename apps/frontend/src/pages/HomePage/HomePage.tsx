import { Alert, Box, Loader, Stack, Text, Title } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import { useMePulse, type PulseItemKind } from '../../hooks/useMePulse.js';
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import { HOME_CONTENT_MAX_WIDTH } from './homePageConstants.js';
import { PulseFeed } from './PulseFeed.js';
import { PulseStatsRow } from './PulseStatsRow.js';

const KIND_VALUES: PulseItemKind[] = [
  'draft-open',
  'review-awaiting',
  'review-decided',
  'document-new',
  'document-updated',
  'document-comments',
];

function parseKindParam(raw: string | null): PulseItemKind | null {
  if (raw == null || raw === '') return null;
  return KIND_VALUES.includes(raw as PulseItemKind) ? (raw as PulseItemKind) : null;
}

/**
 * Home pulse: stats row + chronological feed (no hero).
 */
export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKind = parseKindParam(searchParams.get('kind'));
  const { data, isPending, isError, error } = useMePulse(activeKind ?? undefined);

  const setKind = (kind: PulseItemKind | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (kind) next.set('kind', kind);
        else next.delete('kind');
        return next;
      },
      { replace: true }
    );
  };

  return (
    <Box px="md" pb="xl" pt={{ base: 'md', md: 'sm' }}>
      <Stack gap="lg" maw={HOME_CONTENT_MAX_WIDTH} mx="auto" align="stretch">
        <div>
          <Title order={2} size="h3" mb={4}>
            Pulse
          </Title>
          <Text size="sm" c="dimmed">
            What needs attention across your organisation.
          </Text>
        </div>

        {isPending ? <Loader size="sm" /> : null}
        {isError ? (
          <Alert color="red" title="Could not load pulse">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        ) : null}

        {data ? (
          <>
            <PulseStatsRow stats={data.stats} activeKind={activeKind} onSelectKind={setKind} />
            <Stack gap="xs" align="stretch">
              <SectionLabel mb={0}>{activeKind ? 'Filtered feed' : 'Feed'}</SectionLabel>
              {data.items.length === 0 ? (
                <Text size="sm" c="dimmed">
                  {activeKind ? 'No items in this category.' : "You're all caught up."}
                </Text>
              ) : (
                <PulseFeed items={data.items} />
              )}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
