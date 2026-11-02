import { describe, expect, it } from 'vitest';
import {
  isPgDumpCompatibleWithServer,
  parsePgDumpVersionOutput,
  parsePostgresMajor,
} from './pgDumpVersion.js';

describe('parsePostgresMajor', () => {
  it('reads leading major from short and long version strings', () => {
    expect(parsePostgresMajor('18.4')).toBe(18);
    expect(parsePostgresMajor('pg_dump (PostgreSQL) 15.19 (Debian)')).toBe(15);
  });
});

describe('parsePgDumpVersionOutput', () => {
  it('parses pg_dump --version stdout', () => {
    expect(parsePgDumpVersionOutput('pg_dump (PostgreSQL) 15.19 (Debian 15.19-0+deb12u1)\n')).toBe(
      '15.19'
    );
  });
});

describe('isPgDumpCompatibleWithServer', () => {
  it('requires dump major >= server major', () => {
    expect(isPgDumpCompatibleWithServer('18.4', '18.1')).toBe(true);
    expect(isPgDumpCompatibleWithServer('18.4', '15.19')).toBe(false);
    expect(isPgDumpCompatibleWithServer('18.4', null)).toBeNull();
  });
});
