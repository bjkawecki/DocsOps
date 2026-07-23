import './HomePage.css';
import { Alert, Box, Loader, Text } from '@mantine/core';
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
import { PulseExploreBlock } from './PulseExploreBlock.js';
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
 * Explore + illustration always follow the feed (fill when empty, footer when not).
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

  const feedEmpty = items.length === 0 && !isPending;
  const exploreLayout = items.length > 0 ? 'footer' : 'fill';
  const homeExploreClass =
    items.length > 0 ? 'pulse-home--explore-footer' : 'pulse-home--explore-fill';

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
    <Box
      ref={homeRef}
      className={`pulse-home${stats ? ` ${homeExploreClass}` : ''}`}
      px="md"
      pb="xl"
      pt={0}
      style={{ ['--pulse-home-column-max' as string]: `${HOME_CONTENT_MAX_WIDTH}px` }}
    >
      {!useMock && isPending ? (
        <div className="pulse-home-column">
          <Loader size="sm" />
        </div>
      ) : null}
      {!useMock && isError ? (
        <div className="pulse-home-column">
          <Alert color="red" title="Could not load pulse">
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        </div>
      ) : null}

      {stats ? (
        <div className="pulse-home-main">
          <div className="pulse-home-sticky-header" ref={stickyHeaderRef}>
            <div className="pulse-home-column">
              <PulseStatsRow
                stats={stats}
                activeKind={activeKind}
                onSelectKind={setKind}
                userName={me?.user?.name}
              />
            </div>
          </div>
          <div className="pulse-home-feed-wrap">
            {feedEmpty && activeKind ? (
              <div className="pulse-home-column">
                <Text size="sm" c="dimmed">
                  No items in this category.
                </Text>
              </div>
            ) : null}
            {items.length > 0 ? (
              <div className="pulse-home-column">
                <PulseFeed
                  items={items}
                  mock={useMock}
                  onDismiss={onDismiss}
                  hasNextPage={feedHasNext}
                  isFetchingNextPage={feedFetchingNext}
                  onLoadMore={loadMore}
                />
              </div>
            ) : null}
            <PulseExploreBlock enabled layout={exploreLayout} />
          </div>
        </div>
      ) : null}
    </Box>
  );
}
