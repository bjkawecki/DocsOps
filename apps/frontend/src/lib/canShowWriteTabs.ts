import type { MeResponse } from '../api/me-types';

/**
 * Trash and Archive tabs: Scope-Lead only (Company/Department/Team; rights flow down).
 * Platform admin alone does not get lead write tabs.
 */
export function canShowTrashArchiveTabs(_me: MeResponse | undefined, canManage: boolean): boolean {
  return canManage;
}

/**
 * Drafts tab and overview card: Admin, Scope-Lead, or scope author with write access
 * (e.g. inline suggestions in lead drafts). Prefer backend `canWriteInScope` when available.
 */
export function canShowDraftsTab(
  me: MeResponse | undefined,
  canManage: boolean,
  canWriteInScope = false
): boolean {
  return canShowTrashArchiveTabs(me, canManage) || canWriteInScope;
}

/** @deprecated Use canShowTrashArchiveTabs or canShowDraftsTab instead. */
export function canShowWriteTabs(me: MeResponse | undefined, canManage: boolean): boolean {
  return canShowTrashArchiveTabs(me, canManage);
}
