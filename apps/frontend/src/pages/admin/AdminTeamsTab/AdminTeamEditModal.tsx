import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { Department, Team } from 'backend/api-types';
import { useTranslation } from 'react-i18next';
import { formatBytes } from './adminTeamsTabFormat';
import type { AssignmentItem, TeamStatsRes, TeamWithDept } from './adminTeamsTabTypes';

export type AdminTeamEditModalProps = {
  team: TeamWithDept;
  onClose: () => void;
  departments: (Department & { teams: Team[] })[];
  teamCardEditing: boolean;
  setTeamCardEditing: (v: boolean) => void;
  editName: string;
  setEditName: (v: string) => void;
  editDepartmentId: string;
  setEditDepartmentId: (v: string) => void;
  editLeadId: string;
  setEditLeadId: (v: string) => void;
  editMemberIds: string[];
  setEditMemberIds: (v: string[]) => void;
  userOptions: { value: string; label: string }[];
  leadsForEdit: AssignmentItem[];
  leadsForEditPending: boolean;
  membersForEdit: AssignmentItem[];
  membersForEditPending: boolean;
  teamStatsData: TeamStatsRes | undefined;
  teamStatsPending: boolean;
  onStartEditCard: () => void;
  onSaveCard: () => void;
  saveLoading: boolean;
  onRequestDelete: () => void;
  deleteFromManageLoading: boolean;
};

export function AdminTeamEditModal({
  team,
  onClose,
  departments,
  teamCardEditing,
  setTeamCardEditing,
  editName,
  setEditName,
  editDepartmentId,
  setEditDepartmentId,
  editLeadId,
  setEditLeadId,
  editMemberIds,
  setEditMemberIds,
  userOptions,
  leadsForEdit,
  leadsForEditPending,
  membersForEdit,
  membersForEditPending,
  teamStatsData,
  teamStatsPending,
  onStartEditCard,
  onSaveCard,
  saveLoading,
  onRequestDelete,
  deleteFromManageLoading,
}: AdminTeamEditModalProps) {
  const { t } = useTranslation('admin');
  return (
    <Modal
      opened
      onClose={onClose}
      title={t('teams.editModal.title', { name: team.name })}
      size="lg"
      key={team.id}
    >
      <Tabs defaultValue="overview">
        <Tabs.List>
          <Tabs.Tab value="overview">{t('teams.editModal.tabs.overview')}</Tabs.Tab>
          <Tabs.Tab value="manage">{t('teams.editModal.tabs.manage')}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="overview" pt="md">
          <Card withBorder padding="md">
            <Group justify="space-between" mb="md">
              <Text size="sm" fw={600}>
                {t('teams.editModal.card.title')}
              </Text>
              {!teamCardEditing && (
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
            {teamCardEditing ? (
              <Stack gap="md">
                <TextInput
                  label={t('shared.name')}
                  value={editName}
                  onChange={(e) => setEditName(e.currentTarget.value)}
                  required
                />
                <Select
                  label={t('shared.department')}
                  data={departments.map((d) => ({ value: d.id, label: d.name }))}
                  value={editDepartmentId}
                  onChange={(v) => v && setEditDepartmentId(v)}
                  required
                />
                <Select
                  label={t('shared.lead')}
                  placeholder={t('teams.editModal.card.leadPlaceholder')}
                  data={userOptions}
                  value={editLeadId || null}
                  onChange={(v) => setEditLeadId(v ?? '')}
                  searchable
                  clearable
                />
                <MultiSelect
                  label={t('shared.members')}
                  placeholder={t('teams.editModal.card.membersPlaceholder')}
                  data={userOptions}
                  value={editMemberIds}
                  onChange={setEditMemberIds}
                  searchable
                  clearable
                />
                <Group gap="xs">
                  <Button size="sm" variant="default" onClick={() => setTeamCardEditing(false)}>
                    {t('common:actions.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={onSaveCard}
                    loading={saveLoading}
                    disabled={!editName.trim() || !editDepartmentId}
                  >
                    {t('common:actions.save')}
                  </Button>
                </Group>
              </Stack>
            ) : (
              <Stack gap="xs">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.name')}
                  </Text>
                  <Text size="sm">{team.name}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.department')}
                  </Text>
                  <Text size="sm">{team.departmentName}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.lead')}
                  </Text>
                  {leadsForEditPending ? (
                    <Loader size="xs" />
                  ) : leadsForEdit.length === 0 ? (
                    <Text size="sm">–</Text>
                  ) : (
                    <Text size="sm">{leadsForEdit[0]?.name ?? '–'}</Text>
                  )}
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.members')}
                  </Text>
                  {membersForEditPending ? (
                    <Loader size="xs" />
                  ) : membersForEdit.length === 0 ? (
                    <Text size="sm">–</Text>
                  ) : (
                    <Group gap="xs" mt={4} wrap="wrap">
                      {membersForEdit.map((m) => (
                        <Badge key={m.id} size="sm" variant="filled">
                          {m.name}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </div>
              </Stack>
            )}
          </Card>
          <Card withBorder padding="md" mt="md">
            <Text size="sm" fw={600} mb="xs">
              {t('shared.stats')}
            </Text>
            {teamStatsPending ? (
              <Loader size="sm" />
            ) : teamStatsData ? (
              <Group gap="lg">
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.storage')}
                  </Text>
                  <Text size="sm">{formatBytes(teamStatsData.storageBytesUsed)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.members')}
                  </Text>
                  <Text size="sm">{teamStatsData.memberCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.documents')}
                  </Text>
                  <Text size="sm">{teamStatsData.documentCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.processes')}
                  </Text>
                  <Text size="sm">{teamStatsData.processCount}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t('shared.projects')}
                  </Text>
                  <Text size="sm">{teamStatsData.projectCount}</Text>
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
              {t('teams.editModal.manage.deleteButton')}
            </Button>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
