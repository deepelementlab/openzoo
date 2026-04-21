import { describe, it, expect } from 'vitest';
import { filterIssues, sortIssues } from '../issues/utils/filter';
import type { Issue } from '@openzoo/core/types';

const mockIssues: Issue[] = [
  {
    id: '1',
    identifier: 'OZ-1',
    title: 'Bug fix',
    status: 'open',
    priority: 'high',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    workspace_id: 'ws-1',
  } as Issue,
  {
    id: '2',
    identifier: 'OZ-2',
    title: 'Feature request',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    workspace_id: 'ws-1',
  } as Issue,
  {
    id: '3',
    identifier: 'OZ-3',
    title: 'Documentation update',
    status: 'done',
    priority: 'low',
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
    workspace_id: 'ws-1',
  } as Issue,
];

describe('filterIssues', () => {
  it('returns all issues when no filters applied', () => {
    const result = filterIssues(mockIssues, {});
    expect(result).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterIssues(mockIssues, { status: 'open' });
    expect(result).toHaveLength(1);
    expect(result[0].identifier).toBe('OZ-1');
  });

  it('filters by priority', () => {
    const result = filterIssues(mockIssues, { priority: 'high' });
    expect(result).toHaveLength(1);
    expect(result[0].identifier).toBe('OZ-1');
  });

  it('filters by search query in title', () => {
    const result = filterIssues(mockIssues, { query: 'bug' });
    expect(result).toHaveLength(1);
    expect(result[0].identifier).toBe('OZ-1');
  });

  it('filters by search query in identifier', () => {
    const result = filterIssues(mockIssues, { query: 'OZ-2' });
    expect(result).toHaveLength(1);
    expect(result[0].identifier).toBe('OZ-2');
  });

  it('returns empty for non-matching query', () => {
    const result = filterIssues(mockIssues, { query: 'nonexistent' });
    expect(result).toHaveLength(0);
  });

  it('combines status and priority filters', () => {
    const result = filterIssues(mockIssues, { status: 'open', priority: 'high' });
    expect(result).toHaveLength(1);
  });
});

describe('sortIssues', () => {
  it('sorts by created_at descending by default', () => {
    const result = sortIssues(mockIssues, 'newest');
    expect(result[0].identifier).toBe('OZ-3');
    expect(result[2].identifier).toBe('OZ-1');
  });

  it('sorts by created_at ascending', () => {
    const result = sortIssues(mockIssues, 'oldest');
    expect(result[0].identifier).toBe('OZ-1');
    expect(result[2].identifier).toBe('OZ-3');
  });

  it('sorts by priority', () => {
    const result = sortIssues(mockIssues, 'priority');
    expect(result[0].priority).toBe('high');
  });

  it('does not mutate original array', () => {
    const original = [...mockIssues];
    sortIssues(mockIssues, 'newest');
    expect(mockIssues.map((i) => i.id)).toEqual(original.map((i) => i.id));
  });
});
