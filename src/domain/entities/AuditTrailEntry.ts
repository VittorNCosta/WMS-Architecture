import { randomUUID } from 'node:crypto';
import { AuditOperation } from '../enums/AuditOperation';
import { DomainError } from '../errors/DomainError';

/**
 * Input data to create an audit trail entry.
 * `summary` is a short human-readable phrase (e.g. `Usuário "admin" cadastrado.`).
 */
export interface AuditTrailEntryInput {
  actorUserId: string;
  actorLogin: string;
  operation: AuditOperation;
  entityType: string; // 'User' | 'Product' | 'Location' | 'Stock' | 'Inventory'
  entityId: string;
  summary: string;
}
export class AuditTrailEntry {
  constructor(
    public readonly id: string,
    public readonly occurredAt: Date,
    public readonly actorUserId: string,
    public readonly actorLogin: string,
    public readonly operation: AuditOperation,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly summary: string,
  ) {}

  static create(input: AuditTrailEntryInput): AuditTrailEntry {
    if (typeof input.actorUserId !== 'string' || input.actorUserId.trim().length === 0) {
      throw new DomainError('Auditoria: actorUserId obrigatório.');
    }
    if (typeof input.actorLogin !== 'string' || input.actorLogin.trim().length === 0) {
      throw new DomainError('Auditoria: actorLogin obrigatório.');
    }
    if (!Object.values(AuditOperation).includes(input.operation)) {
      throw new DomainError('Auditoria: operação inválida.');
    }
    if (typeof input.entityType !== 'string' || input.entityType.trim().length === 0) {
      throw new DomainError('Auditoria: entityType obrigatório.');
    }
    if (typeof input.entityId !== 'string' || input.entityId.trim().length === 0) {
      throw new DomainError('Auditoria: entityId obrigatório.');
    }
    if (typeof input.summary !== 'string' || input.summary.trim().length === 0) {
      throw new DomainError('Auditoria: resumo obrigatório.');
    }

    return new AuditTrailEntry(
      randomUUID(),
      new Date(),
      input.actorUserId,
      input.actorLogin,
      input.operation,
      input.entityType,
      input.entityId,
      input.summary,
    );
  }
}
