/* eslint-disable max-lines -- sequential import phases share one ID map */
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { Prisma, PrismaClient } from '../../../../../generated/prisma/client.js';
import type { StorageService } from '../../../../infrastructure/storage/index.js';
import { ExportIdMap } from './idRemap.js';
import type { AttachmentsMap } from './exportDomainData.js';
import type { PlatformImportRunStatus } from '../../../../../generated/prisma/client.js';
import { readExportUsers, resolveOrCreateImportedUser } from './platformImportUsers.js';
import { stripIncompatibleOrgAssignments } from '../../../organisation/services/scopeAssignmentRules.js';

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

export type ImportPhaseUpdater = (status: PlatformImportRunStatus) => Promise<void>;

export async function importDomainDataFromDirectory(
  prisma: PrismaClient,
  storage: StorageService,
  args: {
    bundleDir: string;
    transferPasswordHashes: boolean;
    onPhase: ImportPhaseUpdater;
  }
): Promise<{ idMap: ExportIdMap }> {
  const idMap = new ExportIdMap();

  const org = await readJson<{
    companies: Array<{ exportId: string; name: string }>;
    departments: Array<{ exportId: string; companyExportId: string; name: string }>;
    teams: Array<{ exportId: string; departmentExportId: string; name: string }>;
    teamMembers: Array<{ teamExportId: string; userExportId: string }>;
    teamLeads: Array<{ teamExportId: string; userExportId: string }>;
    departmentLeads: Array<{ departmentExportId: string; userExportId: string }>;
    companyLeads: Array<{ companyExportId: string; userExportId: string }>;
  }>(join(args.bundleDir, 'organization.json'));

  await args.onPhase('importing_organization');

  for (const c of org.companies) {
    const created = await prisma.company.create({ data: { name: c.name } });
    idMap.set(c.exportId, created.id);
  }
  for (const d of org.departments) {
    const created = await prisma.department.create({
      data: {
        name: d.name,
        companyId: idMap.getOrThrow(d.companyExportId),
      },
    });
    idMap.set(d.exportId, created.id);
  }
  for (const t of org.teams) {
    const created = await prisma.team.create({
      data: {
        name: t.name,
        departmentId: idMap.getOrThrow(t.departmentExportId),
      },
    });
    idMap.set(t.exportId, created.id);
  }

  const users = await readExportUsers(args.bundleDir);

  await args.onPhase('importing_users');

  const importedUserIds: string[] = [];
  for (const u of users) {
    const userId = await resolveOrCreateImportedUser(prisma, u, args.transferPasswordHashes);
    idMap.set(u.exportId, userId);
    importedUserIds.push(userId);
  }

  for (const m of org.teamMembers) {
    await prisma.teamMember.create({
      data: {
        teamId: idMap.getOrThrow(m.teamExportId),
        userId: idMap.getOrThrow(m.userExportId),
      },
    });
  }
  for (const l of org.teamLeads) {
    await prisma.teamLead.create({
      data: {
        teamId: idMap.getOrThrow(l.teamExportId),
        userId: idMap.getOrThrow(l.userExportId),
      },
    });
  }
  for (const l of org.departmentLeads) {
    await prisma.departmentLead.create({
      data: {
        departmentId: idMap.getOrThrow(l.departmentExportId),
        userId: idMap.getOrThrow(l.userExportId),
      },
    });
  }
  for (const l of org.companyLeads) {
    await prisma.companyLead.create({
      data: {
        companyId: idMap.getOrThrow(l.companyExportId),
        userId: idMap.getOrThrow(l.userExportId),
      },
    });
  }

  for (const userId of importedUserIds) {
    await stripIncompatibleOrgAssignments(prisma, userId);
  }

  const owners = await readJson<
    Array<{
      exportId: string;
      companyExportId: string | null;
      departmentExportId: string | null;
      teamExportId: string | null;
      ownerUserExportId: string | null;
      displayName: string | null;
    }>
  >(join(args.bundleDir, 'owners.json'));

  await args.onPhase('importing_owners');

  for (const o of owners) {
    const created = await prisma.owner.create({
      data: {
        companyId: idMap.get(o.companyExportId),
        departmentId: idMap.get(o.departmentExportId),
        teamId: idMap.get(o.teamExportId),
        ownerUserId: idMap.get(o.ownerUserExportId),
        displayName: o.displayName,
      },
    });
    idMap.set(o.exportId, created.id);
  }

  const ctxData = await readJson<{
    contexts: Array<{
      exportId: string;
      displayName: string | null;
      contextType: string | null;
      ownerDisplayName: string | null;
    }>;
    processes: Array<{
      exportId: string;
      name: string;
      contextExportId: string;
      ownerExportId: string;
      deletedAt: string | null;
      archivedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    projects: Array<{
      exportId: string;
      name: string;
      contextExportId: string;
      ownerExportId: string;
      deletedAt: string | null;
      archivedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    subcontexts: Array<{
      exportId: string;
      name: string;
      contextExportId: string;
      projectExportId: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }>(join(args.bundleDir, 'contexts.json'));

  await args.onPhase('importing_contexts');

  for (const c of ctxData.contexts) {
    const created = await prisma.context.create({
      data: {
        displayName: c.displayName,
        contextType: c.contextType,
        ownerDisplayName: c.ownerDisplayName,
      },
    });
    idMap.set(c.exportId, created.id);
  }
  for (const p of ctxData.processes) {
    const created = await prisma.process.create({
      data: {
        name: p.name,
        contextId: idMap.getOrThrow(p.contextExportId),
        ownerId: idMap.getOrThrow(p.ownerExportId),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
        archivedAt: p.archivedAt ? new Date(p.archivedAt) : null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    idMap.set(p.exportId, created.id);
  }
  for (const p of ctxData.projects) {
    const created = await prisma.project.create({
      data: {
        name: p.name,
        contextId: idMap.getOrThrow(p.contextExportId),
        ownerId: idMap.getOrThrow(p.ownerExportId),
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
        archivedAt: p.archivedAt ? new Date(p.archivedAt) : null,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
    idMap.set(p.exportId, created.id);
  }
  for (const s of ctxData.subcontexts) {
    const created = await prisma.subcontext.create({
      data: {
        name: s.name,
        contextId: idMap.getOrThrow(s.contextExportId),
        projectId: idMap.getOrThrow(s.projectExportId),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
    idMap.set(s.exportId, created.id);
  }

  const documents = await readJson<
    Array<{
      exportId: string;
      title: string;
      draftBlocks: Prisma.InputJsonValue | null;
      draftRevision: number;
      pdfUrl: string | null;
      contextExportId: string | null;
      deletedAt: string | null;
      archivedAt: string | null;
      publishedAt: string | null;
      description: string | null;
      createdByExportId: string | null;
      createdAt: string;
      updatedAt: string;
      currentPublishedVersionExportId: string | null;
    }>
  >(join(args.bundleDir, 'documents.json'));

  await args.onPhase('importing_documents');

  for (const d of documents) {
    const created = await prisma.document.create({
      data: {
        title: d.title,
        draftBlocks: d.draftBlocks ?? undefined,
        draftRevision: d.draftRevision,
        pdfUrl: null,
        contextId: idMap.get(d.contextExportId),
        deletedAt: d.deletedAt ? new Date(d.deletedAt) : null,
        archivedAt: d.archivedAt ? new Date(d.archivedAt) : null,
        // publishedAt deferred until currentPublishedVersionId exists (DB CHECK constraint).
        publishedAt: null,
        description: d.description,
        createdById: idMap.get(d.createdByExportId),
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
        currentPublishedVersionId: null,
      },
    });
    idMap.set(d.exportId, created.id);
  }

  const versions = await readJson<
    Array<{
      exportId: string;
      documentExportId: string;
      blocks: Prisma.InputJsonValue | null;
      blocksSchemaVersion: number | null;
      versionNumber: number;
      createdAt: string;
      createdByExportId: string | null;
      parentVersionExportId: string | null;
    }>
  >(join(args.bundleDir, 'document-versions.json'));

  await args.onPhase('importing_versions');

  for (const v of versions) {
    const created = await prisma.documentVersion.create({
      data: {
        documentId: idMap.getOrThrow(v.documentExportId),
        blocks: v.blocks ?? undefined,
        blocksSchemaVersion: v.blocksSchemaVersion,
        versionNumber: v.versionNumber,
        createdAt: new Date(v.createdAt),
        createdById: idMap.get(v.createdByExportId),
        parentVersionId: null,
      },
    });
    idMap.set(v.exportId, created.id);
  }
  for (const v of versions) {
    if (!v.parentVersionExportId) continue;
    await prisma.documentVersion.update({
      where: { id: idMap.getOrThrow(v.exportId) },
      data: { parentVersionId: idMap.getOrThrow(v.parentVersionExportId) },
    });
  }

  for (const d of documents) {
    if (!d.currentPublishedVersionExportId) continue;
    await prisma.document.update({
      where: { id: idMap.getOrThrow(d.exportId) },
      data: {
        currentPublishedVersionId: idMap.getOrThrow(d.currentPublishedVersionExportId),
        publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
      },
    });
  }

  const tagsData = await readJson<{
    tags: Array<{ exportId: string; name: string; ownerExportId: string }>;
    documentTags: Array<{ documentExportId: string; tagExportId: string }>;
  }>(join(args.bundleDir, 'tags.json'));

  await args.onPhase('importing_tags');

  for (const t of tagsData.tags) {
    const created = await prisma.tag.create({
      data: {
        name: t.name,
        ownerId: idMap.getOrThrow(t.ownerExportId),
      },
    });
    idMap.set(t.exportId, created.id);
  }
  for (const dt of tagsData.documentTags) {
    await prisma.documentTag.create({
      data: {
        documentId: idMap.getOrThrow(dt.documentExportId),
        tagId: idMap.getOrThrow(dt.tagExportId),
      },
    });
  }

  const grants = await readJson<{
    users: Array<{ documentExportId: string; userExportId: string; role: 'Read' | 'Write' }>;
    teams: Array<{ documentExportId: string; teamExportId: string; role: 'Read' | 'Write' }>;
    departments: Array<{
      documentExportId: string;
      departmentExportId: string;
      role: 'Read' | 'Write';
    }>;
  }>(join(args.bundleDir, 'grants.json'));

  await args.onPhase('importing_grants');

  for (const g of grants.users) {
    await prisma.documentGrantUser.create({
      data: {
        documentId: idMap.getOrThrow(g.documentExportId),
        userId: idMap.getOrThrow(g.userExportId),
        role: g.role,
      },
    });
  }
  for (const g of grants.teams) {
    await prisma.documentGrantTeam.create({
      data: {
        documentId: idMap.getOrThrow(g.documentExportId),
        teamId: idMap.getOrThrow(g.teamExportId),
        role: g.role,
      },
    });
  }
  for (const g of grants.departments) {
    await prisma.documentGrantDepartment.create({
      data: {
        documentId: idMap.getOrThrow(g.documentExportId),
        departmentId: idMap.getOrThrow(g.departmentExportId),
        role: g.role,
      },
    });
  }

  const pins = await readJson<
    Array<{
      exportId: string;
      documentExportId: string;
      scopeType: 'team' | 'department' | 'company';
      scopeExportId: string;
      order: number;
      pinnedByExportId: string | null;
      createdAt: string;
    }>
  >(join(args.bundleDir, 'pins.json'));

  await args.onPhase('importing_pins');

  for (const p of pins) {
    const created = await prisma.documentPinnedInScope.create({
      data: {
        documentId: idMap.getOrThrow(p.documentExportId),
        scopeType: p.scopeType,
        scopeId: idMap.getOrThrow(p.scopeExportId),
        order: p.order,
        pinnedById: idMap.get(p.pinnedByExportId),
        createdAt: new Date(p.createdAt),
      },
    });
    idMap.set(p.exportId, created.id);
  }

  const comments = await readJson<
    Array<{
      exportId: string;
      documentExportId: string;
      authorExportId: string;
      text: string;
      parentExportId: string | null;
      anchorHeadingId: string | null;
      deletedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >(join(args.bundleDir, 'comments.json'));

  await args.onPhase('importing_comments');

  const rootComments = comments.filter((c) => !c.parentExportId);
  const replyComments = comments.filter((c) => c.parentExportId);

  for (const c of rootComments) {
    const created = await prisma.documentComment.create({
      data: {
        documentId: idMap.getOrThrow(c.documentExportId),
        authorId: idMap.getOrThrow(c.authorExportId),
        text: c.text,
        parentId: null,
        anchorHeadingId: c.anchorHeadingId,
        deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
    idMap.set(c.exportId, created.id);
  }
  for (const c of replyComments) {
    const created = await prisma.documentComment.create({
      data: {
        documentId: idMap.getOrThrow(c.documentExportId),
        authorId: idMap.getOrThrow(c.authorExportId),
        text: c.text,
        parentId: idMap.getOrThrow(c.parentExportId!),
        anchorHeadingId: null,
        deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
    idMap.set(c.exportId, created.id);
  }

  const suggestions = await readJson<
    Array<{
      exportId: string;
      documentExportId: string;
      authorExportId: string;
      status: string;
      baseDraftRevision: number;
      publishedVersionExportId: string | null;
      ops: Prisma.InputJsonValue;
      createdAt: string;
      updatedAt: string;
      resolvedAt: string | null;
      resolvedByExportId: string | null;
      comment: string | null;
    }>
  >(join(args.bundleDir, 'suggestions.json'));

  await args.onPhase('importing_suggestions');

  for (const s of suggestions) {
    const created = await prisma.documentSuggestion.create({
      data: {
        documentId: idMap.getOrThrow(s.documentExportId),
        authorId: idMap.getOrThrow(s.authorExportId),
        status: s.status as never,
        baseDraftRevision: s.baseDraftRevision,
        publishedVersionId: idMap.get(s.publishedVersionExportId),
        ops: s.ops,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        resolvedAt: s.resolvedAt ? new Date(s.resolvedAt) : null,
        resolvedById: idMap.get(s.resolvedByExportId),
        comment: s.comment,
      },
    });
    idMap.set(s.exportId, created.id);
  }

  const attachmentsMap = await readJson<AttachmentsMap>(
    join(args.bundleDir, 'attachments-map.json')
  );

  await args.onPhase('importing_files');

  for (const [docExportId, files] of Object.entries(attachmentsMap.documents)) {
    const documentId = idMap.getOrThrow(docExportId);
    for (const file of files) {
      const sourcePath = join(args.bundleDir, file.fileRef);
      const ext = extname(file.filename) || extname(file.fileRef) || '';

      if (file.kind === 'pdf') {
        const objectKey = `exports/documents/${documentId}/${Date.now()}-import.pdf`;
        await storage.uploadStream(
          objectKey,
          createReadStream(sourcePath),
          file.contentType ?? 'application/pdf'
        );
        await prisma.document.update({
          where: { id: documentId },
          data: { pdfUrl: objectKey },
        });
      } else {
        const created = await prisma.documentAttachment.create({
          data: {
            documentId,
            objectKey: '',
            filename: file.filename,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes,
            uploadedById: null,
          },
        });
        const objectKey = `attachments/${documentId}/${created.id}${ext}`;
        await storage.uploadStream(
          objectKey,
          createReadStream(sourcePath),
          file.contentType ?? undefined
        );
        await prisma.documentAttachment.update({
          where: { id: created.id },
          data: { objectKey },
        });
      }
    }
  }

  return { idMap };
}
