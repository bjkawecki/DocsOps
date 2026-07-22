import { describe, expect, it } from 'vitest';
import { formatRecentScopeLabel, getAggregatedRecentItems } from './useRecentItems';

describe('getAggregatedRecentItems', () => {
  it('deduplicates the same document within one scope and keeps scopeKey', () => {
    const items = getAggregatedRecentItems({
      'team:t1': [
        { type: 'document', id: 'd1', name: 'Team Wiki' },
        { type: 'document', id: 'd1', name: 'Team Wiki' },
        { type: 'document', id: 'd1', name: 'Team Wiki' },
      ],
    });
    expect(items).toEqual([{ type: 'document', id: 'd1', name: 'Team Wiki', scopeKey: 'team:t1' }]);
  });

  it('deduplicates the same document across scopes and keeps first occurrence', () => {
    const items = getAggregatedRecentItems({
      'team:t1': [{ type: 'document', id: 'd1', name: 'Team Wiki' }],
      'department:d1': [{ type: 'document', id: 'd1', name: 'Team Wiki' }],
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('d1');
    expect(items[0]?.scopeKey).toBe('team:t1');
  });

  it('preserves contextName when present', () => {
    const items = getAggregatedRecentItems({
      personal: [{ type: 'document', id: 'd1', name: 'Notes', contextName: 'My Notes Process' }],
    });
    expect(items[0]?.contextName).toBe('My Notes Process');
    expect(items[0]?.scopeKey).toBe('personal');
  });
});

describe('formatRecentScopeLabel', () => {
  const identity = {
    teams: [
      {
        teamId: 't1',
        teamName: 'Platform',
        departmentId: 'd1',
        departmentName: 'Eng',
        companyId: 'c1',
        role: 'member' as const,
      },
    ],
    departments: [{ id: 'd1', name: 'Engineering' }],
    departmentLeads: [{ id: 'd2', name: 'Ops Lead Dept', companyId: 'c1' }],
    companyLeads: [{ id: 'c1', name: 'Acme Corp' }],
  };

  it('maps personal and shared', () => {
    expect(formatRecentScopeLabel('personal', identity)).toBe('Personal');
    expect(formatRecentScopeLabel('shared', identity)).toBe('Shared');
  });

  it('resolves team, department, and company names from identity', () => {
    expect(formatRecentScopeLabel('team:t1', identity)).toBe('Platform');
    expect(formatRecentScopeLabel('department:d1', identity)).toBe('Engineering');
    expect(formatRecentScopeLabel('department:d2', identity)).toBe('Ops Lead Dept');
    expect(formatRecentScopeLabel('company:c1', identity)).toBe('Acme Corp');
  });

  it('falls back when id is unknown', () => {
    expect(formatRecentScopeLabel('team:missing', identity)).toBe('Team');
    expect(formatRecentScopeLabel('department:missing', identity)).toBe('Department');
    expect(formatRecentScopeLabel('company:missing', identity)).toBe('Company');
  });
});
