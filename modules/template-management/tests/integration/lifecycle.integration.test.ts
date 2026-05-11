import { describe, it } from 'vitest';

describe('Lifecycle Integration', () => {
  it.todo('transitions DRAFT -> REVIEW -> PUBLISHED -> ARCHIVED');
  it.todo('rejects invalid transition DRAFT -> PUBLISHED');
  it.todo('enforces completeness check for DRAFT -> REVIEW');
  it.todo('enforces RBAC role for REVIEW -> PUBLISHED');
  it.todo('requires reason for PUBLISHED -> ARCHIVED');
});
