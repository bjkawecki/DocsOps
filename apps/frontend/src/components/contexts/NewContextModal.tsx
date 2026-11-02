import { Button, Group, Modal, Radio, Select, Stack, Text, TextInput } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { contextUrl } from '../../pages/contextWorkspace/contextPaths';
import { useNewContextScopeDisplayLabel } from './useNewContextScopeDisplayLabel';

export type NewContextScope =
  | { type: 'company'; companyId: string }
  | { type: 'department'; departmentId: string }
  | { type: 'team'; teamId: string }
  | { type: 'personal' };

export interface NewContextModalProps {
  opened: boolean;
  onClose: () => void;
  scope: NewContextScope;
  onSuccess?: () => void;
  /** Preselect type when opening (e.g. from Create menu). Skips type picker. */
  initialType?: 'process' | 'project';
}

const NAME_MAX_LENGTH = 255;

export function NewContextModal({
  opened,
  onClose,
  scope,
  onSuccess,
  initialType,
}: NewContextModalProps) {
  const { t } = useTranslation(['contexts', 'common']);
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'process' | 'project' | null>(
    initialType ?? null
  );
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const typeLocked = initialType != null;
  const scopeDisplay = useNewContextScopeDisplayLabel(scope, opened);

  useEffect(() => {
    if (opened) {
      setSelectedType(initialType ?? null);
      setName('');
    }
  }, [opened, initialType]);

  const reset = () => {
    setSelectedType(null);
    setName('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    selectedType != null && name.trim().length > 0 && name.length <= NAME_MAX_LENGTH;

  const getBody = (): {
    name: string;
    companyId?: string;
    departmentId?: string;
    teamId?: string;
    personal?: true;
  } => {
    const trimmed = name.trim();
    if (scope.type === 'company') return { name: trimmed, companyId: scope.companyId };
    if (scope.type === 'department') return { name: trimmed, departmentId: scope.departmentId };
    if (scope.type === 'team') return { name: trimmed, teamId: scope.teamId };
    return { name: trimmed, personal: true };
  };

  const handleSubmit = async () => {
    if (!canSubmit || selectedType == null) return;
    setLoading(true);
    const endpoint = selectedType === 'process' ? '/api/v1/processes' : '/api/v1/projects';
    const body = getBody();
    try {
      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { contextId: string };
        notifications.show({
          title: t('toasts.contextCreatedTitle'),
          message:
            selectedType === 'process'
              ? t('toasts.processCreatedMessage')
              : t('toasts.projectCreatedMessage'),
          color: 'green',
        });
        onSuccess?.();
        handleClose();
        void navigate(contextUrl(created.contextId));
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        notifications.show({
          title: t('toasts.errorTitle'),
          message: data?.error ?? res.statusText,
          color: 'red',
        });
      }
    } catch (e) {
      notifications.show({
        title: t('toasts.errorTitle'),
        message: e instanceof Error ? e.message : 'Network error',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const typeTitle = (type: 'process' | 'project') =>
    type === 'process' ? t('modals.newContext.processTitle') : t('modals.newContext.projectTitle');
  const typeDescription = (type: 'process' | 'project') =>
    type === 'process'
      ? t('modals.newContext.processDescription')
      : t('modals.newContext.projectDescription');

  const modalTitle =
    typeLocked && initialType != null
      ? typeTitle(initialType)
      : t('modals.newContext.titleDefault');

  return (
    <Modal opened={opened} onClose={handleClose} title={modalTitle} size="sm">
      <Stack gap="md">
        <Select
          label={t('modals.newContext.scopeLabel')}
          data={
            scopeDisplay.label !== ''
              ? [{ value: scopeDisplay.label, label: scopeDisplay.label }]
              : []
          }
          value={scopeDisplay.label !== '' ? scopeDisplay.label : null}
          placeholder={scopeDisplay.isPending ? t('common:status.loading') : undefined}
          readOnly
          searchable={false}
          allowDeselect={false}
          comboboxProps={{ withinPortal: true }}
        />

        {typeLocked && initialType != null ? (
          <Text size="sm" c="dimmed">
            {typeDescription(initialType)}
          </Text>
        ) : (
          <div>
            <Text size="sm" fw={500} mb="xs">
              {t('modals.newContext.typeLabel')}
            </Text>
            <Radio.Group
              value={selectedType ?? ''}
              onChange={(v) => setSelectedType(v === 'process' || v === 'project' ? v : null)}
            >
              <Stack gap="xs">
                <Radio
                  value="process"
                  label={t('createMenu.process')}
                  description={typeDescription('process')}
                />
                <Radio
                  value="project"
                  label={t('createMenu.project')}
                  description={typeDescription('project')}
                />
              </Stack>
            </Radio.Group>
          </div>
        )}

        {selectedType != null && (
          <TextInput
            label={t('modals.newContext.nameLabel')}
            placeholder={t('modals.newContext.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            maxLength={NAME_MAX_LENGTH}
            required
            autoFocus
          />
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            disabled={!canSubmit}
            loading={loading}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {t('common:actions.create')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
