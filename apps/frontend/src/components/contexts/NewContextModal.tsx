import { Button, Group, Modal, Radio, Select, Stack, Text, TextInput } from '@mantine/core';
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { apiFetch } from '../../api/client';
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

const TYPE_LABELS: Record<'process' | 'project', { title: string; description: string }> = {
  process: {
    title: 'New process',
    description: 'Recurring workflows and processes',
  },
  project: {
    title: 'New project',
    description: 'Time-limited initiatives',
  },
};

export function NewContextModal({
  opened,
  onClose,
  scope,
  onSuccess,
  initialType,
}: NewContextModalProps) {
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
        notifications.show({
          title: 'Context created',
          message: selectedType === 'process' ? 'Process was created.' : 'Project was created.',
          color: 'green',
        });
        onSuccess?.();
        handleClose();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        notifications.show({
          title: 'Error',
          message: data?.error ?? res.statusText,
          color: 'red',
        });
      }
    } catch (e) {
      notifications.show({
        title: 'Error',
        message: e instanceof Error ? e.message : 'Network error',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const modalTitle =
    typeLocked && initialType != null ? TYPE_LABELS[initialType].title : 'New context';

  return (
    <Modal opened={opened} onClose={handleClose} title={modalTitle} size="sm">
      <Stack gap="md">
        <Select
          label="Scope"
          data={
            scopeDisplay.label !== ''
              ? [{ value: scopeDisplay.label, label: scopeDisplay.label }]
              : []
          }
          value={scopeDisplay.label !== '' ? scopeDisplay.label : null}
          placeholder={scopeDisplay.isPending ? 'Loading…' : undefined}
          readOnly
          searchable={false}
          allowDeselect={false}
          comboboxProps={{ withinPortal: true }}
        />

        {typeLocked && initialType != null ? (
          <Text size="sm" c="dimmed">
            {TYPE_LABELS[initialType].description}
          </Text>
        ) : (
          <div>
            <Text size="sm" fw={500} mb="xs">
              Type (required)
            </Text>
            <Radio.Group
              value={selectedType ?? ''}
              onChange={(v) => setSelectedType(v === 'process' || v === 'project' ? v : null)}
            >
              <Stack gap="xs">
                <Radio
                  value="process"
                  label="Process"
                  description="Recurring workflows and processes"
                />
                <Radio value="project" label="Project" description="Time-limited initiatives" />
              </Stack>
            </Radio.Group>
          </div>
        )}

        {selectedType != null && (
          <TextInput
            label="Name"
            placeholder="Context name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            maxLength={NAME_MAX_LENGTH}
            required
            autoFocus
          />
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            loading={loading}
            onClick={() => {
              void handleSubmit();
            }}
          >
            Create
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
