import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import type { StorageService } from '../../../../infrastructure/storage/index.js';
import {
  PLATFORM_EXPORT_JSON_FILES,
  type PlatformExportManifestCounts,
  sha256File,
  writePlatformManifestFile,
  type PlatformExportManifest,
  PLATFORM_EXPORT_FORMAT_VERSION,
} from './platformManifest.js';
import { appVersion } from '../../../../infrastructure/appVersion.js';

export type AttachmentsMap = {
  documents: Record<
    string,
    Array<{
      exportId: string;
      fileRef: string;
      kind: 'attachment' | 'pdf';
      filename: string;
      contentType: string | null;
      sizeBytes: number;
    }>
  >;
};

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function isMinioObjectKey(value: string): boolean {
  return !value.startsWith('http://') && !value.startsWith('https://');
}

async function copyMinioObjectToFile(
  storage: StorageService,
  objectKey: string,
  destPath: string
): Promise<void> {
  const object = await storage.getObject(objectKey);
  if (!object) throw new Error(`MinIO object not found: ${objectKey}`);
  await pipeline(object.Body, createWriteStream(destPath));
}

export async function exportDomainDataToDirectory(
  prisma: PrismaClient,
  storage: StorageService,
  args: { bundleDir: string; platformExportRunId: string }
): Promise<{ manifest: PlatformExportManifest; attachmentsMap: AttachmentsMap }> {
  const filesDir = join(args.bundleDir, 'files');
  await mkdir(filesDir, { recursive: true });

  const [
    companies,
    departments,
    teams,
    teamMembers,
    teamLeads,
    departmentLeads,
    companyLeads,
    users,
    owners,
    contexts,
    processes,
    projects,
    subcontexts,
    documents,
    documentVersions,
    grantUsers,
    grantTeams,
    grantDepartments,
    tags,
    documentTags,
    pins,
    comments,
    attachments,
  ] = await Promise.all([
    prisma.company.findMany({ orderBy: { id: 'asc' } }),
    prisma.department.findMany({ orderBy: { id: 'asc' } }),
    prisma.team.findMany({ orderBy: { id: 'asc' } }),
    prisma.teamMember.findMany(),
    prisma.teamLead.findMany(),
    prisma.departmentLead.findMany(),
    prisma.companyLead.findMany(),
    prisma.user.findMany({ orderBy: { id: 'asc' } }),
    prisma.owner.findMany({ orderBy: { id: 'asc' } }),
    prisma.context.findMany({ orderBy: { id: 'asc' } }),
    prisma.process.findMany({ orderBy: { id: 'asc' } }),
    prisma.project.findMany({ orderBy: { id: 'asc' } }),
    prisma.subcontext.findMany({ orderBy: { id: 'asc' } }),
    prisma.document.findMany({ orderBy: { id: 'asc' } }),
    prisma.documentVersion.findMany({ orderBy: [{ documentId: 'asc' }, { versionNumber: 'asc' }] }),
    prisma.documentGrantUser.findMany(),
    prisma.documentGrantTeam.findMany(),
    prisma.documentGrantDepartment.findMany(),
    prisma.tag.findMany({ orderBy: { id: 'asc' } }),
    prisma.documentTag.findMany(),
    prisma.documentPinnedInScope.findMany({ orderBy: { id: 'asc' } }),
    prisma.documentComment.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.documentAttachment.findMany({ orderBy: { id: 'asc' } }),
  ]);

  await writeJson(join(args.bundleDir, 'organization.json'), {
    companies: companies.map((c) => ({ exportId: c.id, name: c.name })),
    departments: departments.map((d) => ({
      exportId: d.id,
      companyExportId: d.companyId,
      name: d.name,
    })),
    teams: teams.map((t) => ({
      exportId: t.id,
      departmentExportId: t.departmentId,
      name: t.name,
    })),
    teamMembers: teamMembers.map((m) => ({
      teamExportId: m.teamId,
      userExportId: m.userId,
    })),
    teamLeads: teamLeads.map((l) => ({
      teamExportId: l.teamId,
      userExportId: l.userId,
    })),
    departmentLeads: departmentLeads.map((l) => ({
      departmentExportId: l.departmentId,
      userExportId: l.userId,
    })),
    companyLeads: companyLeads.map((l) => ({
      companyExportId: l.companyId,
      userExportId: l.userId,
    })),
  });

  await writeJson(
    join(args.bundleDir, 'users.json'),
    users.map((u) => ({
      exportId: u.id,
      name: u.name,
      email: u.email,
      externalId: u.externalId,
      isAdmin: u.isAdmin,
      deletedAt: u.deletedAt?.toISOString() ?? null,
      preferences: u.preferences,
      passwordHash: u.passwordHash,
    }))
  );

  await writeJson(
    join(args.bundleDir, 'owners.json'),
    owners.map((o) => ({
      exportId: o.id,
      companyExportId: o.companyId,
      departmentExportId: o.departmentId,
      teamExportId: o.teamId,
      ownerUserExportId: o.ownerUserId,
      displayName: o.displayName,
    }))
  );

  await writeJson(join(args.bundleDir, 'contexts.json'), {
    contexts: contexts.map((c) => ({
      exportId: c.id,
      displayName: c.displayName,
      contextType: c.contextType,
      ownerDisplayName: c.ownerDisplayName,
    })),
    processes: processes.map((p) => ({
      exportId: p.id,
      name: p.name,
      contextExportId: p.contextId,
      ownerExportId: p.ownerId,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      archivedAt: p.archivedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    projects: projects.map((p) => ({
      exportId: p.id,
      name: p.name,
      contextExportId: p.contextId,
      ownerExportId: p.ownerId,
      deletedAt: p.deletedAt?.toISOString() ?? null,
      archivedAt: p.archivedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    subcontexts: subcontexts.map((s) => ({
      exportId: s.id,
      name: s.name,
      contextExportId: s.contextId,
      projectExportId: s.projectId,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  });

  await writeJson(
    join(args.bundleDir, 'documents.json'),
    documents.map((d) => ({
      exportId: d.id,
      title: d.title,
      draftBlocks: d.draftBlocks,
      draftRevision: d.draftRevision,
      pdfUrl: d.pdfUrl,
      contextExportId: d.contextId,
      deletedAt: d.deletedAt?.toISOString() ?? null,
      archivedAt: d.archivedAt?.toISOString() ?? null,
      publishedAt: d.publishedAt?.toISOString() ?? null,
      description: d.description,
      createdByExportId: d.createdById,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      currentPublishedVersionExportId: d.currentPublishedVersionId,
    }))
  );

  await writeJson(
    join(args.bundleDir, 'document-versions.json'),
    documentVersions.map((v) => ({
      exportId: v.id,
      documentExportId: v.documentId,
      blocks: v.blocks,
      blocksSchemaVersion: v.blocksSchemaVersion,
      versionNumber: v.versionNumber,
      createdAt: v.createdAt.toISOString(),
      createdByExportId: v.createdById,
      parentVersionExportId: v.parentVersionId,
    }))
  );

  await writeJson(join(args.bundleDir, 'grants.json'), {
    users: grantUsers.map((g) => ({
      documentExportId: g.documentId,
      userExportId: g.userId,
      role: g.role,
    })),
    teams: grantTeams.map((g) => ({
      documentExportId: g.documentId,
      teamExportId: g.teamId,
      role: g.role,
    })),
    departments: grantDepartments.map((g) => ({
      documentExportId: g.documentId,
      departmentExportId: g.departmentId,
      role: g.role,
    })),
  });

  await writeJson(join(args.bundleDir, 'tags.json'), {
    tags: tags.map((t) => ({
      exportId: t.id,
      name: t.name,
      ownerExportId: t.ownerId,
    })),
    documentTags: documentTags.map((dt) => ({
      documentExportId: dt.documentId,
      tagExportId: dt.tagId,
    })),
  });

  await writeJson(
    join(args.bundleDir, 'pins.json'),
    pins.map((p) => ({
      exportId: p.id,
      documentExportId: p.documentId,
      scopeType: p.scopeType,
      scopeExportId: p.scopeId,
      order: p.order,
      pinnedByExportId: p.pinnedById,
      createdAt: p.createdAt.toISOString(),
    }))
  );

  await writeJson(
    join(args.bundleDir, 'comments.json'),
    comments.map((c) => ({
      exportId: c.id,
      documentExportId: c.documentId,
      authorExportId: c.authorId,
      text: c.text,
      parentExportId: c.parentId,
      anchorHeadingId: c.anchorHeadingId,
      deletedAt: c.deletedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))
  );

  const attachmentsMap: AttachmentsMap = { documents: {} };
  let attachmentFileCount = 0;

  for (const att of attachments) {
    const fileRef = `files/${att.id}`;
    const destPath = join(args.bundleDir, fileRef);
    await copyMinioObjectToFile(storage, att.objectKey, destPath);
    attachmentFileCount += 1;
    const list = attachmentsMap.documents[att.documentId] ?? [];
    list.push({
      exportId: att.id,
      fileRef,
      kind: 'attachment',
      filename: att.filename,
      contentType: att.contentType,
      sizeBytes: att.sizeBytes,
    });
    attachmentsMap.documents[att.documentId] = list;
  }

  for (const doc of documents) {
    if (!doc.pdfUrl || !isMinioObjectKey(doc.pdfUrl)) continue;
    const pdfExportId = `pdf-${doc.id}`;
    const fileRef = `files/${pdfExportId}`;
    const destPath = join(args.bundleDir, fileRef);
    try {
      await copyMinioObjectToFile(storage, doc.pdfUrl, destPath);
      attachmentFileCount += 1;
      const list = attachmentsMap.documents[doc.id] ?? [];
      list.push({
        exportId: pdfExportId,
        fileRef,
        kind: 'pdf',
        filename: `${doc.title || 'document'}.pdf`,
        contentType: 'application/pdf',
        sizeBytes: 0,
      });
      attachmentsMap.documents[doc.id] = list;
    } catch {
      // PDF export optional; skip missing objects
    }
  }

  await writeJson(join(args.bundleDir, 'attachments-map.json'), attachmentsMap);

  const counts: PlatformExportManifestCounts = {
    companies: companies.length,
    departments: departments.length,
    teams: teams.length,
    users: users.length,
    owners: owners.length,
    contexts: contexts.length,
    processes: processes.length,
    projects: projects.length,
    subcontexts: subcontexts.length,
    documents: documents.length,
    documentVersions: documentVersions.length,
    tags: tags.length,
    grants: grantUsers.length + grantTeams.length + grantDepartments.length,
    pins: pins.length,
    comments: comments.length,
    attachmentFiles: attachmentFileCount,
  };

  const filesMeta: Record<string, { sha256: string; sizeBytes: number }> = {};
  for (const jsonFile of PLATFORM_EXPORT_JSON_FILES) {
    const path = join(args.bundleDir, jsonFile);
    const stat = await import('node:fs/promises').then((fs) => fs.stat(path));
    filesMeta[jsonFile] = {
      sha256: await sha256File(path),
      sizeBytes: stat.size,
    };
  }

  const manifest: PlatformExportManifest = {
    exportFormatVersion: PLATFORM_EXPORT_FORMAT_VERSION,
    platformExportRunId: args.platformExportRunId,
    sourceAppVersion: appVersion,
    createdAt: new Date().toISOString(),
    files: filesMeta,
    counts,
  };

  await writePlatformManifestFile(join(args.bundleDir, 'manifest.json'), manifest);

  return { manifest, attachmentsMap };
}
