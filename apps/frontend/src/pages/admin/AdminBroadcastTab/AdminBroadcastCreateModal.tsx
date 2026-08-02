import {
  Button,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Radio,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../../api/client.js';
import {
  defaultFutureDatetimeLocal,
  isDatetimeLocalInFuture,
  minDatetimeLocalNow,
  sendAtFieldLabel,
  useBroadcastTargetOptions,
  type BroadcastDraft,
  type BroadcastTargetKind,
} from './adminBroadcastTypes.js';

type AdminBroadcastCreateModalProps = {
  opened: boolean;
  onClose: () => void;
  draft: BroadcastDraft;
  onDraftChange: (draft: BroadcastDraft) => void;
  onCreate: () => void;
  creating: boolean;
};

export function AdminBroadcastCreateModal({
  opened,
  onClose,
  draft,
  onDraftChange,
  onCreate,
  creating,
}: AdminBroadcastCreateModalProps) {
  const { t } = useTranslation('admin');
  const targetOptions = useBroadcastTargetOptions();
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'broadcast-picker'] as const,
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/users?limit=100&offset=0&includeDeactivated=false');
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      const body = (await res.json()) as {
        items: Array<{ id: string; name: string; email: string | null }>;
      };
      return body.items;
    },
    enabled: opened && draft.targetKind === 'users',
  });

  const userOptions =
    usersQuery.data?.map((u) => ({
      value: u.id,
      label: u.email != null ? `${u.name} (${u.email})` : u.name,
    })) ?? [];

  const scheduledInFuture =
    draft.deliveryMode !== 'scheduled' || isDatetimeLocalInFuture(draft.sendAtLocal);

  const canCreate =
    draft.title.trim() !== '' &&
    draft.message.trim() !== '' &&
    (draft.targetKind !== 'users' || draft.userIds.length > 0) &&
    scheduledInFuture;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('broadcast.createModal.title')}
      size="lg"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('broadcast.createModal.intro')}
        </Text>
        <TextInput
          label={t('broadcast.createModal.titleLabel')}
          value={draft.title}
          onChange={(e) => onDraftChange({ ...draft, title: e.currentTarget.value })}
          maxLength={200}
          required
        />
        <Textarea
          label={t('broadcast.createModal.messageLabel')}
          value={draft.message}
          onChange={(e) => onDraftChange({ ...draft, message: e.currentTarget.value })}
          minRows={4}
          maxLength={4000}
          required
        />
        <Select
          label={t('broadcast.createModal.audienceLabel')}
          data={targetOptions}
          value={draft.targetKind}
          onChange={(v) =>
            onDraftChange({
              ...draft,
              targetKind: (v as BroadcastTargetKind | null) ?? 'all',
              userIds: v === 'users' ? draft.userIds : [],
            })
          }
        />
        {draft.targetKind === 'users' ? (
          usersQuery.isPending ? (
            <Loader size="sm" />
          ) : (
            <MultiSelect
              label={t('broadcast.createModal.usersLabel')}
              data={userOptions}
              value={draft.userIds}
              onChange={(userIds) => onDraftChange({ ...draft, userIds })}
              searchable
              nothingFoundMessage={t('broadcast.createModal.usersNothingFound')}
            />
          )
        ) : null}
        <Radio.Group
          label={t('broadcast.createModal.deliveryLabel')}
          value={draft.deliveryMode}
          onChange={(value) =>
            onDraftChange({
              ...draft,
              deliveryMode: value as BroadcastDraft['deliveryMode'],
              ...(value === 'scheduled' ? { sendAtLocal: defaultFutureDatetimeLocal() } : {}),
            })
          }
        >
          <Group gap="md" mt="xs">
            <Radio value="now" label={t('broadcast.createModal.deliveryNow')} />
            <Radio value="scheduled" label={t('broadcast.createModal.deliveryScheduled')} />
          </Group>
        </Radio.Group>
        {draft.deliveryMode === 'scheduled' ? (
          <TextInput
            label={sendAtFieldLabel(t('broadcast.createModal.sendAtLabel'))}
            description={t('broadcast.createModal.sendAtDescription')}
            type="datetime-local"
            value={draft.sendAtLocal}
            min={minDatetimeLocalNow()}
            onChange={(e) => onDraftChange({ ...draft, sendAtLocal: e.currentTarget.value })}
            required
            error={!scheduledInFuture ? t('broadcast.createModal.sendAtError') : undefined}
          />
        ) : null}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>
          <Button onClick={onCreate} loading={creating} disabled={!canCreate}>
            {t('actions.createMessage')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
