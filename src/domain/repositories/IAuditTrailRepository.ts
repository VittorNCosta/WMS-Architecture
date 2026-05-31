import { AuditTrailEntry } from '../entities/AuditTrailEntry';

/**
 * Contrato de persistência da trilha de auditoria operacional.
 * Implementação concreta vive em `infrastructure/repositories`.
 */
export interface IAuditTrailRepository {
  salvar(entry: AuditTrailEntry): Promise<void>;
  listarTodos(): Promise<AuditTrailEntry[]>;
  listarPorPeriodo(de: Date, ate: Date): Promise<AuditTrailEntry[]>;
  listarPorEntidade(entityType: string, entityId: string): Promise<AuditTrailEntry[]>;
}
