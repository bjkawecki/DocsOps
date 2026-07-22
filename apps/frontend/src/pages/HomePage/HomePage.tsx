import { Box, Container, Group, Stack, Text } from '@mantine/core';
import { DocopsLogo } from '../../components/appShell/DocopsLogo';
import { useMe } from '../../hooks/useMe';
import { useMeDrafts } from '../../hooks/useMeDrafts';
import { useMeReviews } from '../../hooks/useMeReviews';
import { useResolvedColorScheme } from '../../hooks/useResolvedColorScheme';
import { HOME_CONTENT_MAX_WIDTH, HOME_SECTION_LIMIT } from './homePageConstants';
import { HomeSections } from './HomeSections';

export function HomePage() {
  const resolvedColorScheme = useResolvedColorScheme();
  const { data: me } = useMe();

  const isAdmin = me?.user.isAdmin === true;
  const isCompanyLead = (me?.identity?.companyLeads?.length ?? 0) > 0;
  const isDepartmentLead = (me?.identity?.departmentLeads?.length ?? 0) > 0;
  const hasReviewRights =
    isAdmin ||
    isCompanyLead ||
    isDepartmentLead ||
    (me?.identity?.teams?.some((t) => t.role === 'leader') ?? false);

  const { data: draftsData, isPending: draftsPending } = useMeDrafts(
    {},
    { limit: HOME_SECTION_LIMIT, offset: 0 }
  );
  const draftDocuments = draftsData?.draftDocuments ?? [];

  const { data: reviewsData, isPending: reviewsPending } = useMeReviews(
    { limit: HOME_SECTION_LIMIT, offset: 0 },
    { enabled: hasReviewRights }
  );
  const pendingReviews = reviewsData?.pendingForReview ?? [];

  const brandColor = resolvedColorScheme === 'dark' ? 'dark.0' : 'dimmed';

  return (
    <Container fluid maw={1600} px="md" pb="xl">
      <Stack align="center" gap={0} pt={{ base: 'xl', md: 'md' }}>
        <Stack align="center" gap="xs">
          <Group gap="lg" justify="center">
            <DocopsLogo width={96} height={96} />
            <Box component="span">
              <Text component="span" c={brandColor} style={{ fontSize: '2.4rem', fontWeight: 600 }}>
                Docs
              </Text>
              <Text
                component="span"
                c="var(--mantine-primary-color-filled)"
                style={{ fontSize: '2.4rem', fontWeight: 600 }}
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

        <Box w="100%" maw={HOME_CONTENT_MAX_WIDTH} mx="auto" mt="xl" pt="sm">
          <HomeSections
            draftDocuments={draftDocuments}
            draftsPending={draftsPending}
            draftsTotal={draftsData?.total}
            pendingReviews={pendingReviews}
            reviewsPending={reviewsPending}
            reviewsTotal={reviewsData?.totalPendingForReview}
            hasReviewRights={hasReviewRights}
          />
        </Box>
      </Stack>
    </Container>
  );
}
