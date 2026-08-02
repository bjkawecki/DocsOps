import { describe, expect, it } from 'vitest';
import {
  BUILTIN_DOCUMENT_TYPES,
  builtinTemplateId,
  builtinTypeId,
  getBuiltinDocumentType,
  listBuiltinDocumentTypes,
  parseBuiltinSlug,
  parseCustomTypeId,
} from '../templates/builtinDocumentTemplates.js';
import { templateSectionsToDraftBlocks } from '../templates/templateSectionsToDraftBlocks.js';
import { safeParseBlockDocument } from '../services/blocks/blockSchema.js';

describe('builtinDocumentTemplates', () => {
  it('includes 8 built-in types with stable ids', () => {
    expect(BUILTIN_DOCUMENT_TYPES).toHaveLength(8);
    expect(builtinTypeId('runbook')).toBe('builtin:runbook');
    expect(builtinTemplateId('runbook')).toBe('builtin:runbook');
    expect(getBuiltinDocumentType('runbook')?.label).toBe('Runbook');
    expect(parseBuiltinSlug('builtin:adr')).toBe('adr');
    expect(parseCustomTypeId('custom:abc')).toBe('abc');
    expect(getBuiltinDocumentType('baseline')).toBeUndefined();
    expect(getBuiltinDocumentType('playbook')).toBeUndefined();
  });

  it('filters by oftenUsedIn', () => {
    const processTypes = listBuiltinDocumentTypes('process');
    const projectTypes = listBuiltinDocumentTypes('project');
    expect(processTypes.every((t) => t.oftenUsedIn === 'process')).toBe(true);
    expect(projectTypes.every((t) => t.oftenUsedIn === 'project')).toBe(true);
    expect(processTypes).toHaveLength(5);
    expect(projectTypes).toHaveLength(3);
    expect(processTypes.length + projectTypes.length).toBe(8);
  });

  it('converts sections to block document with H2 headings', () => {
    const runbook = getBuiltinDocumentType('runbook')!;
    const json = templateSectionsToDraftBlocks(runbook.sections);
    const parsed = safeParseBlockDocument(json);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    const headings = parsed.data.blocks.filter((b) => b.type === 'heading');
    expect(headings.length).toBe(runbook.sections.length);
    expect(headings[0]?.attrs?.level).toBe(2);
  });

  it('includes German catalog fields for every built-in type', () => {
    for (const type of BUILTIN_DOCUMENT_TYPES) {
      expect(type.deLabel.trim().length).toBeGreaterThan(0);
      expect(type.deWhenToUse.trim().length).toBeGreaterThan(0);
      expect(type.deExampleTitle.trim().length).toBeGreaterThan(0);
      expect(type.deSections.length).toBe(type.sections.length);
      for (const section of type.deSections) {
        expect(section.heading.trim().length).toBeGreaterThan(0);
        expect(section.prompts.length).toBeGreaterThan(0);
      }
    }
  });

  it('localizeBuiltinDocumentType switches to DE fields', async () => {
    const { localizeBuiltinDocumentType } =
      await import('../templates/builtinDocumentTemplateTypes.js');
    const policy = getBuiltinDocumentType('policy')!;
    const de = localizeBuiltinDocumentType(policy, 'de');
    expect(de.label).toBe(policy.deLabel);
    expect(de.whenToUse).toBe(policy.deWhenToUse);
    expect(de.exampleTitle).toBe(policy.deExampleTitle);
    expect(de.sections).toEqual(policy.deSections);
    const en = localizeBuiltinDocumentType(policy, 'en');
    expect(en.label).toBe(policy.label);
    expect(en.sections).toEqual(policy.sections);
  });
});
