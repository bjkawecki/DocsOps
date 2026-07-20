import { useMemo, type ReactNode } from 'react';
import type { CanViewScopePeopleParams } from '../../api/me-types';
import type { RecentScope } from '../../hooks/useRecentItems';
import { useCanViewScopePeople } from '../../hooks/useCanViewScopePeople';
import { useMe } from '../../hooks/useMe';
import { ScopePeopleMenu } from './ScopePeopleMenu';

/** Map org RecentScope to can-view-scope-people params; personal/shared → null. */
export function recentScopeToPeopleParams(
  scope: RecentScope | null | undefined
): CanViewScopePeopleParams | null {
  if (scope == null) return null;
  if (scope.type === 'personal' || scope.type === 'shared') return null;
  if (scope.type === 'company') return { scope: 'company', companyId: scope.id };
  if (scope.type === 'department') return { scope: 'department', departmentId: scope.id };
  return { scope: 'team', teamId: scope.id };
}

function peopleScopeId(params: CanViewScopePeopleParams): string {
  if (params.scope === 'company') return params.companyId;
  if (params.scope === 'department') return params.departmentId;
  return params.teamId;
}

/**
 * People / Organization control for the breadcrumb chrome row when viewing
 * company/department/team content (scope pages and process/project/document).
 */
export function useOrgScopePeopleChromeActions(scope: RecentScope | null): ReactNode | null {
  const { data: me } = useMe();
  const scopeType = scope?.type ?? null;
  const scopeId = scope != null && 'id' in scope ? scope.id : null;

  const params = useMemo(
    () => recentScopeToPeopleParams(scope),
    // identity via type+id
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scope object is recreated each render
    [scopeType, scopeId]
  );

  const { data: canViewPeopleData } = useCanViewScopePeople(params);
  const showPeople = canViewPeopleData?.canViewPeople === true;

  const canManageAuthors = useMemo(() => {
    if (!me || params == null) return false;
    if (me.user.isAdmin) return true;
    if (params.scope === 'company') return false;
    if (params.scope === 'department') {
      return me.identity.departmentLeads?.some((d) => d.id === params.departmentId) ?? false;
    }
    return (
      me.identity.teams?.some((t) => t.teamId === params.teamId && t.role === 'leader') ?? false
    );
  }, [me, params]);

  return useMemo(() => {
    if (!showPeople || params == null) return null;
    return (
      <ScopePeopleMenu
        scope={params.scope}
        scopeId={peopleScopeId(params)}
        canManageAuthors={canManageAuthors}
      />
    );
  }, [showPeople, params, canManageAuthors]);
}
