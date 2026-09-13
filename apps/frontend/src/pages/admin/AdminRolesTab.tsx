import {
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrgRoleKey, OrgRoleLabels } from 'backend/api-types';
import { useSetAppShellBreadcrumbActions } from '../../components/appShell/AppShellBreadcrumbsContext.js';
import {
  useAdminSystemSettings,
  usePatchAdminSystemSettings,
} from '../../hooks/useAdminUpdateStatus.js';
import { usePublicConfig } from '../../hooks/usePublicConfig.js';
import { ORG_ROLE_KEYS } from '../../lib/orgRoleLabel.js';

type RoleFields = {
  singular: string;
  plural: string;
};

type FormState = Record<OrgRoleKey, RoleFields>;

function emptyFields(): RoleFields {
  return { singular: '', plural: '' };
}

function labelsToForm(labels: OrgRoleLabels | undefined): FormState {
  const form = {} as FormState;
  for (const key of ORG_ROLE_KEYS) {
    const role = labels?.[key];
    form[key] = {
      singular: role?.singular ?? '',
      plural: role?.plural ?? '',
    };
  }
  return form;
}

function formToLabels(form: FormState): OrgRoleLabels {
  const out: OrgRoleLabels = {};
  for (const key of ORG_ROLE_KEYS) {
    const f = form[key];
    const block: { singular?: string; plural?: string } = {};
    if (f.singular.trim()) block.singular = f.singular.trim();
    if (f.plural.trim()) block.plural = f.plural.trim();
    if (block.singular || block.plural) out[key] = block;
  }
  return out;
}

const ROLE_TITLE_KEYS: Record<OrgRoleKey, string> = {
  companyLead: 'rolesPage.roles.companyLead',
  departmentLead: 'rolesPage.roles.departmentLead',
  teamLead: 'rolesPage.roles.teamLead',
  teamMember: 'rolesPage.roles.teamMember',
};

/**
 * Admin Platform → Roles: singular/plural display labels (instance language).
 */
export function AdminRolesTab() {
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const settingsQuery = useAdminSystemSettings();
  const patchMutation = usePatchAdminSystemSettings();
  const { data: publicConfig } = usePublicConfig();
  const demoMode = publicConfig?.demoMode === true;

  const [form, setForm] = useState<FormState>(
    () => Object.fromEntries(ORG_ROLE_KEYS.map((k) => [k, emptyFields()])) as FormState
  );

  useEffect(() => {
    if (settingsQuery.data?.orgRoleLabels != null) {
      setForm(labelsToForm(settingsQuery.data.orgRoleLabels));
    }
  }, [settingsQuery.data?.orgRoleLabels]);

  const dirty = useMemo(() => {
    if (!settingsQuery.data) return false;
    return (
      JSON.stringify(formToLabels(form)) !== JSON.stringify(settingsQuery.data.orgRoleLabels ?? {})
    );
  }, [form, settingsQuery.data]);

  const save = () => {
    patchMutation.mutate(
      { orgRoleLabels: formToLabels(form) },
      {
        onSuccess: () => {
          notifications.show({
            color: 'green',
            title: t('rolesPage.toasts.savedTitle'),
            message: t('rolesPage.toasts.savedMessage'),
          });
        },
        onError: (err) => {
          notifications.show({
            color: 'red',
            title: t('rolesPage.toasts.saveFailedTitle'),
            message: err instanceof Error ? err.message : t('shared.errorTitle'),
          });
        },
      }
    );
  };

  useSetAppShellBreadcrumbActions(
    <Group gap="sm">
      <Button
        onClick={save}
        loading={patchMutation.isPending}
        disabled={demoMode || !dirty || settingsQuery.isPending}
      >
        {t('rolesPage.save')}
      </Button>
    </Group>,
    `${demoMode}-${dirty}-${patchMutation.isPending}`
  );

  if (settingsQuery.isError) {
    return (
      <Alert color="red" variant="filled">
        {t('rolesPage.loadFailed')}
      </Alert>
    );
  }

  if (settingsQuery.isPending || !settingsQuery.data) {
    return <Loader size="sm" />;
  }

  return (
    <Stack gap="lg" maw={720}>
      <Stack gap="xs">
        <Title order={2}>{t('rolesPage.title')}</Title>
        <Text c="dimmed" size="sm">
          {t('rolesPage.intro')}
        </Text>
      </Stack>

      {demoMode ? (
        <Alert color="blue" variant="light">
          {t('rolesPage.demoReadOnly')}
        </Alert>
      ) : null}

      {ORG_ROLE_KEYS.map((roleKey) => (
        <Paper key={roleKey} withBorder p="md" radius="md">
          <Stack gap="md">
            <Stack gap={4}>
              <Title order={4}>{t(ROLE_TITLE_KEYS[roleKey])}</Title>
              <Text size="xs" c="dimmed">
                {t('rolesPage.defaultHint', {
                  singular: tCommon(`orgRoles.${roleKey}.singular`),
                  plural: tCommon(`orgRoles.${roleKey}.plural`),
                })}
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <TextInput
                label={t('rolesPage.fields.singular')}
                value={form[roleKey].singular}
                disabled={demoMode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [roleKey]: { ...prev[roleKey], singular: e.currentTarget.value },
                  }))
                }
                placeholder={tCommon(`orgRoles.${roleKey}.singular`)}
              />
              <TextInput
                label={t('rolesPage.fields.plural')}
                value={form[roleKey].plural}
                disabled={demoMode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    [roleKey]: { ...prev[roleKey], plural: e.currentTarget.value },
                  }))
                }
                placeholder={tCommon(`orgRoles.${roleKey}.plural`)}
              />
            </SimpleGrid>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
