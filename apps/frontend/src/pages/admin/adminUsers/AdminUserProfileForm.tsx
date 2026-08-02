import { Button, Group, Stack, Switch, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UserRow } from './adminUsersTypes';

type Props = {
  user: UserRow;
  onSave: (body: {
    name: string;
    email: string | null;
    isAdmin: boolean;
    isCompanyLead: boolean;
    deletedAt: string | null;
  }) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
  isLastActiveAdmin?: boolean;
};

export function AdminUserProfileForm({
  user,
  onSave,
  onCancel,
  isPending,
  isLastActiveAdmin,
}: Props) {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? '');
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [isCompanyLead, setIsCompanyLead] = useState(user.role === 'Company Lead');
  const [deactivated, setDeactivated] = useState(!!user.deletedAt);

  const handleSubmit = () => {
    onSave({
      name: name.trim(),
      email: email.trim() || null,
      isAdmin,
      isCompanyLead,
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
        onChange={(e) => setIsAdmin(e.currentTarget.checked)}
        disabled={isLastActiveAdmin}
      />
      <Switch
        label={t('users.profileForm.companyLeadSwitchLabel')}
        checked={isCompanyLead}
        onChange={(e) => setIsCompanyLead(e.currentTarget.checked)}
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
