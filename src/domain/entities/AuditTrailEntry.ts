import { randomUUID } from 'node:crypto';
import { AuditOperation } from '../enums/AuditOperation';
import { DomainError } from '../errors/DomainError';

/**
 * Dados de entrada para criar uma entrada da trilha de auditoria.
 * `summary` é uma frase curta legível por humano (ex.: `Usuário "admin" cadastrado.`).
 */
export interface AuditTrailEntryInput {
  actorUserId: string;
  actorLogin: string;
  operation: AuditOperation;
  entityType: string; // 'Usuario' | 'Produto' | 'Localizacao' | 'Estoque' | 'Inventario'
  entityId: string;
  summary: string;
}

/**
 * Registro imutável de uma operação de negócio realizada por um ator.
 *
 * Ao contrário de `Movimentacao` (que descreve mudança de saldo), uma
 * `AuditTrailEntry` descreve a ação em si: quem fez, sobre o quê, quando.
 */
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

  static criar(input: AuditTrailEntryInput): AuditTrailEntry {
    if (typeof input.actorUserId !== 'string' || input.actorUserId.trim().length === 0) {
      throw new DomainError('Auditoria: atorUserId obrigatório.');
    }
    if (typeof input.actorLogin !== 'string' || input.actorLogin.trim().length === 0) {
      throw new DomainError('Auditoria: atorLogin obrigatório.');
    }
    if (!Object.values(AuditOperation).includes(input.operation)) {
      throw new DomainError('Auditoria: operação inválida.');
    }
    if (typeof input.entityType !== 'string' || input.entityType.trim().length === 0) {
      throw new DomainError('Auditoria: tipoEntidade obrigatório.');
    }
    if (typeof input.entityId !== 'string' || input.entityId.trim().length === 0) {
      throw new DomainError('Auditoria: entidadeId obrigatório.');
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
