import type { MeResponse } from '../../api/me-types.js';
import type { DraftScopeType } from '../../hooks/useMeDrafts.js';
import type { AggregatedRecentItem } from '../../hooks/useRecentItems.js';

export type ResolvedRecentScope = {
  scopeType: DraftScopeType;
  scopeName: string;
};

/** Resolve a preferences scopeKey to a display label using /me identity when possible. */
export function resolveRecentScopeDisplay(
  scopeKey: string,
  me: MeResponse | undefined
): ResolvedRecentScope {
  if (scopeKey === 'personal') {
    return { scopeType: 'personal', scopeName: 'Personal' };
  }
  if (scopeKey === 'shared') {
    return { scopeType: 'personal', scopeName: 'Shared' };
  }
  const colon = scopeKey.indexOf(':');
  const type = colon >= 0 ? scopeKey.slice(0, colon) : scopeKey;
  const id = colon >= 0 ? scopeKey.slice(colon + 1) : '';

  if (type === 'team' && id) {
    const team = me?.identity.teams.find((t) => t.teamId === id);
    return { scopeType: 'team', scopeName: team?.teamName ?? 'Team' };
  }
  if (type === 'department' && id) {
    const dept =
      me?.identity.departments.find((d) => d.id === id) ??
      me?.identity.departmentLeads.find((d) => d.id === id) ??
      me?.identity.departmentAuthors.find((d) => d.id === id);
    return { scopeType: 'department', scopeName: dept?.name ?? 'Department' };
  }
  if (type === 'company' && id) {
    const company = me?.identity.companyLeads.find((c) => c.id === id);
    return { scopeType: 'company', scopeName: company?.name ?? 'Company' };
  }
  return { scopeType: 'personal', scopeName: 'Personal' };
}

export type { AggregatedRecentItem };
