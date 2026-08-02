import { Button, Group, Select, Stack, Switch, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateUserPayload, DepartmentWithTeams } from './adminUsersTypes';

type Props = {
  departments: DepartmentWithTeams[];
  onSubmit: (body: CreateUserPayload) => void;
  onCancel: () => void;
  isPending: boolean;
};

export function AdminUserCreateForm({ departments, onSubmit, onCancel, isPending }: Props) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamRole, setTeamRole] = useState<'member' | 'leader'>('member');
  const [supervisorOfDepartment, setSupervisorOfDepartment] = useState(false);

  const selectedDepartment = departmentId ? departments.find((d) => d.id === departmentId) : null;
  const teamOptions = (selectedDepartment?.teams ?? []).map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const handleSubmit = () => {
    onSubmit({
      name,
      email,
      password,
      isAdmin,
      departmentId: departmentId || undefined,
      teamId: teamId || undefined,
      teamRole: teamId ? teamRole : undefined,
      supervisorOfDepartment: departmentId ? supervisorOfDepartment : false,
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
        onChange={(e) => setIsAdmin(e.currentTarget.checked)}
      />
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
        disabled={!departmentId}
        clearable
      />
      {teamId && (
        <Select
          label={t('users.createForm.teamRoleLabel')}
          data={[
            { value: 'member', label: t('users.createForm.teamRoleMember') },
            { value: 'leader', label: t('users.createForm.teamRoleLeader') },
          ]}
          value={teamRole}
          onChange={(v) => v && setTeamRole(v as 'member' | 'leader')}
        />
      )}
      {departmentId && (
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
