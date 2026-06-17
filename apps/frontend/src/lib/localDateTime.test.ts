import { describe, expect, it } from 'vitest';
import {
  datetimeLocalToIso,
  formatDatetimeLocalValue,
  isoToDatetimeLocal,
  parseDatetimeLocalValue,
} from './localDateTime.js';

describe('localDateTime', () => {
  it('round-trips local wall-clock time through UTC ISO', () => {
    const local = '2026-06-19T14:30';
    const iso = datetimeLocalToIso(local);
    expect(iso).not.toBeNull();
    expect(isoToDatetimeLocal(iso!)).toBe(local);
  });

  it('parses datetime-local without treating it as UTC', () => {
    const parsed = parseDatetimeLocalValue('2026-12-01T09:15');
    expect(parsed).not.toBeNull();
    expect(formatDatetimeLocalValue(parsed!)).toBe('2026-12-01T09:15');
  });
});
