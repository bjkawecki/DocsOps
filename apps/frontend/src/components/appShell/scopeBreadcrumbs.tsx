import { useMemo, type ReactNode } from 'react';
import { scopeToKey, type RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToLabel, scopeToUrl } from '../../lib/scopeNav.js';
import { contextUrl } from '../../pages/contextWorkspace/contextPaths.js';
import {
  useSetAppShellBreadcrumbs,
  useSetAppShellBreadcrumbActions,
  type AppShellBreadcrumbItem,
} from './AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from './AppShellNavScopeContext.js';
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconRoute,
  IconSitemap,
  IconSubtask,
  IconUser,
  IconUsersGroup,
} from '@tabler/icons-react';

const ICON_SIZE = 14;

/** Scope type icon for shell breadcrumbs. */
export function scopeBreadcrumbIcon(scope: RecentScope) {
  if (scope.type === 'company') return <IconBuildingSkyscraper size={ICON_SIZE} />;
  if (scope.type === 'department') return <IconSitemap size={ICON_SIZE} />;
  if (scope.type === 'team') return <IconUsersGroup size={ICON_SIZE} />;
  return <IconUser size={ICON_SIZE} />;
}

/** Process / project / subcontext icon for shell breadcrumbs. */
export function contextTypeBreadcrumbIcon(contextType: 'process' | 'project' | 'subcontext') {
  if (contextType === 'process') return <IconRoute size={ICON_SIZE} stroke={1.5} />;
  if (contextType === 'project') return <IconBriefcase size={ICON_SIZE} stroke={1.5} />;
  return <IconSubtask size={ICON_SIZE} stroke={1.5} />;
}

/**
 * Single scope crumb (Company / Department / Team / Personal / Shared pages).
 * Last (and only) item: no link.
 */
export function scopeBreadcrumbItem(scope: RecentScope, label?: string): AppShellBreadcrumbItem {
  return {
    key: `scope:${scopeToKey(scope)}`,
    label: label ?? scopeToLabel(scope),
    icon: scopeBreadcrumbIcon(scope),
  };
}

export type BuildContextBreadcrumbsArgs = {
  scope: RecentScope | null;
  /** Display name for the scope crumb (e.g. company/dept name). */
  scopeLabel?: string;
  contextType: 'process' | 'project' | 'subcontext';
  /** Process/Project: the context's own name. Subcontext: the subcontext's name. */
  contextName: string;
  /** Subcontext only: parent project (Context.id, for `contextUrl`) + name. */
  parentProject?: { contextId: string; name: string };
};

/**
 * Process/Project: Scope → ContextName
 * Subcontext: Scope → ProjectName → SubcontextName
 * Scope crumb links to `scopeToUrl(scope)`. Last crumb has no link.
 */
export function buildContextBreadcrumbs({
  scope,
  scopeLabel,
  contextType,
  contextName,
  parentProject,
}: BuildContextBreadcrumbsArgs): AppShellBreadcrumbItem[] | null {
  if (scope == null) return null;

  const items: AppShellBreadcrumbItem[] = [
    {
      key: `scope:${scopeToKey(scope)}`,
      label: scopeLabel ?? scopeToLabel(scope),
      to: scopeToUrl(scope),
      icon: scopeBreadcrumbIcon(scope),
    },
  ];

  if (contextType === 'subcontext' && parentProject != null) {
    items.push({
      key: 'project',
      label: parentProject.name,
      to: contextUrl(parentProject.contextId),
      icon: contextTypeBreadcrumbIcon('project'),
    });
  }

  items.push({
    key: 'context',
    label: contextName,
    icon: contextTypeBreadcrumbIcon(contextType),
  });
  return items;
}

/**
 * Registers shell breadcrumbs + nav scope for Company/Department/Team/Personal/Shared pages.
 * Optional `actions` render in the breadcrumb chrome row (People, Create, …).
 * Optional `trailSuffix` appends crumbs after the scope (e.g. Trash / Archive).
 */
export function useRegisterScopePageChrome(
  scope: RecentScope | null,
  label?: string,
  actions?: ReactNode | null,
  trailSuffix?: AppShellBreadcrumbItem[] | null
) {
  const scopeKey = scope == null ? null : scopeToKey(scope);
  const suffixKey =
    trailSuffix == null || trailSuffix.length === 0
      ? ''
      : trailSuffix.map((i) => `${i.key}\u0001${i.label}`).join('\u0002');
  const items = useMemo((): AppShellBreadcrumbItem[] | null => {
    if (scopeKey == null) return null;
    const resolved: RecentScope =
      scopeKey === 'personal'
        ? { type: 'personal' }
        : scopeKey === 'shared'
          ? { type: 'shared' }
          : (() => {
              const sep = scopeKey.indexOf(':');
              const type = scopeKey.slice(0, sep) as 'company' | 'department' | 'team';
              const id = scopeKey.slice(sep + 1);
              return { type, id };
            })();
    const base = scopeBreadcrumbItem(resolved, label);
    // Scope crumb links back to scope landing when there is a suffix (Trash/Archive).
    if (trailSuffix != null && trailSuffix.length > 0) {
      return [{ ...base, to: scopeToUrl(resolved) }, ...trailSuffix];
    }
    return [base];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trailSuffix identity via suffixKey
  }, [scopeKey, label, suffixKey]);
  useSetAppShellBreadcrumbs(items);
  useSetAppShellNavScope(scope);
  useSetAppShellBreadcrumbActions(
    actions ?? null,
    `${scopeKey ?? 'none'}:${actions == null ? '0' : '1'}:${suffixKey}`
  );
}
