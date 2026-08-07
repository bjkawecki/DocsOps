import { Badge, Box, NavLink, Stack, Text } from '@mantine/core';
import { IconArrowsExchange, IconClipboardCheck } from '@tabler/icons-react';
import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';

export type ApprovalsSidebarDoc = {
  id: string;
  title: string;
  scopeKey: string;
  scopeLabel: string;
};

export type ApprovalsSection = 'reviews' | 'moves';

type ApprovalsScopeSidebarProps = {
  section: ApprovalsSection;
  documents: ApprovalsSidebarDoc[];
  reviewsCount: number;
  movesCount: number;
};

const ICON_SIZE = 16;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

const nestedListStyle: CSSProperties = {
  borderLeft: '1px solid var(--mantine-color-default-border)',
  marginLeft: 14,
  paddingLeft: 8,
  marginTop: 4,
};

function countBadge(count: number) {
  if (count <= 0) return undefined;
  return (
    <Badge size="sm" variant="light" color="yellow">
      {count}
    </Badge>
  );
}

/** Left chrome for Approvals: Reviews | Move requests stacked; review docs nested when active. */
export function ApprovalsScopeSidebar({
  section,
  documents,
  reviewsCount,
  movesCount,
}: ApprovalsScopeSidebarProps) {
  const { t } = useTranslation('approvals');
  const scopeGroups = useMemo(() => {
    const map = new Map<string, { label: string; docs: ApprovalsSidebarDoc[] }>();
    for (const doc of documents) {
      const existing = map.get(doc.scopeKey);
      if (existing) {
        existing.docs.push(doc);
      } else {
        map.set(doc.scopeKey, { label: doc.scopeLabel, docs: [doc] });
      }
    }
    return [...map.entries()]
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [documents]);

  return (
    <ContentCardWrapper fullHeight={false}>
      <Stack gap={4} component="nav" align="stretch" w="100%" aria-label={t('nav.ariaLabel')}>
        <NavLink
          component={Link}
          to="/approvals"
          label={t('nav.reviews')}
          leftSection={<IconClipboardCheck size={ICON_SIZE} stroke={1.5} />}
          rightSection={countBadge(reviewsCount)}
          active={section === 'reviews'}
          variant="subtle"
          style={navLinkFullWidth}
        />
        {section === 'reviews' && scopeGroups.length > 0 ? (
          <Box style={nestedListStyle}>
            <Stack gap={6} align="stretch" w="100%">
              {scopeGroups.map((group) => (
                <Box key={group.key}>
                  <Text size="xs" c="dimmed" fw={600} px={8} mb={4} truncate>
                    {group.label}
                  </Text>
                  <Stack gap={2} align="stretch" w="100%">
                    {group.docs.map((d) => (
                      <NavLink
                        key={d.id}
                        component={Link}
                        to={`/documents/${d.id}?mode=edit&tab=draft`}
                        label={d.title}
                        variant="subtle"
                        style={navLinkFullWidth}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : null}

        <NavLink
          component={Link}
          to="/approvals?tab=moves"
          label={t('nav.moveRequests')}
          leftSection={<IconArrowsExchange size={ICON_SIZE} stroke={1.5} />}
          rightSection={countBadge(movesCount)}
          active={section === 'moves'}
          variant="subtle"
          style={navLinkFullWidth}
        />
      </Stack>
    </ContentCardWrapper>
  );
}

/** @deprecated use ApprovalsSidebarDoc */
export type ReviewsSidebarDoc = ApprovalsSidebarDoc;
