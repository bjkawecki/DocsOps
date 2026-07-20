import { useMemo, type ReactNode } from 'react';
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconRoute,
  IconSitemap,
  IconSubtask,
  IconUser,
  IconUsersGroup,
} from '@tabler/icons-react';
import type { RecentScope } from '../../hooks/useRecentItems';
import { scopeToLabel, scopeToUrl } from '../../lib/scopeNav';
import { contextUrl } from '../../pages/contextWorkspace/contextPaths.js';
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
};

function buildContextMeta(doc: DocumentForDocBreadcrumbs) {
  if (doc.contextId == null) return null;
  const to = contextUrl(doc.contextId);
  if (doc.contextProcessId != null || doc.contextType === 'process') {
    return { name: doc.contextName ?? 'Process', to, icon: <IconRoute size={14} /> };
  }
  if (doc.subcontextId != null || doc.contextType === 'subcontext') {
    return {
      name: doc.subcontextName ?? doc.contextName ?? 'Subcontext',
      to,
      icon: <IconSubtask size={14} />,
    };
  }
  if (doc.contextProjectId != null || doc.contextType === 'project') {
    return {
      name: doc.contextProjectName ?? doc.contextName ?? 'Project',
      to,
      icon: <IconBriefcase size={14} />,
    };
  }
  return {
    name: doc.contextName ?? 'Context',
    to,
    icon: <IconRoute size={14} />,
  };
}

export function buildDocumentBreadcrumbItems(
  documentId: string,
  doc: DocumentForDocBreadcrumbs,
  linkDocumentTitle = false
): AppShellBreadcrumbItem[] {
  const scope = (doc.scope ?? null) as RecentScope | null;
  const hasNoContext = doc.contextId == null;
  const contextMeta = buildContextMeta(doc);
  const scopeWithName = doc.scope as RecentScope & { name?: string | null };
  const scopeName = scopeWithName?.name ?? (scope ? scopeToLabel(scope) : 'Overview');
  const documentTitle = doc.title?.trim() || 'Document';
  const ScopeIcon =
    scope?.type === 'company'
      ? IconBuildingSkyscraper
      : scope?.type === 'department'
        ? IconSitemap
        : scope?.type === 'team'
          ? IconUsersGroup
          : IconUser;

  const items: AppShellBreadcrumbItem[] = [];
  if (scope) {
    items.push({
      key: 'scope',
      label: scopeName,
      to: scopeToUrl(scope),
      icon: <ScopeIcon size={14} />,
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
    items.push({ key: 'no-context', label: 'No context' });
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
 * Renders nothing inline.
 */
export function DocumentDocBreadcrumbs({
  documentId,
  doc,
  linkDocumentTitle = false,
}: DocumentDocBreadcrumbsProps) {
  const items = useMemo(
    () => buildDocumentBreadcrumbItems(documentId, doc, linkDocumentTitle),
    // Title/context fields drive the trail; avoid depending on whole `doc` identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by breadcrumb fields
    [
      documentId,
      linkDocumentTitle,
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
    ]
  );
  useSetAppShellBreadcrumbs(items);
  const scope = (doc.scope ?? null) as RecentScope | null;
  useSetAppShellNavScope(scope);
  return null;
}
