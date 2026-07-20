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
  /** Auf der Versionsseite: letzter Crumb verlinkt zurück zum Dokument. */
  linkDocumentTitle?: boolean;
};

function buildContextMeta(doc: DocumentForDocBreadcrumbs) {
  if (doc.contextProcessId != null) {
    return {
      name: doc.contextName ?? 'Process',
      to: `/processes/${doc.contextProcessId}`,
      icon: <IconRoute size={14} />,
    };
  }
  if (doc.subcontextId != null) {
    return {
      name: doc.subcontextName ?? doc.contextName ?? 'Subcontext',
      to:
        doc.contextProjectId != null
          ? `/projects/${doc.contextProjectId}/subcontexts/${doc.subcontextId}`
          : `/subcontexts/${doc.subcontextId}`,
      icon: <IconSubtask size={14} />,
    };
  }
  if (doc.contextProjectId != null) {
    return {
      name: doc.contextProjectName ?? doc.contextName ?? 'Project',
      to: `/projects/${doc.contextProjectId}`,
      icon: <IconBriefcase size={14} />,
    };
  }
  return null;
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
  if (linkDocumentTitle && documentId) {
    items.push({
      key: 'document',
      label: documentTitle,
      to: `/documents/${documentId}`,
    });
  }
  return items;
}

/**
 * Registers document breadcrumbs in the AppShell row (Scope → Kontext → optional title).
 * Renders nothing inline.
 */
export function DocumentDocBreadcrumbs({
  documentId,
  doc,
  linkDocumentTitle = false,
}: DocumentDocBreadcrumbsProps) {
  const items = useMemo(
    () => buildDocumentBreadcrumbItems(documentId, doc, linkDocumentTitle),
    [documentId, doc, linkDocumentTitle]
  );
  useSetAppShellBreadcrumbs(items);
  const scope = (doc.scope ?? null) as RecentScope | null;
  useSetAppShellNavScope(scope);
  return null;
}
