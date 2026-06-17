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
import { apiFetch } from '../../../api/client.js';
import {
  BROADCAST_TARGET_OPTIONS,
  defaultFutureDatetimeLocal,
  isDatetimeLocalInFuture,
  minDatetimeLocalNow,
  sendAtFieldLabel,
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
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', 'broadcast-picker'] as const,
    queryFn: async () => {
      const res = await apiFetch('/api/v1/admin/users?limit=200&offset=0&includeDeactivated=false');
      if (!res.ok) throw new Error('Failed to load users');
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
    <Modal opened={opened} onClose={onClose} title="Create system message" size="lg" centered>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Send immediately or schedule for a future time. Scheduled messages are managed in the
          Scheduler tab.
        </Text>
        <TextInput
          label="Title"
          value={draft.title}
          onChange={(e) => onDraftChange({ ...draft, title: e.currentTarget.value })}
          maxLength={200}
          required
        />
        <Textarea
          label="Message"
          value={draft.message}
          onChange={(e) => onDraftChange({ ...draft, message: e.currentTarget.value })}
          minRows={4}
          maxLength={4000}
          required
        />
        <Select
          label="Audience"
          data={BROADCAST_TARGET_OPTIONS}
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
              label="Users"
              data={userOptions}
              value={draft.userIds}
              onChange={(userIds) => onDraftChange({ ...draft, userIds })}
              searchable
              nothingFoundMessage="No users"
            />
          )
        ) : null}
        <Radio.Group
          label="Delivery"
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
            <Radio value="now" label="Send now" />
            <Radio value="scheduled" label="Schedule for later" />
          </Group>
        </Radio.Group>
        {draft.deliveryMode === 'scheduled' ? (
          <TextInput
            label={sendAtFieldLabel()}
            description="Date and time use your browser's local timezone."
            type="datetime-local"
            value={draft.sendAtLocal}
            min={minDatetimeLocalNow()}
            onChange={(e) => onDraftChange({ ...draft, sendAtLocal: e.currentTarget.value })}
            required
            error={!scheduledInFuture ? 'Choose a date and time in the future.' : undefined}
          />
        ) : null}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onCreate} loading={creating} disabled={!canCreate}>
            Create message
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
