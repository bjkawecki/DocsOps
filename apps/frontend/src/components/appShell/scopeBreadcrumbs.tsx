import { useMemo, type ReactNode } from 'react';
import { scopeToKey, type RecentScope } from '../../hooks/useRecentItems.js';
import { scopeToLabel, scopeToUrl } from '../../lib/scopeNav.js';
import {
  useSetAppShellBreadcrumbs,
  useSetAppShellBreadcrumbActions,
  type AppShellBreadcrumbItem,
} from './AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from './AppShellNavScopeContext.js';
import { IconBuildingSkyscraper, IconSitemap, IconUser, IconUsersGroup } from '@tabler/icons-react';

const ICON_SIZE = 14;

/** Scope type icon for shell breadcrumbs. */
export function scopeBreadcrumbIcon(scope: RecentScope) {
  if (scope.type === 'company') return <IconBuildingSkyscraper size={ICON_SIZE} />;
  if (scope.type === 'department') return <IconSitemap size={ICON_SIZE} />;
  if (scope.type === 'team') return <IconUsersGroup size={ICON_SIZE} />;
  return <IconUser size={ICON_SIZE} />;
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
  contextType: 'process' | 'project';
  contextName: string;
  /** For subcontext trails: parent project name + id. */
  project?: { id: string; name: string };
  subcontextName?: string;
};

/**
 * Process/Project: Scope → Processes|Projects → ContextName
 * Subcontext: Scope → Projects → ProjectName → SubcontextName
 * Last crumb has no link.
 */
export function buildContextBreadcrumbs({
  scope,
  scopeLabel,
  contextType,
  contextName,
  project,
  subcontextName,
}: BuildContextBreadcrumbsArgs): AppShellBreadcrumbItem[] | null {
  if (scope == null) return null;

  const typeTab = contextType === 'process' ? 'processes' : 'projects';
  const typeLabel = contextType === 'process' ? 'Processes' : 'Projects';
  const scopeUrl = `${scopeToUrl(scope)}?tab=${typeTab}`;

  const items: AppShellBreadcrumbItem[] = [
    {
      key: `scope:${scopeToKey(scope)}`,
      label: scopeLabel ?? scopeToLabel(scope),
      to: scopeUrl,
      icon: scopeBreadcrumbIcon(scope),
    },
    {
      key: 'type',
      label: typeLabel,
      to: scopeUrl,
    },
  ];

  if (subcontextName != null && project != null) {
    items.push({
      key: 'project',
      label: project.name,
      to: `/projects/${project.id}`,
    });
    items.push({
      key: 'subcontext',
      label: subcontextName,
    });
    return items;
  }

  items.push({
    key: 'context',
    label: contextName,
  });
  return items;
}

/**
 * Registers shell breadcrumbs + nav scope for Company/Department/Team/Personal/Shared pages.
 * Optional `actions` render in the breadcrumb chrome row (People, Create, …).
 */
export function useRegisterScopePageChrome(
  scope: RecentScope | null,
  label?: string,
  actions?: ReactNode | null
) {
  const scopeKey = scope == null ? null : scopeToKey(scope);
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
    return [scopeBreadcrumbItem(resolved, label)];
  }, [scopeKey, label]);
  useSetAppShellBreadcrumbs(items);
  useSetAppShellNavScope(scope);
  useSetAppShellBreadcrumbActions(actions ?? null);
}
