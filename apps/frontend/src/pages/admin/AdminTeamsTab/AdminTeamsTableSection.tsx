import { Alert, Group, Pagination, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useOrgRoleLabel } from '../../../hooks/useOrgRoleLabel.js';
import type { TeamBatchRow, TeamWithDept } from './adminTeamsTabTypes';

export type AdminTeamsTableSectionProps = {
  companyId: string | null;
  departmentsLength: number;
  allTeamsLength: number;
  filteredTeamsLength: number;
  limit: number;
  page: number;
  totalPages: number;
  pagedTeams: TeamWithDept[];
  teamBatchData: Record<string, TeamBatchRow> | undefined;
  onPageChange: (p: number) => void;
  onSelectTeam: (t: TeamWithDept) => void;
};

export function AdminTeamsTableSection({
  companyId,
  departmentsLength,
  allTeamsLength,
  filteredTeamsLength,
  limit,
  page,
  totalPages,
  pagedTeams,
  teamBatchData,
  onPageChange,
  onSelectTeam,
}: AdminTeamsTableSectionProps) {
  const { t: tAdmin } = useTranslation('admin');
  const roleLabel = useOrgRoleLabel();

  return (
    <>
      {companyId && departmentsLength > 0 && (
        <Table withTableBorder withColumnBorders mb="md" className="admin-table-hover">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Team</Table.Th>
              <Table.Th>{tAdmin('shared.department')}</Table.Th>
              <Table.Th>{roleLabel('teamLead')}</Table.Th>
              <Table.Th>{tAdmin('shared.members')}</Table.Th>
              <Table.Th>{roleLabel('teamLead')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pagedTeams.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text size="sm" c="dimmed">
                    {allTeamsLength === 0
                      ? 'No teams yet. Create a team to get started.'
                      : 'No teams match the filter.'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              pagedTeams.map((team) => {
                const batch = teamBatchData?.[team.id];
                const leadText = batch?.leadNames?.length ? batch.leadNames.join(', ') : '–';
                return (
                  <Table.Tr key={team.id}>
                    <Table.Td>
                      <Text
                        component="button"
                        type="button"
                        variant="link"
                        c="var(--mantine-primary-color-4)"
                        className="admin-link-hover"
                        size="sm"
                        style={{
                          cursor: 'pointer',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                        }}
                        onClick={() => onSelectTeam(team)}
                      >
                        {team.name}
                      </Text>
                    </Table.Td>
                    <Table.Td>{team.departmentName}</Table.Td>
                    <Table.Td>{leadText}</Table.Td>
                    <Table.Td>{batch != null ? String(batch.memberCount) : '–'}</Table.Td>
                    <Table.Td>{leadText}</Table.Td>
                  </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      )}
      {filteredTeamsLength > limit && (
        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={page} onChange={onPageChange} size="sm" />
        </Group>
      )}

      {!companyId && (
        <Alert color="blue" mt="md">
          No company set up. Create a company in the Company tab first.
        </Alert>
      )}
    </>
  );
}
