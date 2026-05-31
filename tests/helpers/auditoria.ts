import { AuditTrailEntry } from '../../src/domain/entities/AuditTrailEntry';
import { IAuditTrailRepository } from '../../src/domain/repositories/IAuditTrailRepository';
import { Actor } from '../../src/application/use-cases/auditoria/Actor';

/** Ator fixo usado nos testes de casos de uso que registram auditoria. */
export const ACTOR_TESTE: Actor = { userId: 'tester-id', login: 'tester' };

/**
 * Implementação em memória de {@link IAuditTrailRepository} para testes.
 * Guarda as entradas gravadas para que os testes possam, se quiserem, inspecioná-las.
 */
export class FakeAuditTrailRepository implements IAuditTrailRepository {
  readonly entradas: AuditTrailEntry[] = [];

  async salvar(entry: AuditTrailEntry): Promise<void> {
    this.entradas.push(entry);
  }

  async listarTodos(): Promise<AuditTrailEntry[]> {
    return [...this.entradas];
  }

  async listarPorPeriodo(de: Date, ate: Date): Promise<AuditTrailEntry[]> {
    return this.entradas.filter(
      (e) => e.occurredAt.getTime() >= de.getTime() && e.occurredAt.getTime() <= ate.getTime(),
    );
  }

  async listarPorEntidade(entityType: string, entityId: string): Promise<AuditTrailEntry[]> {
    return this.entradas.filter((e) => e.entityType === entityType && e.entityId === entityId);
  }
}
