import { Button, Group, MultiSelect, Stack, Switch, TextInput } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DepartmentWithTeams, KnowledgeManagerScopes, UserRow } from './adminUsersTypes';

type Props = {
  user: UserRow;
  companyId: string | null;
  departments: DepartmentWithTeams[];
  onSave: (body: {
    name: string;
    email: string | null;
    isAdmin: boolean;
    isKnowledgeManager: boolean;
    isCompanyLead: boolean;
    knowledgeManagerScopes: KnowledgeManagerScopes;
    deletedAt: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
  isLastActiveAdmin?: boolean;
};

export function AdminUserProfileForm({
  user,
  companyId,
  departments,
  onSave,
  onCancel,
  isPending,
  isLastActiveAdmin,
}: Props) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [isKnowledgeManager, setIsKnowledgeManager] = useState(
    user.isKnowledgeManager || user.role === 'Knowledge Manager'
  );
  const [isCompanyLead, setIsCompanyLead] = useState(user.role === 'Company Lead');
  const [deactivated, setDeactivated] = useState(!!user.deletedAt);
  const scopes = user.knowledgeManagerScopes;
  const [kmCompanyIds, setKmCompanyIds] = useState<string[]>(scopes?.companyIds ?? []);
  const [kmDepartmentIds, setKmDepartmentIds] = useState<string[]>(scopes?.departmentIds ?? []);
  const [kmTeamIds, setKmTeamIds] = useState<string[]>(scopes?.teamIds ?? []);

  const companyOptions = useMemo(
    () => (companyId ? [{ value: companyId, label: t('users.profileForm.kmCompanyOption') }] : []),
    [companyId, t]
  );
  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name })),
    [departments]
  );
  const teamOptions = useMemo(
    () =>
      departments.flatMap((d) =>
        (d.teams ?? []).map((team) => ({
          value: team.id,
          label: `${team.name} (${d.name})`,
        }))
      ),
    [departments]
  );

  const handleSubmit = () => {
    onSave({
      name: name.trim(),
      email: email.trim() || null,
      isAdmin,
      isKnowledgeManager,
      isCompanyLead: isKnowledgeManager || isAdmin ? false : isCompanyLead,
      knowledgeManagerScopes: isKnowledgeManager
        ? {
            companyIds: kmCompanyIds,
            departmentIds: kmDepartmentIds,
            teamIds: kmTeamIds,
          }
        : { companyIds: [], departmentIds: [], teamIds: [] },
      deletedAt: deactivated ? new Date().toISOString() : null,
    }).catch(() => {});
  };

  return (
    <Stack gap="sm">
      <TextInput
        label={t('users.profileForm.nameLabel')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <TextInput
        label={t('users.profileForm.emailLabel')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Switch
        label={t('users.profileForm.adminSwitchLabel')}
        description={isLastActiveAdmin ? t('users.profileForm.adminLastActiveHint') : undefined}
        checked={isAdmin}
        onChange={(e) => {
          const next = e.currentTarget.checked;
          setIsAdmin(next);
          if (next) {
            setIsCompanyLead(false);
            setIsKnowledgeManager(false);
          }
        }}
        disabled={isLastActiveAdmin}
      />
      <Switch
        label={t('users.profileForm.knowledgeManagerSwitchLabel')}
        description={
          isAdmin
            ? t('users.profileForm.knowledgeManagerAdminHint')
            : t('users.profileForm.knowledgeManagerHint')
        }
        checked={isKnowledgeManager}
        onChange={(e) => {
          const next = e.currentTarget.checked;
          setIsKnowledgeManager(next);
          if (next) {
            setIsCompanyLead(false);
            setIsAdmin(false);
          }
        }}
        disabled={isAdmin}
      />
      {isKnowledgeManager && (
        <Stack gap="xs">
          <MultiSelect
            label={t('users.profileForm.kmCompaniesLabel')}
            description={t('users.profileForm.kmScopesDescription')}
            data={companyOptions}
            value={kmCompanyIds}
            onChange={setKmCompanyIds}
            searchable
            clearable
          />
          <MultiSelect
            label={t('users.profileForm.kmDepartmentsLabel')}
            data={departmentOptions}
            value={kmDepartmentIds}
            onChange={setKmDepartmentIds}
            searchable
            clearable
          />
          <MultiSelect
            label={t('users.profileForm.kmTeamsLabel')}
            data={teamOptions}
            value={kmTeamIds}
            onChange={setKmTeamIds}
            searchable
            clearable
          />
        </Stack>
      )}
      <Switch
        label={t('users.profileForm.companyLeadSwitchLabel')}
        description={
          isAdmin || isKnowledgeManager ? t('users.profileForm.companyLeadAdminHint') : undefined
        }
        checked={isCompanyLead}
        onChange={(e) => setIsCompanyLead(e.currentTarget.checked)}
        disabled={isAdmin || isKnowledgeManager}
      />
      <Switch
        label={t('users.profileForm.deactivatedSwitchLabel')}
        description={
          isLastActiveAdmin ? t('users.profileForm.deactivatedLastActiveHint') : undefined
        }
        checked={deactivated}
        onChange={(e) => setDeactivated(e.currentTarget.checked)}
        disabled={isLastActiveAdmin}
      />
      <Group gap="xs" mt="xs">
        <Button size="sm" variant="default" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button size="sm" onClick={handleSubmit} loading={isPending} disabled={!name.trim()}>
          {t('common:actions.save')}
        </Button>
      </Group>
    </Stack>
  );
}
