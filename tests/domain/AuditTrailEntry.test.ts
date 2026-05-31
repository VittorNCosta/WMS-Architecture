import { describe, it, expect } from 'vitest';
import { AuditTrailEntry } from '../../src/domain/entities/AuditTrailEntry';
import { AuditOperation } from '../../src/domain/enums/AuditOperation';
import { DomainError } from '../../src/domain/errors/DomainError';

const baseInput = {
  actorUserId: 'u1',
  actorLogin: 'admin',
  operation: AuditOperation.CREATE,
  entityType: 'Produto',
  entityId: 'p1',
  summary: 'Produto "SKU-1" cadastrado.',
};

describe('AuditTrailEntry (entidade de domínio)', () => {
  it('cria uma entrada válida com id e occurredAt preenchidos', () => {
    const entry = AuditTrailEntry.criar(baseInput);

    expect(entry.id).toBeTruthy();
    expect(entry.occurredAt).toBeInstanceOf(Date);
    expect(entry.actorLogin).toBe('admin');
    expect(entry.operation).toBe(AuditOperation.CREATE);
    expect(entry.entityType).toBe('Produto');
  });

  it('rejeita ator ausente', () => {
    expect(() => AuditTrailEntry.criar({ ...baseInput, actorUserId: '' })).toThrow(DomainError);
    expect(() => AuditTrailEntry.criar({ ...baseInput, actorLogin: '  ' })).toThrow(DomainError);
  });

  it('rejeita operação inválida', () => {
    expect(() =>
      AuditTrailEntry.criar({ ...baseInput, operation: 'HACK' as unknown as AuditOperation }),
    ).toThrow(DomainError);
  });

  it('rejeita entidade e resumo ausentes', () => {
    expect(() => AuditTrailEntry.criar({ ...baseInput, entityType: '' })).toThrow(DomainError);
    expect(() => AuditTrailEntry.criar({ ...baseInput, entityId: '' })).toThrow(DomainError);
    expect(() => AuditTrailEntry.criar({ ...baseInput, summary: '' })).toThrow(DomainError);
  });
});
