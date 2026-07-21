import { Box, NavLink, Stack, Text } from '@mantine/core';
import { IconClipboardCheck } from '@tabler/icons-react';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import { ContextWorkspaceLeftColumn } from '../contextWorkspace/contextWorkspaceChrome.js';

export type ReviewsSidebarDoc = {
  id: string;
  title: string;
  scopeKey: string;
  scopeLabel: string;
};

type ReviewsScopeSidebarProps = {
  documents: ReviewsSidebarDoc[];
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

const peerHeaderStyle: CSSProperties = {
  width: '100%',
  minHeight: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  borderRadius: 'var(--mantine-radius-sm)',
};

function PeerSection({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box>
      <Box style={peerHeaderStyle} className="context-sidebar-peer-header">
        {icon}
        <Text size="sm" c="dimmed" fw={600} truncate style={{ flex: 1, textAlign: 'left' }}>
          {label}
        </Text>
      </Box>
      <Box style={nestedListStyle}>
        <Stack gap={6} align="stretch" w="100%">
          {children}
        </Stack>
      </Box>
    </Box>
  );
}

/** Left chrome for Reviews: scopes with nested documents pending review (always expanded). */
export function ReviewsScopeSidebar({ documents }: ReviewsScopeSidebarProps) {
  const scopeGroups = useMemo(() => {
    const map = new Map<string, { label: string; docs: ReviewsSidebarDoc[] }>();
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
    <ContextWorkspaceLeftColumn data-context-sibling-nav>
      <ContentCardWrapper fullHeight={false}>
        <Stack gap="md" component="nav" align="stretch" w="100%" aria-label="Reviews navigation">
          {scopeGroups.length === 0 ? (
            <PeerSection
              label="Pending review"
              icon={<IconClipboardCheck size={ICON_SIZE} stroke={1.5} />}
            />
          ) : (
            scopeGroups.map((group) => (
              <PeerSection
                key={group.key}
                label={group.label}
                icon={<IconClipboardCheck size={ICON_SIZE} stroke={1.5} />}
              >
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
              </PeerSection>
            ))
          )}
        </Stack>
      </ContentCardWrapper>
    </ContextWorkspaceLeftColumn>
  );
}
