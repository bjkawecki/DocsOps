import { Box, Collapse, NavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronRight, IconPencil, IconShare } from '@tabler/icons-react';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import {
  readSidebarSectionOpen,
  writeSidebarSectionOpen,
} from '../contextWorkspace/contextPaths.js';
import { ContextWorkspaceLeftColumn } from '../contextWorkspace/contextWorkspaceChrome.js';

export type SharedSidebarDoc = {
  id: string;
  title: string;
  scopeKey: string;
  scopeLabel: string;
};

export type SharedSidebarDraft = {
  id: string;
  title: string;
};

type SharedScopeSidebarProps = {
  documents: SharedSidebarDoc[];
  drafts: SharedSidebarDraft[];
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

const peerHeaderButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  borderRadius: 'var(--mantine-radius-sm)',
};

function PeerCollapsibleSection({
  sectionId,
  label,
  icon,
  defaultOpen = true,
  children,
}: {
  sectionId: string;
  label: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => readSidebarSectionOpen(sectionId, defaultOpen));
  const toggle = () => {
    setOpen((o) => {
      const next = !o;
      writeSidebarSectionOpen(sectionId, next);
      return next;
    });
  };
  return (
    <Box>
      <UnstyledButton
        type="button"
        onClick={toggle}
        style={peerHeaderButtonStyle}
        aria-expanded={open}
        className="context-sidebar-peer-header"
      >
        {icon}
        <Text size="sm" c="dimmed" fw={600} truncate style={{ flex: 1, textAlign: 'left' }}>
          {label}
        </Text>
        {open ? (
          <IconChevronDown size={14} style={{ flexShrink: 0 }} aria-hidden />
        ) : (
          <IconChevronRight size={14} style={{ flexShrink: 0 }} aria-hidden />
        )}
      </UnstyledButton>
      <Collapse in={open}>
        <Box style={nestedListStyle}>
          <Stack gap={6} align="stretch" w="100%">
            {children}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

/** Left chrome for Shared: scopes with nested shared docs, then Drafts. */
export function SharedScopeSidebar({ documents, drafts }: SharedScopeSidebarProps) {
  const scopeGroups = useMemo(() => {
    const map = new Map<string, { label: string; docs: SharedSidebarDoc[] }>();
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
        <Stack gap="md" component="nav" align="stretch" w="100%" aria-label="Shared navigation">
          {scopeGroups.length === 0 ? (
            <Text size="sm" c="dimmed" px="xs">
              No shared documents yet.
            </Text>
          ) : (
            scopeGroups.map((group) => (
              <PeerCollapsibleSection
                key={group.key}
                sectionId={`shared-scope:${group.key}`}
                label={group.label}
                icon={<IconShare size={ICON_SIZE} stroke={1.5} />}
                defaultOpen
              >
                {group.docs.map((d) => (
                  <NavLink
                    key={d.id}
                    component={Link}
                    to={`/documents/${d.id}`}
                    label={d.title}
                    variant="subtle"
                    style={navLinkFullWidth}
                  />
                ))}
              </PeerCollapsibleSection>
            ))
          )}

          {drafts.length > 0 && (
            <PeerCollapsibleSection
              sectionId="shared:drafts"
              label="Drafts"
              icon={<IconPencil size={ICON_SIZE} stroke={1.5} />}
              defaultOpen={false}
            >
              {drafts.map((d) => (
                <NavLink
                  key={d.id}
                  component={Link}
                  to={`/documents/${d.id}?mode=edit&tab=draft`}
                  label={d.title}
                  variant="subtle"
                  style={navLinkFullWidth}
                />
              ))}
            </PeerCollapsibleSection>
          )}
        </Stack>
      </ContentCardWrapper>
    </ContextWorkspaceLeftColumn>
  );
}
