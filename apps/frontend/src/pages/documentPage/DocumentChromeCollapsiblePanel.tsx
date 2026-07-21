import { Box, Collapse, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState, type MouseEvent, type ReactNode } from 'react';
import {
  readSidebarSectionOpen,
  writeSidebarSectionOpen,
} from '../contextWorkspace/contextPaths.js';

const chromePanelStyle = {
  border: '1px solid var(--mantine-color-default-border)',
  borderRadius: 'var(--mantine-radius-md)',
  padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
} as const;

type DocumentChromeCollapsiblePanelProps = {
  sectionId: string;
  title: string;
  /** Default open state when no session preference exists. */
  defaultOpen?: boolean;
  children: ReactNode;
};

/** Bordered left-chrome panel with session-persisted collapse. */
export function DocumentChromeCollapsiblePanel({
  sectionId,
  title,
  defaultOpen = true,
  children,
}: DocumentChromeCollapsiblePanelProps) {
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
    <Box style={chromePanelStyle}>
      <UnstyledButton
        type="button"
        onClick={toggle}
        aria-expanded={open}
        w="100%"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 4px',
          borderRadius: 'var(--mantine-radius-sm)',
        }}
      >
        <Text fz="xs" fw={600} c="dimmed" style={{ flex: 1, textAlign: 'left' }}>
          {title}
        </Text>
        {open ? (
          <IconChevronDown
            size={14}
            style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }}
            aria-hidden
          />
        ) : (
          <IconChevronRight
            size={14}
            style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }}
            aria-hidden
          />
        )}
      </UnstyledButton>
      <Collapse in={open}>
        <Box mt={6}>{children}</Box>
      </Collapse>
    </Box>
  );
}
