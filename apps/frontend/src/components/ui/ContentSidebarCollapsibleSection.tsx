import { Box, Collapse, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import {
  readSidebarSectionOpen,
  writeSidebarSectionOpen,
} from '../../pages/contextWorkspace/contextPaths.js';

const peerHeaderButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: 32,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px',
  borderRadius: 'var(--mantine-radius-sm)',
};

const nestedListStyle: CSSProperties = {
  borderLeft: '1px solid var(--mantine-color-default-border)',
  marginLeft: 14,
  paddingLeft: 8,
  marginTop: 4,
};

type Props = {
  sectionId: string;
  label: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  /** When true, opens the section (e.g. active route lives inside). */
  forceOpenWhen?: boolean;
  children: ReactNode;
};

/**
 * Content-sidebar peer section (Processes/Projects style): label + chevron,
 * nested list, open state in sessionStorage.
 */
export function ContentSidebarCollapsibleSection({
  sectionId,
  label,
  icon,
  defaultOpen = true,
  forceOpenWhen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(() => readSidebarSectionOpen(sectionId, defaultOpen));

  useEffect(() => {
    if (!forceOpenWhen) return;
    setOpen(true);
    writeSidebarSectionOpen(sectionId, true);
  }, [forceOpenWhen, sectionId]);

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
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
        <Text size="sm" fw={600} truncate style={{ flex: 1, textAlign: 'left' }}>
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
          <Stack gap={2} align="stretch" w="100%">
            {children}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
