import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Department, Team } from 'backend/api-types';

export type CreateTeamFormProps = {
  departments: (Department & { teams?: Team[] })[];
  userOptions: { value: string; label: string }[];
  onSubmit: (name: string, departmentId: string, leadUserId: string) => void;
  onCancel: () => void;
  loading: boolean;
};

export function CreateTeamForm({
  departments,
  userOptions,
  onSubmit,
  onCancel,
  loading,
}: CreateTeamFormProps) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [leadUserId, setLeadUserId] = useState<string | null>(null);
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  return (
    <Stack>
      <TextInput
        label={t('shared.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Select
        label={t('shared.department')}
        placeholder={t('teams.createForm.departmentPlaceholder')}
        data={departmentOptions}
        value={departmentId}
        onChange={(v) => setDepartmentId(v)}
        required
      />
      <Select
        label={t('shared.lead')}
        placeholder={t('teams.createForm.leadPlaceholder')}
        data={userOptions}
        value={leadUserId}
        onChange={setLeadUserId}
        searchable
        required
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          onClick={() => departmentId && leadUserId && onSubmit(name, departmentId, leadUserId)}
          loading={loading}
          disabled={!name.trim() || !departmentId || !leadUserId}
        >
          {t('common:actions.create')}
        </Button>
      </Group>
    </Stack>
  );
}
