import type { PrismaClient } from '../../generated/prisma/client.js';
import { hashPassword } from '../domains/auth/services/password.js';
import type { SeedCsvData, SeedMasterData } from './types.js';

async function seedMasterData(prisma: PrismaClient, csv: SeedCsvData): Promise<SeedMasterData> {
  const companyById = new Map<string, string>();
  for (const row of csv.companies) {
    const company = await prisma.company.create({ data: { name: row.name } });
    companyById.set(row.name, company.id);
  }

  const departmentById = new Map<string, string>();
  for (const row of csv.departments) {
    const companyId = companyById.get(row.company_name);
    if (!companyId) continue;
    const department = await prisma.department.create({
      data: { name: row.name, companyId },
    });
    departmentById.set(row.name, department.id);
  }

  const teamById = new Map<string, string>();
  for (const row of csv.teams) {
    const departmentId = departmentById.get(row.department_name);
    if (!departmentId) continue;
    const team = await prisma.team.create({
      data: { name: row.name, departmentId },
    });
    teamById.set(row.name, team.id);
  }

  const userById = new Map<string, string>();
  for (const row of csv.users) {
    const passwordHash = await hashPassword(row.password);
    const user = await prisma.user.create({
      data: {
        name: row.name,
        email: row.email,
        passwordHash,
        isAdmin: false,
      },
    });
    userById.set(row.email, user.id);
  }

  for (const row of csv.teamMembers) {
    const teamId = teamById.get(row.team_name);
    const userId = userById.get(row.user_email);
    if (!teamId || !userId) continue;
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }

  for (const row of csv.teamLeaders) {
    const teamId = teamById.get(row.team_name);
    const userId = userById.get(row.user_email);
    if (!teamId || !userId) continue;
    await prisma.teamLead.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }

  for (const row of csv.teamAuthors) {
    const teamId = teamById.get(row.team_name);
    const userId = userById.get(row.user_email);
    if (!teamId || !userId) continue;
    await prisma.teamAuthor.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }

  for (const row of csv.departmentLeads) {
    const departmentId = departmentById.get(row.department_name);
    const userId = userById.get(row.user_email);
    if (!departmentId || !userId) continue;
    await prisma.departmentLead.upsert({
      where: { departmentId_userId: { departmentId, userId } },
      create: { departmentId, userId },
      update: {},
    });
  }

  for (const row of csv.companyLeads) {
    const companyId = companyById.get(row.company_name);
    const userId = userById.get(row.user_email);
    if (!companyId || !userId) continue;
    await prisma.companyLead.upsert({
      where: { companyId_userId: { companyId, userId } },
      create: { companyId, userId },
      update: {},
    });
  }

  const knowledgeManagerUserIds = new Set<string>();
  for (const row of csv.knowledgeManagerCompanies) {
    const companyId = companyById.get(row.company_name);
    const userId = userById.get(row.user_email);
    if (!companyId || !userId) continue;
    knowledgeManagerUserIds.add(userId);
    await prisma.knowledgeManagerCompany.upsert({
      where: { companyId_userId: { companyId, userId } },
      create: { companyId, userId },
      update: {},
    });
  }
  for (const row of csv.knowledgeManagerDepartments) {
    const departmentId = departmentById.get(row.department_name);
    const userId = userById.get(row.user_email);
    if (!departmentId || !userId) continue;
    knowledgeManagerUserIds.add(userId);
    await prisma.knowledgeManagerDepartment.upsert({
      where: { departmentId_userId: { departmentId, userId } },
      create: { departmentId, userId },
      update: {},
    });
  }
  for (const row of csv.knowledgeManagerTeams) {
    const teamId = teamById.get(row.team_name);
    const userId = userById.get(row.user_email);
    if (!teamId || !userId) continue;
    knowledgeManagerUserIds.add(userId);
    await prisma.knowledgeManagerTeam.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }
  if (knowledgeManagerUserIds.size > 0) {
    await prisma.user.updateMany({
      where: { id: { in: [...knowledgeManagerUserIds] } },
      data: { isKnowledgeManager: true },
    });
  }

  return {
    ...csv,
    companyById,
    departmentById,
    teamById,
    userById,
    firstUserEmail: csv.users[0]?.email,
  };
}

export { seedMasterData };
