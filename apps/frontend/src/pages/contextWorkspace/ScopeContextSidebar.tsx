import { Box, Collapse, NavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  IconArchive,
  IconBriefcase,
  IconChevronDown,
  IconChevronRight,
  IconRoute,
  IconTrash,
} from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import { contextUrl } from './contextPaths.js';

export type SidebarContextItem = {
  /** Context.id for SPA navigation */
  contextId: string;
  name: string;
  documentCount: number;
};

export type SidebarProjectItem = SidebarContextItem & {
  subcontexts?: SidebarContextItem[];
};

export type SidebarDraftItem = {
  id: string;
  title: string;
};

export type SidebarTrashArchiveLinks = {
  trashTo: string;
  archiveTo: string;
};

type ScopeContextSidebarProps = {
  processes: SidebarContextItem[];
  projects: SidebarProjectItem[];
  drafts?: SidebarDraftItem[];
  activeContextId: string;
  /** Lead/admin only: Trash + Archive as peer rows (not under Projects). */
  trashArchive?: SidebarTrashArchiveLinks | null;
};

const ICON_SIZE = 16;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

const peerHeaderButtonStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 'var(--mantine-nav-link-height, 28px)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '2px 6px',
  borderRadius: 'var(--mantine-radius-sm)',
};

function DocumentCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Text size="xs" c="var(--mantine-primary-color-filled)" component="span">
      {count}
    </Text>
  );
}

/** Org-nav-style peer section: icon + label (no small caps) + chevron. */
function PeerCollapsibleSection({
  label,
  icon,
  defaultOpen = true,
  children,
}: {
  label: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box>
      <UnstyledButton
        onClick={() => setOpen((o) => !o)}
        style={peerHeaderButtonStyle}
        aria-expanded={open}
      >
        {icon}
        <Text size="xs" c="dimmed" fw={600} truncate style={{ flex: 1, textAlign: 'left' }}>
          {label}
        </Text>
        {open ? (
          <IconChevronDown size={14} style={{ flexShrink: 0 }} aria-hidden />
        ) : (
          <IconChevronRight size={14} style={{ flexShrink: 0 }} aria-hidden />
        )}
      </UnstyledButton>
      <Collapse in={open}>
        <Stack gap={4} align="stretch" w="100%" mt={4} pl={4}>
          {children}
        </Stack>
      </Collapse>
    </Box>
  );
}

function ProjectNavItem({
  project,
  activeContextId,
  pathname,
}: {
  project: SidebarProjectItem;
  activeContextId: string;
  pathname: string;
}) {
  const to = contextUrl(project.contextId);
  const subs = project.subcontexts ?? [];
  const hasSubs = subs.length > 0;
  const childActive = subs.some(
    (s) => pathname === contextUrl(s.contextId) || activeContextId === s.contextId
  );
  const [expanded, setExpanded] = useState(childActive || pathname === to);

  if (!hasSubs) {
    return (
      <NavLink
        component={Link}
        to={to}
        label={project.name}
        active={pathname === to || activeContextId === project.contextId}
        variant="light"
        style={navLinkFullWidth}
        rightSection={<DocumentCountBadge count={project.documentCount} />}
      />
    );
  }

  return (
    <Stack gap={4} align="stretch" w="100%">
      <Box style={{ display: 'flex', alignItems: 'stretch', gap: 0, width: '100%' }}>
        <NavLink
          component={Link}
          to={to}
          label={project.name}
          active={pathname === to || activeContextId === project.contextId}
          variant="light"
          style={{ ...navLinkFullWidth, flex: 1, minWidth: 0 }}
        />
        <UnstyledButton
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse subcontexts' : 'Expand subcontexts'}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 6px',
            flexShrink: 0,
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          {expanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
        </UnstyledButton>
      </Box>
      <Collapse in={expanded}>
        <Box
          style={{
            paddingLeft: 'var(--mantine-spacing-sm)',
            borderLeft: '2px solid var(--mantine-color-default-border)',
          }}
        >
          <Stack gap={4} align="stretch" w="100%">
            {subs.map((sub) => {
              const subTo = contextUrl(sub.contextId);
              return (
                <NavLink
                  key={sub.contextId}
                  component={Link}
                  to={subTo}
                  label={sub.name}
                  active={pathname === subTo || activeContextId === sub.contextId}
                  variant="light"
                  style={navLinkFullWidth}
                  rightSection={<DocumentCountBadge count={sub.documentCount} />}
                />
              );
            })}
          </Stack>
        </Box>
      </Collapse>
    </Stack>
  );
}

export function ScopeContextSidebar({
  processes,
  projects,
  drafts,
  activeContextId,
  trashArchive = null,
}: ScopeContextSidebarProps) {
  const { pathname } = useLocation();

  return (
    <Box w={{ base: '100%', lg: 280 }} style={{ flexShrink: 0 }} data-context-sibling-nav>
      <ContentCardWrapper fullHeight={false}>
        <Stack gap="sm" component="nav" align="stretch" w="100%">
          <PeerCollapsibleSection
            label="Processes"
            icon={<IconRoute size={ICON_SIZE} stroke={1.5} />}
            defaultOpen
          >
            {processes.length === 0 ? (
              <Text size="sm" c="dimmed" px="xs">
                No processes yet.
              </Text>
            ) : (
              processes.map((p) => {
                const to = contextUrl(p.contextId);
                return (
                  <NavLink
                    key={p.contextId}
                    component={Link}
                    to={to}
                    label={p.name}
                    active={pathname === to || activeContextId === p.contextId}
                    variant="light"
                    style={navLinkFullWidth}
                    rightSection={<DocumentCountBadge count={p.documentCount} />}
                  />
                );
              })
            )}
          </PeerCollapsibleSection>

          <PeerCollapsibleSection
            label="Projects"
            icon={<IconBriefcase size={ICON_SIZE} stroke={1.5} />}
            defaultOpen
          >
            {projects.length === 0 ? (
              <Text size="sm" c="dimmed" px="xs">
                No projects yet.
              </Text>
            ) : (
              projects.map((project) => (
                <ProjectNavItem
                  key={project.contextId}
                  project={project}
                  activeContextId={activeContextId}
                  pathname={pathname}
                />
              ))
            )}
          </PeerCollapsibleSection>

          {trashArchive != null && (
            <Stack gap={4} align="stretch" w="100%">
              <NavLink
                component={Link}
                to={trashArchive.trashTo}
                label="Trash"
                leftSection={<IconTrash size={ICON_SIZE} stroke={1.5} />}
                active={pathname === trashArchive.trashTo}
                variant="light"
                style={navLinkFullWidth}
              />
              <NavLink
                component={Link}
                to={trashArchive.archiveTo}
                label="Archive"
                leftSection={<IconArchive size={ICON_SIZE} stroke={1.5} />}
                active={pathname === trashArchive.archiveTo}
                variant="light"
                style={navLinkFullWidth}
              />
            </Stack>
          )}

          {drafts != null && drafts.length > 0 && (
            <PeerCollapsibleSection label="Drafts" defaultOpen={false}>
              {drafts.map((d) => (
                <NavLink
                  key={d.id}
                  component={Link}
                  to={`/documents/${d.id}`}
                  label={d.title}
                  variant="light"
                  style={navLinkFullWidth}
                />
              ))}
            </PeerCollapsibleSection>
          )}
        </Stack>
      </ContentCardWrapper>
    </Box>
  );
}
