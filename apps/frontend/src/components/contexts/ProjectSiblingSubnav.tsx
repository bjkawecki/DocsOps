import { Box, NavLink, Stack } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { ContentCardWrapper } from './cardShared';
import { SectionLabel } from '../ui/SectionLabel';

export type SiblingWithSubcontexts = {
  id: string;
  name: string;
  subcontexts?: { id: string; name: string }[];
};

export interface ProjectSiblingSubnavProps {
  /** `process` = flat list to `/processes/:id`; `project` = projects with optional nested subcontext links. */
  variant: 'process' | 'project';
  siblings: SiblingWithSubcontexts[];
}

function projectPath(projectId: string) {
  return `/projects/${projectId}`;
}

function subcontextPath(projectId: string, subcontextId: string) {
  return `/projects/${projectId}/subcontexts/${subcontextId}`;
}

const navLinkFullWidth = {
  borderRadius: 'var(--mantine-radius-sm)',
  width: '100%',
} as const;

export function ProjectSiblingSubnav({ variant, siblings }: ProjectSiblingSubnavProps) {
  const { pathname } = useLocation();
  const sectionLabel = variant === 'process' ? 'All Processes' : 'All Projects';

  return (
    <Box w={{ base: '100%', lg: 280 }} style={{ flexShrink: 0 }} data-context-sibling-nav>
      <ContentCardWrapper fullHeight={false}>
        <SectionLabel mb="sm">{sectionLabel}</SectionLabel>
        <Stack component="nav" gap={2} align="stretch" w="100%">
          {siblings.map((sibling) => {
            if (variant === 'process') {
              const to = `/processes/${sibling.id}`;
              return (
                <NavLink
                  key={sibling.id}
                  component={Link}
                  to={to}
                  label={sibling.name}
                  active={pathname === to}
                  variant="light"
                  style={navLinkFullWidth}
                />
              );
            }

            const base = projectPath(sibling.id);
            const subs = sibling.subcontexts ?? [];

            return (
              <Stack key={sibling.id} gap={2} align="stretch" w="100%">
                <NavLink
                  component={Link}
                  to={base}
                  label={sibling.name}
                  active={pathname === base}
                  variant="light"
                  style={navLinkFullWidth}
                />
                {subs.length > 0 && (
                  <Box
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '100%',
                      paddingLeft: 'var(--mantine-spacing-sm)',
                      borderLeft: '2px solid var(--mantine-color-default-border)',
                    }}
                  >
                    <Stack gap={2} align="stretch" w="100%">
                      {subs.map((sub) => {
                        const subTo = subcontextPath(sibling.id, sub.id);
                        return (
                          <NavLink
                            key={sub.id}
                            component={Link}
                            to={subTo}
                            label={sub.name}
                            active={pathname === subTo}
                            variant="light"
                            style={navLinkFullWidth}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                )}
              </Stack>
            );
          })}
        </Stack>
      </ContentCardWrapper>
    </Box>
  );
}
