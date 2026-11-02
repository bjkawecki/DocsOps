import { Box, Collapse, Text, UnstyledButton } from '@mantine/core';
import { IconAlertCircle, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState, type MouseEvent, type ReactNode } from 'react';
import {
  readSidebarSectionOpen,
  writeSidebarSectionOpen,
} from '../contextWorkspace/contextPaths.js';

const chromePanelStyle = {
  border: '1px solid var(--mantine-color-default-border)',
  borderRadius: 'var(--mantine-radius-md)',
  padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
  /* Same surface as document card – avoid recessed body-only panels in dark. */
  background: 'var(--mantine-color-default)',
} as const;

type DocumentChromeCollapsiblePanelProps = {
  sectionId: string;
  title: string;
  /** Default open state when no session preference exists. */
  defaultOpen?: boolean;
  /** When true and collapsed, show a red alert icon in the header. */
  attention?: boolean;
  /** Accessible label for the attention icon. */
  attentionLabel?: string;
  /** Optional control before the chevron (e.g. manage link). Stops collapse toggle. */
  headerAside?: ReactNode;
  children: ReactNode;
};

/** Bordered left-chrome panel with session-persisted collapse. */
export function DocumentChromeCollapsiblePanel({
  sectionId,
  title,
  defaultOpen = true,
  attention = false,
  attentionLabel,
  headerAside,
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

  const showAttention = attention && !open;

  return (
    <Box style={chromePanelStyle}>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 4px',
          borderRadius: 'var(--mantine-radius-sm)',
        }}
      >
        <UnstyledButton
          type="button"
          onClick={toggle}
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 1,
            minWidth: 0,
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        >
          <Text fz="xs" fw={600} style={{ textAlign: 'left' }}>
            {title}
          </Text>
          {showAttention ? (
            <IconAlertCircle
              size={14}
              stroke={1.75}
              style={{ flexShrink: 0, color: 'var(--mantine-color-red-6)' }}
              aria-label={attentionLabel}
            />
          ) : null}
          <Box style={{ flex: 1 }} aria-hidden />
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
        {headerAside != null ? (
          <Box
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerAside}
          </Box>
        ) : null}
      </Box>
      <Collapse expanded={open}>
        <Box mt={6}>{children}</Box>
      </Collapse>
    </Box>
  );
}
