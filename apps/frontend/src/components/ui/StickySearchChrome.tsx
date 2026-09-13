import { ActionIcon, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { PageMobileAction } from './PageMobileActionBar.js';
import type { PageMobileFabTone } from './pageMobileFabTokens.js';
import './StickySearchChrome.css';

export type StickySearchChromeProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Sticky band for wide list toolbars (Catalog). Compact search uses the FAB toggle panel.
 */
export function StickySearchChrome({ children, className }: StickySearchChromeProps) {
  const classes = className ? `sticky-search-chrome ${className}` : 'sticky-search-chrome';
  return <div className={classes}>{children}</div>;
}

export type UseCompactFabBottomPanelArgs = {
  /** FAB / panel accessible name. */
  label: string;
  /** Panel body when open. */
  children: ReactNode;
  /** FAB icon. */
  icon: ReactNode;
  /** Stable action key. */
  actionKey: string;
  /** Tone when idle. */
  idleTone: PageMobileFabTone;
  /** Tone when panel open or `active` is true. */
  activeTone?: PageMobileFabTone;
  /** Emphasize FAB (e.g. filters applied / query set). */
  active?: boolean;
  /** Called when the panel opens (e.g. close a sibling panel). */
  onOpen?: () => void;
};

export type UseCompactFabBottomPanelResult = {
  action: PageMobileAction;
  panel: ReactNode;
  opened: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

/**
 * Generic compact FAB → fixed bottom panel toggle (search, filter, …).
 * Second tap on the same FAB closes; list behind stays visible.
 */
export function useCompactFabBottomPanel({
  label,
  children,
  icon,
  actionKey,
  idleTone,
  activeTone = 'active',
  active = false,
  onOpen,
}: UseCompactFabBottomPanelArgs): UseCompactFabBottomPanelResult {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  useEffect(() => {
    if (opened) onOpen?.();
  }, [opened, onOpen]);

  const handleToggle = useCallback(() => {
    toggle();
  }, [toggle]);

  const action = useMemo(
    (): PageMobileAction => ({
      key: actionKey,
      label,
      icon,
      tone: opened || active ? activeTone : idleTone,
      onClick: handleToggle,
    }),
    [actionKey, active, activeTone, handleToggle, icon, idleTone, label, opened]
  );

  const panel = opened ? (
    <div className="compact-fab-bottom-panel" role="dialog" aria-label={label}>
      {children}
    </div>
  ) : null;

  return { action, panel, opened, open, close, toggle };
}

export type UseCompactListSearchFabArgs = {
  /** FAB accessible name. */
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Extra controls in the bottom panel (e.g. status segmented control). */
  panelExtra?: ReactNode;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  /** Clears the query (shows clear control when query non-empty). */
  onClear?: () => void;
  /** Accessible name for the clear control. */
  clearLabel?: string;
  /** Called when the search panel opens. */
  onOpen?: () => void;
};

export type UseCompactListSearchFabResult = {
  action: PageMobileAction;
  /** Fixed bottom search panel (render next to the list). */
  panel: ReactNode;
  opened: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

/**
 * Compact list search: FAB toggles a bottom panel over the list (Plan-Mobile-UX §2.5.1).
 * Second tap on the search FAB closes; list stays visible while typing.
 */
export function useCompactListSearchFab({
  label,
  placeholder,
  value,
  onChange,
  panelExtra,
  onKeyDown,
  onClear,
  clearLabel,
  onOpen,
}: UseCompactListSearchFabArgs): UseCompactListSearchFabResult {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeQuery = value.trim().length > 0;

  const panelBody = (
    <Stack gap="sm">
      <TextInput
        ref={inputRef}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        size="md"
        rightSectionWidth={onClear != null && activeQuery ? 36 : undefined}
        rightSection={
          onClear != null && activeQuery ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              radius="xl"
              aria-label={clearLabel ?? t('actions.clearSearch')}
              onClick={() => {
                onClear();
                inputRef.current?.focus();
              }}
            >
              <IconX size={14} stroke={1.5} />
            </ActionIcon>
          ) : undefined
        }
      />
      {panelExtra}
    </Stack>
  );

  const base = useCompactFabBottomPanel({
    label,
    children: panelBody,
    icon: <IconSearch size={16} stroke={1.5} />,
    actionKey: 'list-search',
    idleTone: 'search',
    activeTone: 'active',
    active: activeQuery,
    onOpen,
  });

  useEffect(() => {
    if (!base.opened) {
      inputRef.current?.blur();
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [base.opened]);

  return {
    action: base.action,
    panel: base.panel,
    opened: base.opened,
    open: base.open,
    close: base.close,
    toggle: base.toggle,
  };
}

export type UseCompactListFilterFabArgs = {
  label: string;
  children: ReactNode;
  /** True when any filter is applied (FAB stays emphasized when panel closed). */
  active?: boolean;
  onOpen?: () => void;
};

/**
 * Compact list filters: FAB toggles a bottom panel (same chrome as search).
 */
export function useCompactListFilterFab({
  label,
  children,
  active = false,
  onOpen,
}: UseCompactListFilterFabArgs): UseCompactFabBottomPanelResult {
  return useCompactFabBottomPanel({
    label,
    children: <Stack gap="md">{children}</Stack>,
    icon: <IconFilter size={16} stroke={1.5} />,
    actionKey: 'filter',
    idleTone: 'filter',
    activeTone: 'active',
    active,
    onOpen,
  });
}

/** Compact count line when search lives behind the FAB panel. */
export function CompactListCount({ children }: { children: ReactNode }) {
  if (children == null || children === '') return null;
  return (
    <Text size="xs" c="dimmed">
      {children}
    </Text>
  );
}
