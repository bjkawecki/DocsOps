import { Button, Group, Select, Stack, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Company } from 'backend/api-types';

export type CreateDepartmentFormProps = {
  companies: Company[];
  userOptions: { value: string; label: string }[];
  onSubmit: (name: string, companyId: string, leadUserId: string) => void;
  onCancel: () => void;
  loading: boolean;
};

export function CreateDepartmentForm({
  companies,
  userOptions,
  onSubmit,
  onCancel,
  loading,
}: CreateDepartmentFormProps) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [leadUserId, setLeadUserId] = useState<string | null>(null);
  const options = companies.map((c) => ({ value: c.id, label: c.name }));
  return (
    <Stack>
      <TextInput
        label={t('shared.name')}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        required
      />
      <Select
        label={t('shared.company')}
        placeholder={t('departments.createForm.companyPlaceholder')}
        data={options}
        value={companyId}
        onChange={setCompanyId}
        required
      />
      <Select
        label={t('shared.lead')}
        placeholder={t('departments.createForm.leadPlaceholder')}
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
          onClick={() => companyId && leadUserId && onSubmit(name, companyId, leadUserId)}
          loading={loading}
          disabled={!name.trim() || !companyId || !leadUserId}
        >
          {t('common:actions.create')}
        </Button>
      </Group>
    </Stack>
  );
}
