import type { Prisma } from '../../../../generated/prisma/client.js';
import {
  blockDocumentJsonFromSeedSections,
  type SeedDocumentBlockSection,
} from '../services/blocks/documentBlocksBackfill.js';
import type { TemplateSection } from './builtinDocumentTemplates.js';

/** Convert template sections to draftBlocks JSON (H2 + bullet prompts). */
export function templateSectionsToDraftBlocks(sections: TemplateSection[]): Prisma.InputJsonValue {
  const seed: SeedDocumentBlockSection[] = [];
  for (const section of sections) {
    seed.push({ type: 'heading', level: 2, text: section.heading });
    for (const prompt of section.prompts) {
      seed.push({ type: 'paragraph', text: `• ${prompt}` });
    }
  }
  return blockDocumentJsonFromSeedSections(seed);
}
