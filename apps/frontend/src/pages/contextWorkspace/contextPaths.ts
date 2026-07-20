import type { RecentScope } from '../../hooks/useRecentItems.js';
import type { MeDraftsScopeParams } from '../../hooks/useMeDrafts.js';
import { scopeToUrl } from '../../lib/scopeNav.js';

/** SPA path for a Context row (`Context.id`). */
export function contextUrl(contextId: string): string {
  return `/contexts/${contextId}`;
}

/**
 * Owner-scoped query params for `GET /processes` and `GET /projects` (siblings in a scope).
 * `null` for scopes without an owner concept (e.g. Shared).
 */
export function scopeToOwnerQueryParams(scope: RecentScope): URLSearchParams | null {
  const params = new URLSearchParams({ limit: '100', offset: '0' });
  if (scope.type === 'company') params.set('companyId', scope.id);
  else if (scope.type === 'department') params.set('departmentId', scope.id);
  else if (scope.type === 'team') params.set('teamId', scope.id);
  else if (scope.type === 'personal') params.set('ownerUserId', 'me');
  else return null;
  return params;
}

/** Owner-scoped params for `useMeDrafts` (sidebar draft list). `null` for Shared. */
export function scopeToDraftsParams(scope: RecentScope): MeDraftsScopeParams | null {
  if (scope.type === 'company') return { companyId: scope.id };
  if (scope.type === 'department') return { departmentId: scope.id };
  if (scope.type === 'team') return { teamId: scope.id };
  if (scope.type === 'personal') return { scope: 'personal' };
  return null;
}

export function scopeTrashUrl(scope: RecentScope): string {
  return `${scopeToUrl(scope)}/trash`;
}

export function scopeArchiveUrl(scope: RecentScope): string {
  return `${scopeToUrl(scope)}/archive`;
}

const LAST_CONTEXT_PREFIX = 'docsops:scope-context:';

export function readLastScopeContextId(scopeKey: string): string | null {
  try {
    const v = window.localStorage.getItem(`${LAST_CONTEXT_PREFIX}${scopeKey}`);
    return v?.trim() || null;
  } catch {
    return null;
  }
}

export function writeLastScopeContextId(scopeKey: string, contextId: string): void {
  try {
    window.localStorage.setItem(`${LAST_CONTEXT_PREFIX}${scopeKey}`, contextId);
  } catch {
    // ignore
  }
}

const SIDEBAR_SECTION_PREFIX = 'docsops:context-sidebar:open:';

/** Persist Processes/Projects/project-sub expand across context navigations (session). */
export function readSidebarSectionOpen(sectionId: string, fallback: boolean): boolean {
  try {
    const v = window.sessionStorage.getItem(`${SIDEBAR_SECTION_PREFIX}${sectionId}`);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    // ignore
  }
  return fallback;
}

export function writeSidebarSectionOpen(sectionId: string, open: boolean): void {
  try {
    window.sessionStorage.setItem(`${SIDEBAR_SECTION_PREFIX}${sectionId}`, open ? '1' : '0');
  } catch {
    // ignore
  }
}
