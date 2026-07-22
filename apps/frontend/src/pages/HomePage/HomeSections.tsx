import { Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconClipboardCheck, IconPencil } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { SectionLabel } from '../../components/ui/SectionLabel.js';
import type { DraftDocumentItem } from '../../hooks/useMeDrafts.js';
import type { ReviewPendingSuggestionsItem } from '../../hooks/useMeReviews.js';
import { HomeScopeSuffix } from './HomeScopeSuffix.js';
import { HomeNotificationUnreadSection } from './HomeNotificationUnreadSection.js';
import { SCOPE_ICON_SIZE } from './homePageConstants.js';

export type HomeSectionsProps = {
  draftDocuments: DraftDocumentItem[];
  draftsPending: boolean;
  draftsTotal: number | undefined;
  pendingReviews: ReviewPendingSuggestionsItem[];
  reviewsPending: boolean;
  reviewsTotal: number | undefined;
  hasReviewRights: boolean;
};

export function HomeSections({
  draftDocuments,
  draftsPending,
  draftsTotal,
  pendingReviews,
  reviewsPending,
  reviewsTotal,
  hasReviewRights,
}: HomeSectionsProps) {
  const isMdUp = useMediaQuery('(min-width: 62em)');
  const showDrafts = draftsPending || draftDocuments.length > 0;
  const showReviews = hasReviewRights && (reviewsPending || pendingReviews.length > 0);
  const hasLeftColumn = showDrafts || showReviews;

  const draftsBlock = showDrafts ? (
    <Stack gap="xs" align="stretch">
      <SectionLabel mb={0}>
        Your drafts
        {draftsTotal != null && draftsTotal > 0 ? ` · ${draftsTotal}` : ''}
      </SectionLabel>
      {draftsPending ? (
        <Loader size="sm" />
      ) : (
        <Stack gap={6} align="stretch">
          {draftDocuments.map((d) => (
            <Group key={d.id} gap="xs" wrap="nowrap">
              <IconPencil size={SCOPE_ICON_SIZE} style={{ flexShrink: 0 }} aria-hidden />
              <Text
                component={Link}
                to={`/documents/${d.id}`}
                size="sm"
                title={d.title || d.id}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                  textDecoration: 'none',
                  color: 'var(--mantine-color-anchor)',
                }}
              >
                {d.title || d.id}
              </Text>
              <HomeScopeSuffix scopeType={d.scopeType} scopeName={d.scopeName} />
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  ) : null;

  const reviewsBlock = showReviews ? (
    <Stack gap="xs" align="stretch">
      <SectionLabel mb={0}>
        Needs review
        {reviewsTotal != null && reviewsTotal > 0 ? ` · ${reviewsTotal}` : ''}
      </SectionLabel>
      {reviewsPending ? (
        <Loader size="sm" />
      ) : (
        <Stack gap={6} align="stretch">
          {pendingReviews.map((item) => (
            <Group key={item.documentId} gap="xs" wrap="nowrap">
              <IconClipboardCheck size={SCOPE_ICON_SIZE} style={{ flexShrink: 0 }} aria-hidden />
              <Text
                component={Link}
                to={`/documents/${item.documentId}?mode=edit&tab=draft`}
                size="sm"
                title={item.documentTitle || item.documentId}
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                  textDecoration: 'none',
                  color: 'var(--mantine-color-anchor)',
                }}
              >
                {item.documentTitle || item.documentId}
              </Text>
              <HomeScopeSuffix scopeType={item.scopeType} scopeName={item.scopeName} />
            </Group>
          ))}
        </Stack>
      )}
    </Stack>
  ) : null;

  const updatesSection = (
    <HomeNotificationUnreadSection
      title="Updates"
      category="documents"
      inboxHref="/notifications?category=documents&unreadOnly=true"
      emptyMessage="You're all caught up."
    />
  );

  const commentsSection = (
    <HomeNotificationUnreadSection
      title="Comments"
      category="comments"
      inboxHref="/notifications?category=comments&unreadOnly=true"
      emptyMessage="No new comments."
    />
  );

  const attentionColumn = (
    <Stack gap="xl" align="stretch">
      {updatesSection}
      {commentsSection}
    </Stack>
  );

  if (isMdUp) {
    if (!hasLeftColumn) {
      return attentionColumn;
    }
    return (
      <SimpleGrid cols={2} spacing="xl">
        <Stack gap="xl" align="stretch">
          {draftsBlock}
          {reviewsBlock}
        </Stack>
        {attentionColumn}
      </SimpleGrid>
    );
  }

  return (
    <Stack gap="xl" align="stretch">
      {updatesSection}
      {commentsSection}
      {draftsBlock}
      {reviewsBlock}
    </Stack>
  );
}
