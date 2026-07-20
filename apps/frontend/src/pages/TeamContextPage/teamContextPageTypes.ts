export type TeamRes = {
  id: string;
  name: string;
  departmentId?: string;
  department?: { id: string; companyId?: string; company?: { id: string } };
};
