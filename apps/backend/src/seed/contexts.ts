import type { PrismaClient } from '../../generated/prisma/client.js';
import {
  setContextDisplayFromProcess,
  setContextDisplayFromProject,
} from '../domains/organisation/services/contextOwnerDisplay.js';
import type { SeedContextData, SeedMasterData, SeedOwnerData } from './types.js';

async function seedContexts(
  prisma: PrismaClient,
  masterData: SeedMasterData,
  ownerData: SeedOwnerData
): Promise<SeedContextData> {
  const processByScope = new Map<string, string>();
  const projectByScope = new Map<string, string>();

  const companyOwnerId = ownerData.ownerByCompany.get(ownerData.companyName);
  if (companyOwnerId) {
    const ctx = await prisma.context.create({ data: {} });
    const process = await prisma.process.create({
      data: { name: 'Unternehmensprozesse', contextId: ctx.id, ownerId: companyOwnerId },
    });
    await setContextDisplayFromProcess(prisma, ctx.id, process.id);
    processByScope.set(`company:${ownerData.companyName}`, process.id);

    const ctx2 = await prisma.context.create({ data: {} });
    const project = await prisma.project.create({
      data: { name: 'Software X', contextId: ctx2.id, ownerId: companyOwnerId },
    });
    await setContextDisplayFromProject(prisma, ctx2.id, project.id);
    projectByScope.set(`company:${ownerData.companyName}`, project.id);
  }

  for (const row of masterData.departments) {
    const ownerId = ownerData.ownerByDepartment.get(row.name);
    if (!ownerId) continue;
    const ctx = await prisma.context.create({ data: {} });
    const process = await prisma.process.create({
      data: { name: `${row.name} – Prozesse`, contextId: ctx.id, ownerId },
    });
    await setContextDisplayFromProcess(prisma, ctx.id, process.id);
    processByScope.set(`department:${row.name}`, process.id);

    const ctx2 = await prisma.context.create({ data: {} });
    const project = await prisma.project.create({
      data: { name: `${row.name} – Vorhaben`, contextId: ctx2.id, ownerId },
    });
    await setContextDisplayFromProject(prisma, ctx2.id, project.id);
    projectByScope.set(`department:${row.name}`, project.id);
  }

  for (const row of masterData.teams) {
    const ownerId = ownerData.ownerByTeam.get(row.name);
    if (!ownerId) continue;
    const ctx = await prisma.context.create({ data: {} });
    const process = await prisma.process.create({
      data: { name: `${row.name} – Leitfaden`, contextId: ctx.id, ownerId },
    });
    await setContextDisplayFromProcess(prisma, ctx.id, process.id);
    processByScope.set(`team:${row.name}`, process.id);

    const ctx2 = await prisma.context.create({ data: {} });
    const project = await prisma.project.create({
      data: { name: `${row.name} – Sprintarbeit`, contextId: ctx2.id, ownerId },
    });
    await setContextDisplayFromProject(prisma, ctx2.id, project.id);
    projectByScope.set(`team:${row.name}`, project.id);
  }

  if (masterData.firstUserEmail && ownerData.ownerByUser.has(masterData.firstUserEmail)) {
    const ownerId = ownerData.ownerByUser.get(masterData.firstUserEmail)!;
    const ctx = await prisma.context.create({ data: {} });
    const process = await prisma.process.create({
      data: { name: 'Persönliche Notizen', contextId: ctx.id, ownerId },
    });
    await setContextDisplayFromProcess(prisma, ctx.id, process.id);
    processByScope.set('personal:', process.id);

    const ctx2 = await prisma.context.create({ data: {} });
    const project = await prisma.project.create({
      data: { name: 'Persönliches Vorhaben', contextId: ctx2.id, ownerId },
    });
    await setContextDisplayFromProject(prisma, ctx2.id, project.id);
    projectByScope.set('personal:', project.id);
  }

  return {
    processByScope,
    projectByScope,
    companyProjectId: projectByScope.get(`company:${ownerData.companyName}`) ?? null,
  };
}

export { seedContexts };
