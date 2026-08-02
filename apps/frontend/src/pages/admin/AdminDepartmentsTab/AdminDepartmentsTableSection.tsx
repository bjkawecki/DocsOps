import { Alert, Group, Pagination, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { DepartmentWithCompany } from './adminDepartmentsTabTypes';

export type AdminDepartmentsTableSectionProps = {
  companiesLength: number;
  allDepartmentsLength: number;
  filteredDepartmentsLength: number;
  limit: number;
  page: number;
  totalPages: number;
  pagedDepartments: DepartmentWithCompany[];
  memberCounts: Record<string, number>;
  onPageChange: (p: number) => void;
  onSelectDepartment: (d: DepartmentWithCompany) => void;
};

export function AdminDepartmentsTableSection({
  companiesLength,
  allDepartmentsLength,
  filteredDepartmentsLength,
  limit,
  page,
  totalPages,
  pagedDepartments,
  memberCounts,
  onPageChange,
  onSelectDepartment,
}: AdminDepartmentsTableSectionProps) {
  const { t } = useTranslation('admin');
  return (
    <>
      {companiesLength === 0 ? (
        <Alert color="blue">{t('shared.noCompanySetup')}</Alert>
      ) : (
        <>
          <Table withTableBorder withColumnBorders mb="md" className="admin-table-hover">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('departments.table.department')}</Table.Th>
                <Table.Th>{t('departments.table.company')}</Table.Th>
                <Table.Th>{t('departments.table.leads')}</Table.Th>
                <Table.Th>{t('departments.table.members')}</Table.Th>
                <Table.Th>{t('departments.table.teams')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pagedDepartments.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text size="sm" c="dimmed">
                      {allDepartmentsLength === 0
                        ? t('departments.table.emptyNoDepartments')
                        : t('departments.table.emptyNoMatch')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                pagedDepartments.map((d) => {
                  const leadNames = d.departmentLeads?.map((l) => l.user.name).join(', ') ?? '';
                  return (
                    <Table.Tr key={d.id}>
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
                          onClick={() => onSelectDepartment(d)}
                        >
                          {d.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>{d.companyName}</Table.Td>
                      <Table.Td>{leadNames || '–'}</Table.Td>
                      <Table.Td>
                        {memberCounts[d.id] !== undefined ? String(memberCounts[d.id]) : '–'}
                      </Table.Td>
                      <Table.Td>
                        {d._count?.teams !== undefined ? String(d._count.teams) : '–'}
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </>
      )}
      {filteredDepartmentsLength > limit && (
        <Group justify="flex-end" mt="md">
          <Pagination total={totalPages} value={page} onChange={onPageChange} size="sm" />
        </Group>
      )}
    </>
  );
}
