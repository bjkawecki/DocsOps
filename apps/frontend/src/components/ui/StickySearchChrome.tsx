import { Drawer, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react';
import type { PageMobileAction } from './PageMobileActionBar.js';
import './StickySearchChrome.css';

export type StickySearchChromeProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Sticky band for wide list toolbars (Catalog). Compact search uses the FAB sheet instead.
 */
export function StickySearchChrome({ children, className }: StickySearchChromeProps) {
  const classes = className
    ? `sticky-search-chrome ${className}`
    : 'sticky-search-chrome';
  return <div className={classes}>{children}</div>;
}

export type UseCompactListSearchFabArgs = {
  /** FAB / drawer accessible name. */
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Drawer title (defaults to `label`). */
  drawerTitle?: string;
  /** Extra controls in the search drawer (e.g. status segmented control). */
  drawerExtra?: ReactNode;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
};

export type UseCompactListSearchFabResult = {
  action: PageMobileAction;
  drawer: ReactNode;
  opened: boolean;
  open: () => void;
  close: () => void;
};

/**
 * Compact list search behind a FAB → bottom sheet (Plan-Mobile-UX §2.5.1).
 * Callers merge `action` into `PageMobileActionBar` / `useRegisterPageMobileExtraActions`.
 */
export function useCompactListSearchFab({
  label,
  placeholder,
  value,
  onChange,
  drawerTitle,
  drawerExtra,
  onKeyDown,
}: UseCompactListSearchFabArgs): UseCompactListSearchFabResult {
  const [opened, { open, close }] = useDisclosure(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const active = value.trim().length > 0;

  useEffect(() => {
    if (!opened) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [opened]);

  const action = useMemo(
    (): PageMobileAction => ({
      key: 'list-search',
      label,
      icon: <IconSearch size={16} stroke={1.5} />,
      tone: active ? 'active' : 'search',
      onClick: open,
    }),
    [active, label, open]
  );

  const drawer = (
    <Drawer
      opened={opened}
      onClose={close}
      title={drawerTitle ?? label}
      position="bottom"
      size="auto"
      padding="md"
    >
      <Stack gap="md">
        <TextInput
          ref={inputRef}
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          size="md"
        />
        {drawerExtra}
      </Stack>
    </Drawer>
  );

  return { action, drawer, opened, open, close };
}

/** Compact count line when search lives in the FAB sheet (no inline field). */
export function CompactListCount({ children }: { children: ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <Text size="xs" c="dimmed">
      {children}
    </Text>
  );
}
