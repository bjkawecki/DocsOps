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
  it('includes 14 built-in types with stable ids', () => {
    expect(BUILTIN_DOCUMENT_TYPES).toHaveLength(14);
    expect(builtinTypeId('runbook')).toBe('builtin:runbook');
    expect(builtinTemplateId('runbook')).toBe('builtin:runbook');
    expect(getBuiltinDocumentType('runbook')?.label).toBe('Runbook');
    expect(parseBuiltinSlug('builtin:adr')).toBe('adr');
    expect(parseCustomTypeId('custom:abc')).toBe('abc');
  });

  it('filters by oftenUsedIn', () => {
    const processTypes = listBuiltinDocumentTypes('process');
    const projectTypes = listBuiltinDocumentTypes('project');
    expect(processTypes.every((t) => t.oftenUsedIn === 'process')).toBe(true);
    expect(projectTypes.every((t) => t.oftenUsedIn === 'project')).toBe(true);
    expect(processTypes.length + projectTypes.length).toBe(14);
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
});
