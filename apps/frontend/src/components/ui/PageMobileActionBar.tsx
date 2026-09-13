import { ActionIcon, Menu, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import { resolvePageMobileFabTone, type PageMobileFabTone } from './pageMobileFabTokens.js';
import './PageMobileActionBar.css';

export type PageMobileAction = {
  key: string;
  /** Accessible name (also used as native `title` when set). */
  label: string;
  icon: ReactNode;
  /** Simple click action. Ignored when `menu` is set. */
  onClick?: () => void;
  /**
   * Semantic FAB tone (preferred). Same role → same color app-wide.
   * See `pageMobileFabTokens.ts`.
   */
  tone?: PageMobileFabTone;
  loading?: boolean;
  disabled?: boolean;
  /** Overflow menu body (`Menu.Item`s). Renders a dots target when set. */
  menu?: ReactNode;
};

export type PageMobileActionBarProps = {
  /** Toolbar accessible name. */
  ariaLabel: string;
  /** Vertical stack, bottom item closest to the debug FAB. Prefer ≤3; overflow via menu. */
  actions: PageMobileAction[];
  /** Hide entirely (e.g. while a page modal is open). */
  hidden?: boolean;
};

/**
 * Shared compact chrome: page actions as a small vertical stack at the bottom-right,
 * floating over content (above the shell debug FAB).
 *
 * Spec: `docs/plan/Plan-Mobile-UX.md` §2.9.
 */
export function PageMobileActionBar({
  ariaLabel,
  actions,
  hidden = false,
}: PageMobileActionBarProps) {
  if (hidden || actions.length === 0) return null;

  return (
    <div className="page-mobile-actions" role="toolbar" aria-label={ariaLabel}>
      <Stack gap={6} align="center">
        {actions.map((action) => {
          const tone = action.tone ?? 'more';
          const { color, variant } = resolvePageMobileFabTone(tone);
          if (action.menu != null) {
            return (
              <Menu key={action.key} shadow="sm" position="left-end" withinPortal width={200}>
                <Menu.Target>
                  <ActionIcon
                    variant={variant}
                    color={color}
                    size={32}
                    radius="xl"
                    loading={action.loading}
                    disabled={action.disabled}
                    aria-label={action.label}
                    title={action.label}
                    className="page-mobile-actions-fab"
                    data-tone={tone}
                  >
                    {action.icon}
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown className="page-mobile-actions-menu">{action.menu}</Menu.Dropdown>
              </Menu>
            );
          }

          return (
            <ActionIcon
              key={action.key}
              variant={variant}
              color={color}
              size={32}
              radius="xl"
              loading={action.loading}
              disabled={action.disabled}
              aria-label={action.label}
              title={action.label}
              className="page-mobile-actions-fab"
              data-tone={tone}
              onClick={action.onClick}
            >
              {action.icon}
            </ActionIcon>
          );
        })}
      </Stack>
    </div>
  );
}
