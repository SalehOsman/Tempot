import { describe, it, expect } from 'vitest';
import { BaseEntity } from '../../src/base/base.entity';

describe('BaseEntity', () => {
  it('should have all mandatory audit fields defined', () => {
    class MockEntity extends BaseEntity {
      id = 'uuid';
      createdAt = new Date();
      updatedAt = new Date();
      isDeleted = false;
    }

    const entity = new MockEntity();
    expect(entity).toHaveProperty('id');
    expect(entity).toHaveProperty('createdAt');
    expect(entity).toHaveProperty('updatedAt');
    expect(entity).toHaveProperty('createdBy');
    expect(entity).toHaveProperty('updatedBy');
    expect(entity).toHaveProperty('isDeleted');
    expect(entity).toHaveProperty('deletedAt');
    expect(entity).toHaveProperty('deletedBy');
  });
});
