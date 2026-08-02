import {
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { formatBytes } from './adminDepartmentsTabFormat';
import type { DepartmentStatsRes, DepartmentWithCompany } from './adminDepartmentsTabTypes';

export type AdminDepartmentEditModalProps = {
  department: DepartmentWithCompany;
  onClose: () => void;
  departmentCardEditing: boolean;
  setDepartmentCardEditing: (v: boolean) => void;
  editName: string;
  setEditName: (v: string) => void;
  editLeadId: string;
  setEditLeadId: (v: string) => void;
  userOptions: { value: string; label: string }[];
  leadsForEdit: { id: string; name: string }[];
  leadsForEditPending: boolean;
  departmentStatsData: DepartmentStatsRes | undefined;
  departmentStatsPending: boolean;
  onStartEditCard: () => void;
  onSaveCard: () => void;
  saveLoading: boolean;
  onRequestDelete: () => void;
  deleteFromManageLoading: boolean;
};

export function AdminDepartmentEditModal({
  department,
  onClose,
  departmentCardEditing,
  setDepartmentCardEditing,
  editName,
  setEditName,
  editLeadId,
  setEditLeadId,
  userOptions,
  leadsForEdit,
  leadsForEditPending,
  departmentStatsData,
  departmentStatsPending,
  onStartEditCard,
  onSaveCard,
  saveLoading,
  onRequestDelete,
  deleteFromManageLoading,
}: AdminDepartmentEditModalProps) {
  const { t } = useTranslation('admin');
  return (
    <Modal
      opened
      onClose={onClose}
      title={t('departments.editModal.title', { name: department.name })}
      size="lg"
      key={department.id}
    >
      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview">{t('departments.editModal.tabs.overview')}</Tabs.Tab>
          <Tabs.Tab value="manage">{t('departments.editModal.tabs.manage')}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" pt="md">
          <Card withBorder padding="md">
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={600}>
                {t('departments.editModal.card.title')}
              </Text>
              {!departmentCardEditing && (
                <Button
                  size="xs"
                  variant="filled"
                  leftSection={<IconPencil size={14} />}
                  onClick={onStartEditCard}
                >
                  {t('common:actions.edit')}
                </Button>
              )}
            </Group>
            {departmentCardEditing ? (
              <Stack gap="md">
                <TextInput
                  label={t('shared.name')}
                  value={editName}
                  onChange={(e) => setEditName(e.currentTarget.value)}
                  required
                />
                <Select
                  label={t('shared.lead')}
                  placeholder={t('departments.editModal.card.leadPlaceholder')}
                  data={userOptions}
                  value={editLeadId || null}
                  onChange={(v) => setEditLeadId(v ?? '')}
                  searchable
                  clearable
                />
                <Group gap="xs">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setDepartmentCardEditing(false)}
                  >
                    {t('common:actions.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSaveCard}
                    loading={saveLoading}
                    disabled={!editName.trim()}
                  >
                    {t('common:actions.save')}
                  </Button>
                </Group>
              </Stack>
            ) : leadsForEditPending ? (
              <Loader size="sm" />
            ) : (
              <Stack gap="xs">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.name')}
                  </Text>
                  <Text size="sm">{department.name}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.lead')}
                  </Text>
                  <Text size="sm">
                    {leadsForEdit.length === 0 ? '–' : (leadsForEdit[0]?.name ?? '–')}
                  </Text>
                </div>
              </Stack>
            )}
          </Card>
          <Card withBorder padding="md" mt="md">
            <Text size="sm" fw={600} mb="xs">
              {t('shared.stats')}
            </Text>
            {departmentStatsPending ? (
              <Loader size="sm" />
            ) : departmentStatsData ? (
              <Group gap="lg">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.storage')}
                  </Text>
                  <Text size="sm">{formatBytes(departmentStatsData.storageBytesUsed)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.teams')}
                  </Text>
                  <Text size="sm">{departmentStatsData.teamCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.members')}
                  </Text>
                  <Text size="sm">{departmentStatsData.memberCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.documents')}
                  </Text>
                  <Text size="sm">{departmentStatsData.documentCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.processes')}
                  </Text>
                  <Text size="sm">{departmentStatsData.processCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.projects')}
                  </Text>
                  <Text size="sm">{departmentStatsData.projectCount}</Text>
                </div>
              </Group>
            ) : null}
          </Card>
        </Tabs.Panel>
        <Tabs.Panel value="manage" pt="md">
          <Card withBorder padding="md">
            <Text size="sm" fw={600} mb="xs">
              {t('shared.manage')}
            </Text>
            <Text size="xs" c="dimmed" mb="md">
              {t('shared.manageHint')}
            </Text>
            <Button
              size="sm"
              variant="filled"
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={onRequestDelete}
              loading={deleteFromManageLoading}
            >
              {t('departments.editModal.manage.deleteButton')}
            </Button>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
