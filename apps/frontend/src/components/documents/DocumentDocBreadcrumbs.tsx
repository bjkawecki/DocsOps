import { Anchor, Breadcrumbs, Group, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  IconBriefcase,
  IconBuildingSkyscraper,
  IconChevronRight,
  IconRoute,
  IconSitemap,
  IconSubtask,
  IconUser,
  IconUsersGroup,
} from '@tabler/icons-react';
import type { RecentScope } from '../../hooks/useRecentItems';
import { scopeToLabel, scopeToUrl } from '../../lib/scopeNav';

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
      icon: IconRoute,
    };
  }
  if (doc.subcontextId != null) {
    return {
      name: doc.subcontextName ?? doc.contextName ?? 'Subcontext',
      to:
        doc.contextProjectId != null
          ? `/projects/${doc.contextProjectId}/subcontexts/${doc.subcontextId}`
          : `/subcontexts/${doc.subcontextId}`,
      icon: IconSubtask,
    };
  }
  if (doc.contextProjectId != null) {
    return {
      name: doc.contextProjectName ?? doc.contextName ?? 'Project',
      to: `/projects/${doc.contextProjectId}`,
      icon: IconBriefcase,
    };
  }
  return null;
}

/**
 * Breadcrumb-Zeile: Scope → Kontext (→ Dokumenttitel auf der Versionsseite).
 * Versionsverlauf liegt im Dokument-Menü, nicht in der Breadcrumb-Kette.
 */
export function DocumentDocBreadcrumbs({
  documentId,
  doc,
  linkDocumentTitle = false,
}: DocumentDocBreadcrumbsProps) {
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

  return (
    <Breadcrumbs separator={<IconChevronRight size={14} color="var(--mantine-color-dimmed)" />}>
      {scope && (
        <Anchor component={Link} to={scopeToUrl(scope)} c="dimmed" size="sm">
          <Group gap={4} align="center" wrap="nowrap">
            <ScopeIcon size={14} />
            <span>{scopeName}</span>
          </Group>
        </Anchor>
      )}
      {contextMeta && (
        <Anchor component={Link} to={contextMeta.to} c="dimmed" size="sm">
          <Group gap={4} align="center" wrap="nowrap">
            <contextMeta.icon size={14} />
            <span>{contextMeta.name}</span>
          </Group>
        </Anchor>
      )}
      {hasNoContext && (
        <Text size="sm" c="dimmed">
          No context
        </Text>
      )}
      {linkDocumentTitle && documentId && (
        <Anchor component={Link} to={`/documents/${documentId}`} c="dimmed" size="sm">
          {documentTitle}
        </Anchor>
      )}
    </Breadcrumbs>
  );
}
