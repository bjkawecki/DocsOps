import { ActionIcon, Box, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../api/client';
import { DocopsLogo } from '../../components/appShell/DocopsLogo';
import { useAppDocumentSearch } from '../../components/search/DocumentSearchContext';
import { SearchIcon } from '../../components/search/SearchIcon';
import { useMe } from '../../hooks/useMe';
import { useMeDrafts } from '../../hooks/useMeDrafts';
import { useMeReviews } from '../../hooks/useMeReviews';
import { useResolvedColorScheme } from '../../hooks/useResolvedColorScheme';
import { getAggregatedRecentItems } from '../../hooks/useRecentItems';
import { DASHBOARD_CARD_LIMIT } from './homePageConstants';
import type { CatalogResponse, PinnedResponse } from './homePageTypes';
import { HomeDashboardSectionGrid } from './HomeDashboardSectionGrid';

export function HomePage() {
  const navigate = useNavigate();
  const resolvedColorScheme = useResolvedColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  const heroSearchInputRef = useRef<HTMLInputElement>(null);
  const { openSearch } = useAppDocumentSearch();
  const { data: me } = useMe();
  const recentItems = getAggregatedRecentItems(
    me?.preferences?.recentItemsByScope,
    DASHBOARD_CARD_LIMIT
  );

  const {
    data: pinnedData,
    isPending: pinnedPending,
    isError: pinnedError,
  } = useQuery({
    queryKey: ['pinned', 'dashboard'],
    queryFn: async (): Promise<PinnedResponse> => {
      const res = await apiFetch('/api/v1/pinned');
      if (!res.ok) throw new Error('Failed to load pinned documents');
      return (await res.json()) as PinnedResponse;
    },
  });
  const pinnedItems = (pinnedData?.items ?? []).slice(0, DASHBOARD_CARD_LIMIT);

  const {
    data: latestData,
    isPending: latestPending,
    isError: latestError,
  } = useQuery({
    queryKey: ['catalog-documents', 'dashboard-latest', DASHBOARD_CARD_LIMIT, 0],
    queryFn: async (): Promise<CatalogResponse> => {
      const res = await apiFetch(
        `/api/v1/documents?${new URLSearchParams({ limit: String(DASHBOARD_CARD_LIMIT), offset: '0' })}`
      );
      if (!res.ok) throw new Error('Failed to load documents');
      return (await res.json()) as CatalogResponse;
    },
  });

  const latestItems = latestData?.items ?? [];

  const isAdmin = me?.user?.isAdmin === true;
  const isCompanyLead = (me?.identity?.companyLeads?.length ?? 0) > 0;
  const isDepartmentLead = (me?.identity?.departmentLeads?.length ?? 0) > 0;
  const hasReviewRights =
    isAdmin ||
    isDepartmentLead ||
    isCompanyLead ||
    (me?.identity?.teams?.some((t) => t.role === 'leader') ?? false);

  const { data: draftsData, isPending: draftsPending } = useMeDrafts(
    {},
    { limit: DASHBOARD_CARD_LIMIT, offset: 0 }
  );
  const draftDocuments = draftsData?.draftDocuments ?? [];

  const { data: reviewsData, isPending: reviewsPending } = useMeReviews(
    { limit: DASHBOARD_CARD_LIMIT, offset: 0 },
    { enabled: hasReviewRights }
  );
  const pendingReviews = reviewsData?.pendingForReview ?? [];

  const handleSearchSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      void navigate('/catalog');
      return;
    }
    openSearch(q);
  };

  return (
    <Box>
      <Stack
        align="center"
        mb={{ base: 'md', md: 'sm' }}
        gap="md"
        pt={{ base: '2rem', md: '0.75rem' }}
        pb={{ base: '1.5rem', md: '0.75rem' }}
      >
        <Stack align="center" gap="xs">
          <Group gap="lg" justify="center">
            <DocopsLogo width={112} height={112} />
            <Box component="span">
              <Text
                component="span"
                c={resolvedColorScheme === 'dark' ? 'white' : 'dimmed'}
                style={{ fontSize: '2.7rem', fontWeight: 600 }}
              >
                Docs
              </Text>
              <Text
                component="span"
                c="var(--mantine-primary-color-filled)"
                style={{ fontSize: '2.7rem', fontWeight: 600 }}
              >
                Ops
              </Text>
            </Box>
          </Group>
          <Text
            component="p"
            size="md"
            ta="center"
            maw={540}
            lh={1.55}
            m={0}
            fw={500}
            c={resolvedColorScheme === 'dark' ? 'gray.4' : 'gray.7'}
            style={{ letterSpacing: '0.02em' }}
          >
            The{' '}
            <Text span inherit c="var(--mantine-primary-color-filled)" fw={700}>
              knowledge
            </Text>{' '}
            our organisation{' '}
            <Text span inherit fw={600}>
              runs on.
            </Text>
          </Text>
        </Stack>
      </Stack>

      <Stack align="center" gap="md" mb={{ base: 'md', md: 'sm' }}>
        <Box component="form" onSubmit={handleSearchSubmit} w="100%" maw={600} mx="auto">
          <TextInput
            ref={heroSearchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            placeholder="Search documents…"
            size="md"
            leftSection={<SearchIcon />}
            rightSection={
              searchQuery.length > 0 ? (
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  type="button"
                >
                  <IconX size={16} stroke={1.75} />
                </ActionIcon>
              ) : undefined
            }
            rightSectionWidth={40}
            aria-label="Search documents"
          />
        </Box>
      </Stack>

      <HomeDashboardSectionGrid
        pinnedItems={pinnedItems}
        pinnedPending={pinnedPending}
        pinnedError={pinnedError}
        recentItems={recentItems}
        latestItems={latestItems}
        latestPending={latestPending}
        latestError={latestError}
        draftDocuments={draftDocuments}
        draftsPending={draftsPending}
        draftsTotal={draftsData?.total}
        pendingReviews={pendingReviews}
        reviewsPending={reviewsPending}
        reviewsDataLoaded={reviewsData !== undefined}
        reviewsTotal={reviewsData?.totalPendingForReview}
        hasReviewRights={hasReviewRights}
      />
    </Box>
  );
}
