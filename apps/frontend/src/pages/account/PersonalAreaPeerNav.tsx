import { Badge, Box, Collapse, NavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconInbox, IconShare } from '@tabler/icons-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMe } from '../../hooks/useMe.js';
import { useMeMoveRequests } from '../../hooks/useMeMoveRequests.js';
import { useMeReviews } from '../../hooks/useMeReviews.js';
import {
  readSidebarSectionOpen,
  writeSidebarSectionOpen,
} from '../contextWorkspace/contextPaths.js';

const ICON_SIZE = 16;
const FREIGABEN_SECTION_ID = 'personal-approvals';

export const PERSONAL_APPROVALS_PATH = '/personal/approvals';
export const PERSONAL_SHARED_PATH = '/personal/shared';

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

const nestedListStyle: React.CSSProperties = {
  borderLeft: '1px solid var(--mantine-color-default-border)',
  marginLeft: 14,
  paddingLeft: 8,
  marginTop: 4,
};

const peerHeaderButtonStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  borderRadius: 'var(--mantine-radius-sm)',
};

function countBadge(count: number | undefined) {
  if (count == null || count <= 0) return undefined;
  return (
    <Badge size="sm" variant="light" color="yellow">
      {count}
    </Badge>
  );
}

function isApprovalsPath(pathname: string): boolean {
  return (
    pathname.startsWith(PERSONAL_APPROVALS_PATH) ||
    pathname.startsWith('/approvals') ||
    pathname.startsWith('/reviews')
  );
}

function isSharedPath(pathname: string): boolean {
  return (
    pathname.startsWith(PERSONAL_SHARED_PATH) ||
    pathname === '/shared' ||
    pathname.startsWith('/shared/')
  );
}

export type PersonalAreaPeerNavProps = {
  /** Nested under Prüfungen (e.g. review documents by scope). */
  reviewsNested?: ReactNode;
  reviewsCount?: number;
  movesCount?: number;
  sharedCount?: number;
  /** Accessible name for the strip. */
  ariaLabel?: string;
};

/**
 * Personal-area content extras: Offene Vorgänge (Prüfungen / Verschiebeanfragen)
 * + Geteilte Dokumente. No „Persönlich“ row – main-nav / breadcrumb only.
 */
export function PersonalAreaPeerNav({
  reviewsNested,
  reviewsCount,
  movesCount,
  sharedCount,
  ariaLabel,
}: PersonalAreaPeerNavProps) {
  const { t } = useTranslation(['shell', 'approvals']);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { data: me } = useMe();

  const isAdmin = me?.user?.isAdmin === true;
  const hasReviewRights =
    (me?.identity?.companyLeads?.length ?? 0) > 0 ||
    (me?.identity?.departmentLeads?.length ?? 0) > 0 ||
    (me?.identity?.teams?.some((team) => team.role === 'leader') ?? false);

  const { data: reviewsData } = useMeReviews(
    { limit: 1, offset: 0 },
    { enabled: hasReviewRights && !isAdmin && reviewsCount == null }
  );
  const { data: inboundMovesData } = useMeMoveRequests(
    { direction: 'inbound', status: 'pending', limit: 1 },
    { enabled: !!me?.identity && !isAdmin }
  );
  const { data: outboundMovesData } = useMeMoveRequests(
    { direction: 'outbound', status: 'pending', limit: 1 },
    { enabled: !!me?.identity && !isAdmin }
  );

  const inboundPending = inboundMovesData?.total ?? 0;
  const outboundPending = outboundMovesData?.total ?? 0;
  const showApprovals =
    reviewsCount != null ||
    movesCount != null ||
    (!isAdmin && (hasReviewRights || inboundPending > 0 || outboundPending > 0));

  const resolvedReviewsCount = reviewsCount ?? reviewsData?.totalPendingForReview ?? 0;
  const resolvedMovesCount = movesCount ?? inboundPending;

  const onApprovals = isApprovalsPath(pathname);
  const tab = searchParams.get('tab');
  const reviewsActive = onApprovals && tab !== 'moves';
  const movesActive = onApprovals && tab === 'moves';
  const sharedActive = isSharedPath(pathname);

  const [freigabenOpen, setFreigabenOpen] = useState(() =>
    readSidebarSectionOpen(FREIGABEN_SECTION_ID, true)
  );

  useEffect(() => {
    if (!onApprovals) return;
    setFreigabenOpen(true);
    writeSidebarSectionOpen(FREIGABEN_SECTION_ID, true);
  }, [onApprovals]);

  if (!showApprovals) {
    return (
      <NavLink
        component={Link}
        to={PERSONAL_SHARED_PATH}
        label={t('shell:nav.shared')}
        leftSection={<IconShare size={ICON_SIZE} stroke={1.5} />}
        rightSection={countBadge(sharedCount)}
        active={sharedActive}
        style={navLinkFullWidth}
      />
    );
  }

  return (
    <Stack gap="md" align="stretch" w="100%" aria-label={ariaLabel ?? t('shell:nav.approvals')}>
      <Box>
        <UnstyledButton
          onClick={() => {
            setFreigabenOpen((open) => {
              const next = !open;
              writeSidebarSectionOpen(FREIGABEN_SECTION_ID, next);
              return next;
            });
          }}
          style={peerHeaderButtonStyle}
          aria-expanded={freigabenOpen}
          className="context-sidebar-peer-header"
        >
          <IconInbox size={ICON_SIZE} stroke={1.5} />
          <Text size="sm" c="dimmed" fw={600} truncate style={{ flex: 1, textAlign: 'left' }}>
            {t('shell:nav.approvals')}
          </Text>
          {freigabenOpen ? (
            <IconChevronDown size={14} style={{ flexShrink: 0 }} aria-hidden />
          ) : (
            <IconChevronRight size={14} style={{ flexShrink: 0 }} aria-hidden />
          )}
        </UnstyledButton>
        <Collapse expanded={freigabenOpen}>
          <Box style={nestedListStyle}>
            <Stack gap={4} align="stretch" w="100%">
              <NavLink
                component={Link}
                to={PERSONAL_APPROVALS_PATH}
                label={t('approvals:nav.reviews')}
                rightSection={countBadge(resolvedReviewsCount)}
                active={reviewsActive}
                style={navLinkFullWidth}
              />
              {reviewsActive && reviewsNested ? <Box>{reviewsNested}</Box> : null}
              <NavLink
                component={Link}
                to={`${PERSONAL_APPROVALS_PATH}?tab=moves`}
                label={t('approvals:nav.moveRequests')}
                rightSection={countBadge(resolvedMovesCount)}
                active={movesActive}
                style={navLinkFullWidth}
              />
            </Stack>
          </Box>
        </Collapse>
      </Box>

      <NavLink
        component={Link}
        to={PERSONAL_SHARED_PATH}
        label={t('shell:nav.shared')}
        leftSection={<IconShare size={ICON_SIZE} stroke={1.5} />}
        rightSection={countBadge(sharedCount)}
        active={sharedActive}
        style={navLinkFullWidth}
      />
    </Stack>
  );
}
