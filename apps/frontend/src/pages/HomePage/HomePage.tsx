import './HomePage.css';
import { Alert, Box, Loader, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMe } from '../../hooks/useMe.js';
import {
  PULSE_PAGE_SIZE,
  useMePulseInfinite,
  type PulseItemKind,
  type PulseStats,
} from '../../hooks/useMePulse.js';
import { HOME_CONTENT_MAX_WIDTH } from './homePageConstants.js';
import { PulseFeed } from './PulseFeed.js';
import { PulseStatsRow } from './PulseStatsRow.js';
import { filterMockPulse, shouldUsePulseMock } from './pulseMockData.js';

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
 * Home: greeting + filters, pulse feed with infinite scroll.
 */
export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: me } = useMe();
  const activeKind = parseKindParam(searchParams.get('kind'));
  const useMock = shouldUsePulseMock(searchParams);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const [mockLimit, setMockLimit] = useState(PULSE_PAGE_SIZE);
  const homeRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMockLimit(PULSE_PAGE_SIZE);
  }, [activeKind]);

  const {
    data: apiPages,
    isPending,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMePulseInfinite(activeKind ?? undefined, { enabled: !useMock });

  const mockData = useMock
    ? filterMockPulse(activeKind, dismissedIds, { limit: mockLimit, offset: 0 })
    : null;

  const apiStats: PulseStats | null = apiPages?.pages[0]?.stats ?? null;
  const apiItems = useMemo(() => {
    if (apiPages == null) return null;
    return apiPages.pages.flatMap((p) => p.items).filter((i) => !dismissedIds.has(i.id));
  }, [apiPages, dismissedIds]);

  const stats = useMock ? mockData?.stats : apiStats;
  const items = useMock ? (mockData?.items ?? []) : (apiItems ?? []);
  const feedHasNext = useMock ? (mockData?.total ?? 0) > mockLimit : Boolean(hasNextPage);
  const feedFetchingNext = useMock ? false : isFetchingNextPage;

  useEffect(() => {
    const home = homeRef.current;
    const header = stickyHeaderRef.current;
    if (!home || !header) {
      home?.style.removeProperty('--pulse-sticky-header-height');
      return;
    }

    const update = () => {
      home.style.setProperty('--pulse-sticky-header-height', `${header.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => {
      ro.disconnect();
      home.style.removeProperty('--pulse-sticky-header-height');
    };
  }, [stats]);

  const loadMore = useCallback(() => {
    if (useMock) {
      setMockLimit((n) => n + PULSE_PAGE_SIZE);
      return;
    }
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [useMock, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const setKind = (kind: PulseItemKind | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (kind) next.set('kind', kind);
        else next.delete('kind');
        if (useMock) next.set('pulseMock', '1');
        return next;
      },
      { replace: true }
    );
  };

  const onDismiss = (itemId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
  };

  return (
    <Box ref={homeRef} className="pulse-home" px="md" pb="xl" pt={0}>
      <Stack gap={28} maw={HOME_CONTENT_MAX_WIDTH} mx="auto" align="stretch">
        {!useMock && isPending ? <Loader size="sm" /> : null}
        {!useMock && isError ? (
          <Alert color="red" title="Could not load pulse">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        ) : null}

        {stats ? (
          <div className="pulse-home-main">
            <div className="pulse-home-sticky-header" ref={stickyHeaderRef}>
              <PulseStatsRow
                stats={stats}
                activeKind={activeKind}
                onSelectKind={setKind}
                userName={me?.user?.name}
              />
            </div>
            <div className="pulse-home-feed-wrap">
              {items.length === 0 && !isPending ? (
                <Text size="sm" c="dimmed">
                  {activeKind
                    ? 'No items in this category.'
                    : 'Nothing needs your attention right now.'}
                </Text>
              ) : items.length > 0 ? (
                <PulseFeed
                  items={items}
                  mock={useMock}
                  onDismiss={onDismiss}
                  hasNextPage={feedHasNext}
                  isFetchingNextPage={feedFetchingNext}
                  onLoadMore={loadMore}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </Stack>
    </Box>
  );
}
