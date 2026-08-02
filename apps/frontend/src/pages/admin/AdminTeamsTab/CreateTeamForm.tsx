import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Department, Team } from 'backend/api-types';

export type CreateTeamFormProps = {
  departments: (Department & { teams?: Team[] })[];
  onSubmit: (name: string, departmentId: string) => void;
  onCancel: () => void;
  loading: boolean;
};

export function CreateTeamForm({ departments, onSubmit, onCancel, loading }: CreateTeamFormProps) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
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
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button
          onClick={() => departmentId && onSubmit(name, departmentId)}
          loading={loading}
          disabled={!name.trim() || !departmentId}
        >
          {t('common:actions.create')}
        </Button>
      </Group>
    </Stack>
  );
}
