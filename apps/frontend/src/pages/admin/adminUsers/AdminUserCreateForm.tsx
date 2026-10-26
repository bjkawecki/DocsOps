import { Button, Group, MultiSelect, Select, Stack, Switch, TextInput } from '@mantine/core';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateUserPayload, DepartmentWithTeams } from './adminUsersTypes';

type Props = {
  companyId: string | null;
  departments: DepartmentWithTeams[];
  onSubmit: (body: CreateUserPayload) => void;
  onCancel: () => void;
  isPending: boolean;
};

export function AdminUserCreateForm({
  companyId,
  departments,
  onSubmit,
  onCancel,
  isPending,
}: Props) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isKnowledgeManager, setIsKnowledgeManager] = useState(false);
  const [kmCompanyIds, setKmCompanyIds] = useState<string[]>([]);
  const [kmDepartmentIds, setKmDepartmentIds] = useState<string[]>([]);
  const [kmTeamIds, setKmTeamIds] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamRole, setTeamRole] = useState<'member' | 'leader'>('member');
  const [supervisorOfDepartment, setSupervisorOfDepartment] = useState(false);

  const orgDisabled = isAdmin || isKnowledgeManager;

  const selectedDepartment = departmentId ? departments.find((d) => d.id === departmentId) : null;
  const teamOptions = (selectedDepartment?.teams ?? []).map((team) => ({
    value: team.id,
    label: team.name,
  }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const companyOptions = useMemo(
    () => (companyId ? [{ value: companyId, label: t('users.createForm.kmCompanyOption') }] : []),
    [companyId, t]
  );
  const kmDepartmentOptions = departmentOptions;
  const kmTeamOptions = useMemo(
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
    onSubmit({
      name,
      email,
      password,
      isAdmin,
      isKnowledgeManager,
      knowledgeManagerScopes: isKnowledgeManager
        ? {
            companyIds: kmCompanyIds,
            departmentIds: kmDepartmentIds,
            teamIds: kmTeamIds,
          }
        : undefined,
      departmentId: orgDisabled ? undefined : departmentId || undefined,
      teamId: orgDisabled ? undefined : teamId || undefined,
      teamRole: orgDisabled || !teamId ? undefined : teamRole,
      supervisorOfDepartment: orgDisabled || !departmentId ? false : supervisorOfDepartment,
    });
  };

  return (
    <Stack>
      <TextInput
        label={t('users.createForm.nameLabel')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <TextInput
        label={t('users.createForm.emailLabel')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextInput
        label={t('users.createForm.passwordLabel')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <Switch
        label={t('users.createForm.adminLabel')}
        checked={isAdmin}
        onChange={(e) => {
          const next = e.currentTarget.checked;
          setIsAdmin(next);
          if (next) setIsKnowledgeManager(false);
        }}
      />
      <Switch
        label={t('users.createForm.knowledgeManagerLabel')}
        description={t('users.createForm.knowledgeManagerHint')}
        checked={isKnowledgeManager}
        onChange={(e) => {
          const next = e.currentTarget.checked;
          setIsKnowledgeManager(next);
          if (next) {
            setIsAdmin(false);
            setDepartmentId(null);
            setTeamId(null);
            setSupervisorOfDepartment(false);
          }
        }}
        disabled={isAdmin}
      />
      {isKnowledgeManager && (
        <Stack gap="xs">
          <MultiSelect
            label={t('users.createForm.kmCompaniesLabel')}
            description={t('users.createForm.kmScopesDescription')}
            data={companyOptions}
            value={kmCompanyIds}
            onChange={setKmCompanyIds}
            searchable
            clearable
          />
          <MultiSelect
            label={t('users.createForm.kmDepartmentsLabel')}
            data={kmDepartmentOptions}
            value={kmDepartmentIds}
            onChange={setKmDepartmentIds}
            searchable
            clearable
          />
          <MultiSelect
            label={t('users.createForm.kmTeamsLabel')}
            data={kmTeamOptions}
            value={kmTeamIds}
            onChange={setKmTeamIds}
            searchable
            clearable
          />
        </Stack>
      )}
      <Select
        label={t('users.createForm.departmentLabel')}
        placeholder={t('users.createForm.departmentPlaceholder')}
        data={departmentOptions}
        value={departmentId}
        onChange={(v) => {
          setDepartmentId(v);
          setTeamId(null);
        }}
        clearable
        disabled={orgDisabled}
      />
      <Select
        label={t('users.createForm.teamLabel')}
        placeholder={
          departmentId
            ? t('users.createForm.teamPlaceholderOptional')
            : t('users.createForm.teamPlaceholderSelectDepartmentFirst')
        }
        data={teamOptions}
        value={teamId}
        onChange={setTeamId}
        disabled={orgDisabled || !departmentId}
        clearable
      />
      {teamId && !orgDisabled && (
        <Select
          label={t('users.createForm.teamRoleLabel')}
          data={[
            { value: 'member', label: t('users.createForm.teamRoleMember') },
            { value: 'leader', label: t('users.createForm.teamRoleLeader') },
          ]}
          value={teamRole}
          onChange={(v) => {
            if (v === 'member' || v === 'leader') setTeamRole(v);
          }}
        />
      )}
      {departmentId && !orgDisabled && (
        <Switch
          label={t('users.createForm.departmentLeadSwitchLabel')}
          checked={supervisorOfDepartment}
          onChange={(e) => setSupervisorOfDepartment(e.currentTarget.checked)}
        />
      )}
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isPending}
          disabled={!name.trim() || !email.trim() || password.length < 8}
        >
          {t('common:actions.create')}
        </Button>
      </Group>
    </Stack>
  );
}
