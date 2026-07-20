import { useMemo, type ReactNode } from 'react';
import { useCanViewScopePeople } from '../../hooks/useCanViewScopePeople';
import { useMe } from '../../hooks/useMe';
import { ScopePeopleMenu } from './ScopePeopleMenu';
import { peopleScopeId, resolveIdentityPeopleScope } from './resolveIdentityPeopleScope';

/**
 * Global People / Organization control bound to the user's identity scope
 * (highest org level), independent of the current route.
 */
export function useIdentityScopePeopleControl(): ReactNode | null {
  const { data: me } = useMe();

  const params = useMemo(() => resolveIdentityPeopleScope(me), [me]);

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
