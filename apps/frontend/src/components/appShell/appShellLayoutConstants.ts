export const SIDEBAR_WIDTH_EXPANDED = 240;
/** Narrow icon rail (item size + horizontal padding). Keep in sync with AppShell.css. */
export const SIDEBAR_WIDTH_MINI = 56;
export const SIDEBAR_MINI_ITEM_SIZE = 32;
export const SIDEBAR_MINI_ICON_SIZE = 20;
export const SIDEBAR_MINI_GAP = 6;
export const MAIN_NAV_ID = 'main-navigation';
export const MAIN_CONTENT_ID = 'main-content';

/**
 * Responsive tokens (Plan-Mobile-UX):
 * - narrow: below `sm` (48em) – AppShell overlay nav, max simplification
 * - compact: below `lg` (75em) – page sidebars/tables use mobile patterns
 * - wide: from `lg` – desktop two-column / tables
 */
/** Mantine `sm` – AppShell navbar breakpoint; above = desktop shell rail. */
export const DESKTOP_MIN_WIDTH = '(min-width: 48em)';
/** Mantine `lg` – page content-nav / table breakpoint (Welle 2+). */
export const WIDE_MIN_WIDTH = '(min-width: 75em)';
