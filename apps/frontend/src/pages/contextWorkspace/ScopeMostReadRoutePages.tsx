import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useMe } from '../../hooks/useMe';
import { ScopeMostReadPage } from './ScopeMostReadPage.js';
import {
  canManageDepartmentScope,
  canManageTeamScope,
  useCompanyScopeRoute,
} from './useCompanyScopeRoute.js';

export function CompanyMostReadPage() {
  const { t } = useTranslation(['contexts', 'common']);
  const { waitingForCompany, effectiveCompanyId, canManage, companyName } = useCompanyScopeRoute();

  if (waitingForCompany) {
    return (
      <Text size="sm" c="dimmed">
        {t('common:status.loading')}
      </Text>
    );
  }

  if (!effectiveCompanyId) {
    return (
      <Text size="sm" c="dimmed">
        {t('routePages.noCompany')}
      </Text>
    );
  }

  return (
    <ScopeMostReadPage
      navScope={{ type: 'company', id: effectiveCompanyId }}
      listScope="company"
      companyId={effectiveCompanyId}
      canManage={canManage}
      scopeLabel={companyName}
    />
  );
}

export function DepartmentMostReadPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { data: me } = useMe();
  if (!departmentId) return null;
  return (
    <ScopeMostReadPage
      navScope={{ type: 'department', id: departmentId }}
      listScope="department"
      departmentId={departmentId}
      canManage={canManageDepartmentScope(me, departmentId)}
    />
  );
}

export function TeamMostReadPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: me } = useMe();
  if (!teamId) return null;
  return (
    <ScopeMostReadPage
      navScope={{ type: 'team', id: teamId }}
      listScope="team"
      teamId={teamId}
      canManage={canManageTeamScope(me, teamId)}
    />
  );
}

export function PersonalMostReadPage() {
  const { t } = useTranslation('contexts');
  return (
    <ScopeMostReadPage
      navScope={{ type: 'personal' }}
      listScope="personal"
      scopeLabel={t('scopeKind.personal')}
      canManage
    />
  );
}
