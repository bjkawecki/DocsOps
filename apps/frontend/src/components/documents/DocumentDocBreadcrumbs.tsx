import { useMediaQuery } from '@mantine/hooks';
import { useMemo, type ReactNode } from 'react';
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconChevronLeft,
  IconRoute,
  IconSitemap,
  IconSubtask,
  IconUser,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { RecentScope } from '../../hooks/useRecentItems';
import { scopeToLabel, scopeToUrl } from '../../lib/scopeNav';
import { contextUrl } from '../../pages/contextWorkspace/contextPaths.js';
import { WIDE_MIN_WIDTH } from '../appShell/appShellLayoutConstants.js';
import {
  useSetAppShellBreadcrumbs,
  type AppShellBreadcrumbItem,
} from '../appShell/AppShellBreadcrumbsContext.js';
import { useSetAppShellNavScope } from '../appShell/AppShellNavScopeContext.js';

/** Felder aus dem Document-GET, die für Scope-/Kontext-Breadcrumbs nötig sind. */
export type DocumentForDocBreadcrumbs = {
  /** API-`scope` (wird intern als RecentScope interpretiert). */
  scope: unknown;
  contextId: string | null;
  contextType?: 'process' | 'project' | 'subcontext';
  contextProcessId?: string | null;
  contextName?: string;
  contextProjectId?: string | null;
  contextProjectName?: string | null;
  subcontextId?: string | null;
  subcontextName?: string | null;
  title?: string;
};

export type DocumentDocBreadcrumbsProps = {
  documentId: string;
  doc: DocumentForDocBreadcrumbs;
  /** Auf der Versionsseite: Dokument-Crumb verlinkt zurück zum Dokument. */
  linkDocumentTitle?: boolean;
  /** When false, clears the shell breadcrumb trail (e.g. mobile edit focus). */
  enabled?: boolean;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type BuildDocumentBreadcrumbOptions = {
  linkDocumentTitle?: boolean;
  /**
   * Compact viewport: one parent crumb (context or scope), no document title
   * (title already shown as H1).
   */
  compact?: boolean;
};

function buildContextMeta(doc: DocumentForDocBreadcrumbs, t: TranslateFn) {
  if (doc.contextId == null) return null;
  const to = contextUrl(doc.contextId);
  if (doc.contextProcessId != null || doc.contextType === 'process') {
    return { name: doc.contextName ?? t('breadcrumbs.process'), to, icon: <IconRoute size={14} /> };
  }
  if (doc.subcontextId != null || doc.contextType === 'subcontext') {
    return {
      name: doc.subcontextName ?? doc.contextName ?? t('breadcrumbs.subcontext'),
      to,
      icon: <IconSubtask size={14} />,
    };
  }
  if (doc.contextProjectId != null || doc.contextType === 'project') {
    return {
      name: doc.contextProjectName ?? doc.contextName ?? t('breadcrumbs.project'),
      to,
      icon: <IconBriefcase size={14} />,
    };
  }
  return {
    name: doc.contextName ?? t('breadcrumbs.context'),
    to,
    icon: <IconRoute size={14} />,
  };
}

export function buildDocumentBreadcrumbItems(
  documentId: string,
  doc: DocumentForDocBreadcrumbs,
  t: TranslateFn,
  options: BuildDocumentBreadcrumbOptions | boolean = false
): AppShellBreadcrumbItem[] {
  const opts: BuildDocumentBreadcrumbOptions =
    typeof options === 'boolean' ? { linkDocumentTitle: options } : options;
  const { linkDocumentTitle = false, compact = false } = opts;

  const scope = (doc.scope ?? null) as RecentScope | null;
  const hasNoContext = doc.contextId == null;
  const contextMeta = buildContextMeta(doc, t);
  const scopeWithName = doc.scope as RecentScope & { name?: string | null };
  const scopeName =
    scopeWithName?.name ?? (scope ? scopeToLabel(scope) : t('breadcrumbs.overview'));
  const documentTitle = doc.title?.trim() || t('breadcrumbs.untitledDocument');
  const ScopeIcon =
    scope?.type === 'company'
      ? IconBuildingSkyscraper
      : scope?.type === 'department'
        ? IconSitemap
        : scope?.type === 'team'
          ? IconUsersGroup
          : IconUser;

  if (compact) {
    if (linkDocumentTitle) {
      return [
        {
          key: 'document',
          label: documentTitle,
          to: `/documents/${documentId}`,
          icon: <IconChevronLeft size={14} stroke={1.5} />,
        },
      ];
    }
    if (contextMeta) {
      return [
        {
          key: 'context',
          label: contextMeta.name,
          to: contextMeta.to,
          icon: <IconChevronLeft size={14} stroke={1.5} />,
        },
      ];
    }
    if (scope) {
      return [
        {
          key: 'scope',
          label: scopeName,
          to: scopeToUrl(scope),
          icon: <IconChevronLeft size={14} stroke={1.5} />,
        },
      ];
    }
    if (hasNoContext) {
      return [{ key: 'no-context', label: t('breadcrumbs.noContext') }];
    }
    return [];
  }

  const items: AppShellBreadcrumbItem[] = [];
  if (scope) {
    items.push({
      key: 'scope',
      label: scopeName,
      to: scopeToUrl(scope),
      icon: <ScopeIcon size={14} />,
      ...(scope.type === 'company' ? { iconOnly: true } : {}),
    });
  }
  if (contextMeta) {
    items.push({
      key: 'context',
      label: contextMeta.name,
      to: contextMeta.to,
      icon: contextMeta.icon as ReactNode,
    });
  }
  if (hasNoContext) {
    items.push({ key: 'no-context', label: t('breadcrumbs.noContext') });
  }
  items.push({
    key: 'document',
    label: documentTitle,
    ...(linkDocumentTitle && documentId ? { to: `/documents/${documentId}` } : {}),
  });
  return items;
}

/**
 * Registers document breadcrumbs in the AppShell row (Scope → Context → Document).
 * Compact viewports: single parent back-crumb only.
 * Renders nothing inline.
 */
export function DocumentDocBreadcrumbs({
  documentId,
  doc,
  linkDocumentTitle = false,
  enabled = true,
}: DocumentDocBreadcrumbsProps) {
  const { t } = useTranslation('documents');
  const isWide = useMediaQuery(WIDE_MIN_WIDTH) ?? true;
  const items = useMemo(() => {
    if (!enabled) return null;
    return buildDocumentBreadcrumbItems(
      documentId,
      {
        title: doc.title,
        contextId: doc.contextId,
        contextType: doc.contextType,
        contextName: doc.contextName,
        contextProcessId: doc.contextProcessId,
        contextProjectId: doc.contextProjectId,
        contextProjectName: doc.contextProjectName,
        subcontextId: doc.subcontextId,
        subcontextName: doc.subcontextName,
        scope: doc.scope,
      },
      t,
      { linkDocumentTitle, compact: !isWide }
    );
  }, [
    enabled,
    documentId,
    linkDocumentTitle,
    isWide,
    doc.title,
    doc.contextId,
    doc.contextType,
    doc.contextName,
    doc.contextProcessId,
    doc.contextProjectId,
    doc.contextProjectName,
    doc.subcontextId,
    doc.subcontextName,
    doc.scope,
    t,
  ]);
  useSetAppShellBreadcrumbs(items);
  const scope = (doc.scope ?? null) as RecentScope | null;
  useSetAppShellNavScope(enabled ? scope : null);
  return null;
}
