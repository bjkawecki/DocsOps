import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useMe } from '../../hooks/useMe';
import { ScopeTrashArchivePage, type ScopeTrashArchiveKind } from './ScopeTrashArchivePage.js';
import {
  canManageDepartmentScope,
  canManageTeamScope,
  useCompanyScopeRoute,
} from './useCompanyScopeRoute.js';

export type { ScopeTrashArchiveKind };

export function CompanyTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
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
    <ScopeTrashArchivePage
      navScope={{ type: 'company', id: effectiveCompanyId }}
      trashScope="company"
      companyId={effectiveCompanyId}
      kind={kind}
      canManage={canManage}
      scopeLabel={companyName}
    />
  );
}

export function DepartmentTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { data: me } = useMe();
  if (!departmentId) return null;
  return (
    <ScopeTrashArchivePage
      navScope={{ type: 'department', id: departmentId }}
      trashScope="department"
      departmentId={departmentId}
      kind={kind}
      canManage={canManageDepartmentScope(me, departmentId)}
    />
  );
}

export function TeamTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
  const { teamId } = useParams<{ teamId: string }>();
  const { data: me } = useMe();
  if (!teamId) return null;
  return (
    <ScopeTrashArchivePage
      navScope={{ type: 'team', id: teamId }}
      trashScope="team"
      teamId={teamId}
      kind={kind}
      canManage={canManageTeamScope(me, teamId)}
    />
  );
}

export function PersonalTrashArchivePage({ kind }: { kind: ScopeTrashArchiveKind }) {
  const { t } = useTranslation('contexts');
  return (
    <ScopeTrashArchivePage
      navScope={{ type: 'personal' }}
      trashScope="personal"
      kind={kind}
      scopeLabel={t('scopeKind.personal')}
      canManage
    />
  );
}
