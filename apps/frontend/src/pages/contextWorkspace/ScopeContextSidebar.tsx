import { Box, Collapse, NavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import {
  IconArchive,
  IconBriefcase,
  IconChevronDown,
  IconChevronRight,
  IconRoute,
  IconTrash,
} from '@tabler/icons-react';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import { contextUrl, readSidebarSectionOpen, writeSidebarSectionOpen } from './contextPaths.js';
import { ContextWorkspaceLeftColumn } from './contextWorkspaceChrome.js';

export type SidebarContextItem = {
  /** Context.id for SPA navigation */
  contextId: string;
  name: string;
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
  /** Currently selected context, or `null` when the user cleared the selection. */
  activeContextId: string | null;
  /**
   * Click on a process/project/subcontext row.
   * Same id while selected → deselect; same id while cleared → reselect; other id → navigate (Link).
   */
  onContextNavClick: (contextId: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Lead/admin only: Trash + Archive as peer rows (not under Projects). */
  trashArchive?: SidebarTrashArchiveLinks | null;
};

const ICON_SIZE = 16;

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

/** Nested under Processes/Projects – align with org-nav staircase. */
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

/** Org-nav-style peer section: icon + label (no small caps) + chevron. Open state persists in sessionStorage. */
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

function ProjectNavItem({
  project,
  activeContextId,
  onContextNavClick,
}: {
  project: SidebarProjectItem;
  activeContextId: string | null;
  onContextNavClick: (contextId: string, event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const to = contextUrl(project.contextId);
  const subs = project.subcontexts ?? [];
  const hasSubs = subs.length > 0;
  const childActive = subs.some((s) => activeContextId === s.contextId);
  const sectionId = `project:${project.contextId}`;
  const [expanded, setExpanded] = useState(() => readSidebarSectionOpen(sectionId, childActive));

  useEffect(() => {
    if (!childActive) return;
    setExpanded(true);
    writeSidebarSectionOpen(sectionId, true);
  }, [childActive, sectionId]);

  if (!hasSubs) {
    return (
      <NavLink
        component={Link}
        to={to}
        label={project.name}
        active={activeContextId === project.contextId}
        variant="subtle"
        style={navLinkFullWidth}
        onClick={(e) => onContextNavClick(project.contextId, e)}
      />
    );
  }

  const toggleSubs = () => {
    setExpanded((e) => {
      const next = !e;
      writeSidebarSectionOpen(sectionId, next);
      return next;
    });
  };

  return (
    <Stack gap={6} align="stretch" w="100%">
      <Box style={{ display: 'flex', alignItems: 'stretch', gap: 0, width: '100%' }}>
        <NavLink
          component={Link}
          to={to}
          label={project.name}
          active={activeContextId === project.contextId}
          variant="subtle"
          style={{ ...navLinkFullWidth, flex: 1, minWidth: 0 }}
          onClick={(e) => onContextNavClick(project.contextId, e)}
        />
        <UnstyledButton
          onClick={toggleSubs}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse subcontexts' : 'Expand subcontexts'}
          className="context-sidebar-peer-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
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
            borderLeft: '1px solid var(--mantine-color-default-border)',
            marginLeft: 10,
            paddingLeft: 8,
          }}
        >
          <Stack gap={6} align="stretch" w="100%">
            {subs.map((sub) => {
              const subTo = contextUrl(sub.contextId);
              return (
                <NavLink
                  key={sub.contextId}
                  component={Link}
                  to={subTo}
                  label={sub.name}
                  active={activeContextId === sub.contextId}
                  variant="subtle"
                  style={navLinkFullWidth}
                  onClick={(e) => onContextNavClick(sub.contextId, e)}
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
  onContextNavClick,
  trashArchive = null,
}: ScopeContextSidebarProps) {
  const { pathname } = useLocation();

  return (
    <ContextWorkspaceLeftColumn data-context-sibling-nav>
      <ContentCardWrapper fullHeight={false}>
        <Stack gap="md" component="nav" align="stretch" w="100%">
          <PeerCollapsibleSection
            sectionId="processes"
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
                    active={activeContextId === p.contextId}
                    variant="subtle"
                    style={navLinkFullWidth}
                    onClick={(e) => onContextNavClick(p.contextId, e)}
                  />
                );
              })
            )}
          </PeerCollapsibleSection>

          <PeerCollapsibleSection
            sectionId="projects"
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
                  onContextNavClick={onContextNavClick}
                />
              ))
            )}
          </PeerCollapsibleSection>

          {trashArchive != null && (
            <Stack gap={6} align="stretch" w="100%">
              <NavLink
                component={Link}
                to={trashArchive.trashTo}
                label="Trash"
                leftSection={<IconTrash size={ICON_SIZE} stroke={1.5} />}
                active={pathname === trashArchive.trashTo}
                variant="subtle"
                style={navLinkFullWidth}
              />
              <NavLink
                component={Link}
                to={trashArchive.archiveTo}
                label="Archive"
                leftSection={<IconArchive size={ICON_SIZE} stroke={1.5} />}
                active={pathname === trashArchive.archiveTo}
                variant="subtle"
                style={navLinkFullWidth}
              />
            </Stack>
          )}

          {drafts != null && drafts.length > 0 && (
            <PeerCollapsibleSection sectionId="drafts" label="Drafts" defaultOpen={false}>
              {drafts.map((d) => (
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
          )}
        </Stack>
      </ContentCardWrapper>
    </ContextWorkspaceLeftColumn>
  );
}
