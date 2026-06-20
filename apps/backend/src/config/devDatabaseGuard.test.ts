import { afterEach, describe, expect, it } from 'vitest';
import {
  assertDestructiveDevDatabaseAllowed,
  getAllowedDestructiveDatabaseNames,
  parseDatabaseNameFromUrl,
} from './devDatabaseGuard.js';

describe('devDatabaseGuard', () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it('parseDatabaseNameFromUrl extracts database name', () => {
    expect(parseDatabaseNameFromUrl('postgresql://app:app@localhost:5432/docsops')).toBe('docsops');
    expect(
      parseDatabaseNameFromUrl('postgres://app:app@postgres:5432/docsops_test?schema=public')
    ).toBe('docsops_test');
  });

  it('defaults allowed names to docsops', () => {
    process.env = { ...env };
    delete process.env.DEV_DESTRUCTIVE_DB_NAMES;
    expect(getAllowedDestructiveDatabaseNames()).toEqual(['docsops']);
  });

  it('allows operation when database name is on the allowlist', () => {
    process.env = {
      ...env,
      DATABASE_URL: 'postgresql://app:app@localhost:5432/docsops',
      DEV_DESTRUCTIVE_DB_NAMES: 'docsops,docsops_dev',
    };
    delete process.env.ALLOW_DESTRUCTIVE_DB_ANY;
    expect(() => assertDestructiveDevDatabaseAllowed()).not.toThrow();
  });

  it('rejects operation when database name is not allowed', () => {
    process.env = {
      ...env,
      DATABASE_URL: 'postgresql://app:app@localhost:5432/production_db',
      DEV_DESTRUCTIVE_DB_NAMES: 'docsops',
    };
    delete process.env.ALLOW_DESTRUCTIVE_DB_ANY;
    expect(() => assertDestructiveDevDatabaseAllowed()).toThrow(/Destructive debug operations/);
  });

  it('skips name check when ALLOW_DESTRUCTIVE_DB_ANY=1', () => {
    process.env = {
      ...env,
      DATABASE_URL: 'postgresql://app:app@localhost:5432/production_db',
      ALLOW_DESTRUCTIVE_DB_ANY: '1',
    };
    expect(() => assertDestructiveDevDatabaseAllowed()).not.toThrow();
  });
});
