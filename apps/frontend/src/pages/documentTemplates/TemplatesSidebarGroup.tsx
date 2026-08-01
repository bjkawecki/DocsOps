import { Box, Collapse, Stack, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import {
  readSidebarSectionOpen,
  writeSidebarSectionOpen,
} from '../contextWorkspace/contextPaths.js';

const headerStyle: CSSProperties = {
  width: '100%',
  minHeight: 28,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 4px',
  borderRadius: 'var(--mantine-radius-sm)',
};

type Props = {
  sectionId: string;
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/** Collapsible group for content-sidebar type lists (session-persisted). */
export function TemplatesSidebarGroup({ sectionId, label, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(() => readSidebarSectionOpen(sectionId, defaultOpen));

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
        aria-expanded={open}
        className="context-sidebar-peer-header"
        style={headerStyle}
      >
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
        <Stack gap={2} align="stretch" w="100%" mt={2}>
          {children}
        </Stack>
      </Collapse>
    </Box>
  );
}
