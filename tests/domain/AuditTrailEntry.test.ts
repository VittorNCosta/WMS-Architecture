import { describe, it, expect } from 'vitest';
import { AuditTrailEntry } from '../../src/domain/entities/AuditTrailEntry';
import { AuditOperation } from '../../src/domain/enums/AuditOperation';
import { DomainError } from '../../src/domain/errors/DomainError';

const baseInput = {
  actorUserId: 'u1',
  actorLogin: 'admin',
  operation: AuditOperation.CREATE,
  entityType: 'Product',
  entityId: 'p1',
  summary: 'Produto "SKU-1" cadastrado.',
};

describe('AuditTrailEntry (domain entity)', () => {
  it('creates a valid entry with id and occurredAt filled in', () => {
    const entry = AuditTrailEntry.create(baseInput);

    expect(entry.id).toBeTruthy();
    expect(entry.occurredAt).toBeInstanceOf(Date);
    expect(entry.actorLogin).toBe('admin');
    expect(entry.operation).toBe(AuditOperation.CREATE);
    expect(entry.entityType).toBe('Product');
  });

  it('rejects a missing actor', () => {
    expect(() => AuditTrailEntry.create({ ...baseInput, actorUserId: '' })).toThrow(DomainError);
    expect(() => AuditTrailEntry.create({ ...baseInput, actorLogin: '  ' })).toThrow(DomainError);
  });

  it('rejects an invalid operation', () => {
    expect(() =>
      AuditTrailEntry.create({ ...baseInput, operation: 'HACK' as unknown as AuditOperation }),
    ).toThrow(DomainError);
  });

  it('rejects missing entity and summary', () => {
    expect(() => AuditTrailEntry.create({ ...baseInput, entityType: '' })).toThrow(DomainError);
    expect(() => AuditTrailEntry.create({ ...baseInput, entityId: '' })).toThrow(DomainError);
    expect(() => AuditTrailEntry.create({ ...baseInput, summary: '' })).toThrow(DomainError);
  });
});
