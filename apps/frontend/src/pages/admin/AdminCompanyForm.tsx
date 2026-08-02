import { useState } from 'react';
import { Stack, TextInput, Group, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function CompanyForm({
  initialName,
  onSubmit,
  onCancel,
  loading,
}: {
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(initialName);
  return (
    <Stack>
      <TextInput
        label={t('shared.name')}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        required
      />
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          {t('common:actions.cancel')}
        </Button>
        <Button onClick={() => onSubmit(name)} loading={loading} disabled={!name.trim()}>
          {t('common:actions.save')}
        </Button>
      </Group>
    </Stack>
  );
}
