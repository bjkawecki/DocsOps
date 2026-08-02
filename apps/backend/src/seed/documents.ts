import type { PrismaClient } from '../../generated/prisma/client.js';
import {
  blockDocumentJsonFromSeedSections,
  type SeedDocumentBlockSection,
} from '../domains/documents/services/blocks/documentBlocksBackfill.js';
import type { SeedContextData, SeedMasterData } from './types.js';

type PublishedSeedDocInput = {
  title: string;
  sections: SeedDocumentBlockSection[];
  contextId: string;
  createdById?: string | null;
};

/** Default body when a scope has no dedicated story sections. */
const SEED_DOCUMENT_SECTIONS: SeedDocumentBlockSection[] = [
  { type: 'heading', level: 2, text: 'Zweck' },
  {
    type: 'paragraph',
    text: 'Dieses Dokument gehört zum Demo-Datensatz von Musterwerk IT GmbH (Software X / Barrierefreiheit). Es zeigt typische Struktur und Lesefluss in DocsOps.',
  },
  { type: 'heading', level: 2, text: 'Nächste Schritte' },
  {
    type: 'paragraph',
    text: 'Inhalte bei Bedarf anpassen, Reviews anstoßen oder neue Dokumente aus Vorlagen anlegen.',
  },
];

function storySections(overview: string, details: string): SeedDocumentBlockSection[] {
  return [
    { type: 'heading', level: 2, text: 'Überblick' },
    { type: 'paragraph', text: overview },
    { type: 'heading', level: 2, text: 'Details' },
    { type: 'paragraph', text: details },
  ];
}

async function createPublishedSeedDocument(prisma: PrismaClient, input: PublishedSeedDocInput) {
  return prisma.$transaction(async (tx) => {
    const blocksJson = blockDocumentJsonFromSeedSections(input.sections);
    const doc = await tx.document.create({
      data: {
        title: input.title,
        draftBlocks: blocksJson,
        contextId: input.contextId,
        ...(input.createdById != null ? { createdById: input.createdById } : {}),
      },
    });
    const version = await tx.documentVersion.create({
      data: {
        documentId: doc.id,
        blocks: blocksJson,
        blocksSchemaVersion: 0,
        versionNumber: 1,
        ...(input.createdById != null ? { createdById: input.createdById } : {}),
      },
    });
    await tx.document.update({
      where: { id: doc.id },
      data: {
        publishedAt: new Date(),
        currentPublishedVersionId: version.id,
      },
    });
    return doc;
  });
}

type SeedDocSpec = {
  title: string;
  sections: SeedDocumentBlockSection[];
};

function seedDocSpec(scopeKey: string, kind: 'process' | 'project'): SeedDocSpec {
  if (scopeKey.startsWith('company:')) {
    if (kind === 'process') {
      return {
        title: 'Dokumentationsrichtlinie',
        sections: storySections(
          'Verbindliche Regeln für interne Dokumentation bei Musterwerk IT: wo Inhalte leben, wer freigibt und wie Lesende Orientierung finden.',
          'Scope-Leads veröffentlichen; Autoren arbeiten im Lead-Draft mit Vorschlägen. Persönliche Räume bleiben privat, sofern nicht freigegeben.'
        ),
      };
    }
    return {
      title: 'Software X – Produktüberblick',
      sections: storySections(
        'Software X ist das aktuelle Produktvorhaben. Dieses Dokument fasst Zielbild, Stakeholder und den Stand der Barrierefreiheit zusammen.',
        'Produktentwicklung und das Team Barrierefreiheit pflegen hier den gemeinsamen Überblick; Detailarbeit liegt in den Team- und Abteilungsdokumenten.'
      ),
    };
  }
  if (scopeKey.startsWith('department:')) {
    if (kind === 'process') {
      return {
        title: 'Release-Checkliste Produktentwicklung',
        sections: storySections(
          'Schritte vor einem Release von Software X: Review, Dokumentation, Zugänglichkeit und Übergabe an Support.',
          'Department Lead bestätigt die Checkliste; Team Barrierefreiheit liefert den A11y-Status vor dem Go-Live.'
        ),
      };
    }
    return {
      title: 'Roadmap Q3 – Software X',
      sections: storySections(
        'Geplante Lieferungen und Abhängigkeiten für Software X in diesem Quartal, inkl. Barrierefreiheits-Meilensteine.',
        'Prioritäten werden mit Company Lead abgestimmt; Änderungen erscheinen in der publizierten Version dieses Dokuments.'
      ),
    };
  }
  if (scopeKey.startsWith('team:')) {
    if (kind === 'process') {
      return {
        title: 'Barrierefreiheit – Arbeitsweise',
        sections: storySections(
          'Wie das Team Barrierefreiheit prüft, dokumentiert und Findings an Produktentwicklung übergibt.',
          'Startpunkt für neue Teammitglieder: Rollen, Tools, Review-Rhythmus und Verweis auf den aktuellen Stand Barrierefreiheit.'
        ),
      };
    }
    return {
      title: 'Stand Barrierefreiheit Software X',
      sections: storySections(
        'Aktueller Status der Zugänglichkeit von Software X: bekannte Lücken, erledigte Fixes und offene Tickets.',
        'Team Lead hält dieses Dokument aktuell; Member ergänzen Prüfnotizen. Company- und Department-Leads lesen den Status hier.'
      ),
    };
  }
  if (scopeKey === 'personal:') {
    return kind === 'process'
      ? {
          title: 'Meine Notizen',
          sections: storySections(
            'Persönlicher Arbeitsbereich des Company Leads für Entwürfe und Notizen.',
            'Nicht für die Organisation sichtbar, außer nach expliziter Freigabe oder Verschiebung in einen Scope-Kontext.'
          ),
        }
      : {
          title: 'Persönliche Skizze',
          sections: storySections(
            'Privates Projekt für Experimente rund um Software X und Dokumentation.',
            'Kann später in einen Team- oder Abteilungskontext verschoben werden.'
          ),
        };
  }
  return {
    title: kind === 'process' ? 'Übersicht' : 'Projektübersicht',
    sections: SEED_DOCUMENT_SECTIONS,
  };
}

/** Mark the scope process doc as Start here for team / department / company. */
async function setStartHereForScope(
  prisma: PrismaClient,
  masterData: SeedMasterData,
  scopeKey: string,
  documentId: string
): Promise<void> {
  if (scopeKey.startsWith('team:')) {
    const name = scopeKey.slice('team:'.length);
    const teamId = masterData.teamById.get(name);
    if (teamId) {
      await prisma.team.update({ where: { id: teamId }, data: { startDocumentId: documentId } });
    }
    return;
  }
  if (scopeKey.startsWith('department:')) {
    const name = scopeKey.slice('department:'.length);
    const departmentId = masterData.departmentById.get(name);
    if (departmentId) {
      await prisma.department.update({
        where: { id: departmentId },
        data: { startDocumentId: documentId },
      });
    }
    return;
  }
  if (scopeKey.startsWith('company:')) {
    const name = scopeKey.slice('company:'.length);
    const companyId = masterData.companyById.get(name);
    if (companyId) {
      await prisma.company.update({
        where: { id: companyId },
        data: { startDocumentId: documentId },
      });
    }
  }
}

async function seedDocuments(
  prisma: PrismaClient,
  contextData: SeedContextData,
  tagByNameAndOwner: Map<string, string>,
  masterData: SeedMasterData
): Promise<void> {
  for (const [scopeKey, processId] of contextData.processByScope) {
    const process = await prisma.process.findUniqueOrThrow({
      where: { id: processId },
      select: { contextId: true, ownerId: true },
    });
    const spec = seedDocSpec(scopeKey, 'process');
    const doc = await createPublishedSeedDocument(prisma, {
      title: spec.title,
      sections: spec.sections,
      contextId: process.contextId,
    });
    await setStartHereForScope(prisma, masterData, scopeKey, doc.id);
    if (process.ownerId && scopeKey.startsWith('company:')) {
      const tagId = tagByNameAndOwner.get(`${process.ownerId}:Referenz`);
      if (tagId) {
        await prisma.documentTag.create({ data: { documentId: doc.id, tagId } });
      }
    }
  }

  for (const [scopeKey, projectId] of contextData.projectByScope) {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { contextId: true },
    });
    const spec = seedDocSpec(scopeKey, 'project');
    await createPublishedSeedDocument(prisma, {
      title: spec.title,
      sections: spec.sections,
      contextId: project.contextId,
    });
  }
}

export { SEED_DOCUMENT_SECTIONS, createPublishedSeedDocument, seedDocuments };
