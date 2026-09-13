/**
 * Semantic FAB tones for `PageMobileActionBar` (Plan-Mobile-UX §2.9).
 * Same icon/role → same tone on every page; dark mode uses light chrome + filled primaries.
 */
export type PageMobileFabTone =
  | 'nav'
  | 'search'
  | 'filter'
  | 'create'
  | 'edit'
  | 'save'
  | 'more'
  | 'danger'
  | 'secondary'
  | 'active';

export type PageMobileFabToneStyle = {
  /** Mantine color name. */
  color: string;
  /** Prefer `light` for chrome on dark backgrounds; `filled` for primary actions. */
  variant: 'filled' | 'light';
};

/**
 * Canonical mapping – do not invent ad-hoc colors at call sites.
 *
 * | Tone | Typical icons | Intent |
 * | --- | --- | --- |
 * | nav | LayoutSidebar | Content-Nav drawer |
 * | search | Search | List search sheet |
 * | filter | Filter | List filters sheet |
 * | active | Search/Filter when query/filters on | Emphasize active state |
 * | create | Plus, FilePlus | Create / new |
 * | edit | Pencil | Edit existing |
 * | save | DeviceFloppy / check | Persist |
 * | more | DotsVertical | Overflow |
 * | danger | Trash, X | Destructive / cancel |
 * | secondary | Mail, Download, Checks | Utility (not create) |
 */
export const PAGE_MOBILE_FAB_TONE: Record<PageMobileFabTone, PageMobileFabToneStyle> = {
  nav: { color: 'gray', variant: 'light' },
  search: { color: 'indigo', variant: 'light' },
  filter: { color: 'violet', variant: 'light' },
  active: { color: 'blue', variant: 'filled' },
  create: { color: 'teal', variant: 'filled' },
  edit: { color: 'cyan', variant: 'filled' },
  save: { color: 'teal', variant: 'filled' },
  more: { color: 'gray', variant: 'light' },
  danger: { color: 'red', variant: 'filled' },
  secondary: { color: 'blue', variant: 'filled' },
};

export function resolvePageMobileFabTone(
  tone: PageMobileFabTone | undefined
): PageMobileFabToneStyle {
  return PAGE_MOBILE_FAB_TONE[tone ?? 'more'];
}
