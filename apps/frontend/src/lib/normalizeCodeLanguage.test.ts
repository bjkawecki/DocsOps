import { describe, expect, it } from 'vitest';
import { normalizeCodeLanguage } from './normalizeCodeLanguage.js';

describe('normalizeCodeLanguage', () => {
  it('maps aliases to canonical languages', () => {
    expect(normalizeCodeLanguage('ts')).toBe('typescript');
    expect(normalizeCodeLanguage('TSX')).toBe('typescript');
    expect(normalizeCodeLanguage('js')).toBe('javascript');
    expect(normalizeCodeLanguage('yml')).toBe('yaml');
    expect(normalizeCodeLanguage('md')).toBe('markdown');
    expect(normalizeCodeLanguage('sh')).toBe('bash');
  });

  it('keeps allowed languages', () => {
    expect(normalizeCodeLanguage('bash')).toBe('bash');
    expect(normalizeCodeLanguage('sql')).toBe('sql');
    expect(normalizeCodeLanguage('python')).toBe('python');
  });

  it('falls back to plaintext for empty or unknown', () => {
    expect(normalizeCodeLanguage(undefined)).toBe('plaintext');
    expect(normalizeCodeLanguage('')).toBe('plaintext');
    expect(normalizeCodeLanguage('   ')).toBe('plaintext');
    expect(normalizeCodeLanguage('cobol')).toBe('plaintext');
  });
});
