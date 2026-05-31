import { AuditTrailEntry } from '../../domain/entities/AuditTrailEntry';
import { AuditOperation } from '../../domain/enums/AuditOperation';
import { IAuditTrailRepository } from '../../domain/repositories/IAuditTrailRepository';
import { AuditTrailRow, JsonDatabase } from '../persistence/JsonDatabase';

/**
 * Persistência da trilha de auditoria em arquivo JSON.
 *
 * Mesmo padrão dos demais JsonFile*Repository: o repositório conhece a
 * entidade do domínio e a "linha" persistida; o domínio nunca conhece o JSON.
 *
 * Listagens são sempre devolvidas em ordem decrescente por `occurredAt`, o que
 * dá ao caller (ex.: `ListAuditTrail`) o resultado já cronologicamente correto
 * sem precisar reordenar duas vezes.
 */
export class JsonFileAuditTrailRepository implements IAuditTrailRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get linhas(): AuditTrailRow[] {
    return this.db.tabela('auditoria');
  }

  private paraRow(e: AuditTrailEntry): AuditTrailRow {
    return {
      id: e.id,
      occurredAt: e.occurredAt.toISOString(),
      actorUserId: e.actorUserId,
      actorLogin: e.actorLogin,
      operation: e.operation,
      entityType: e.entityType,
      entityId: e.entityId,
      summary: e.summary,
    };
  }

  private paraEntidade(r: AuditTrailRow): AuditTrailEntry {
    return new AuditTrailEntry(
      r.id,
      new Date(r.occurredAt),
      r.actorUserId,
      r.actorLogin,
      r.operation as AuditOperation,
      r.entityType,
      r.entityId,
      r.summary,
    );
  }

  private ordenarDesc(itens: AuditTrailEntry[]): AuditTrailEntry[] {
    return [...itens].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async salvar(entry: AuditTrailEntry): Promise<void> {
    this.linhas.push(this.paraRow(entry));
    this.db.salvar();
  }

  async listarTodos(): Promise<AuditTrailEntry[]> {
    return this.ordenarDesc(this.linhas.map((r) => this.paraEntidade(r)));
  }

  async listarPorPeriodo(de: Date, ate: Date): Promise<AuditTrailEntry[]> {
    const desde = de.getTime();
    const ateMs = ate.getTime();
    const filtradas = this.linhas
      .map((r) => this.paraEntidade(r))
      .filter((e) => {
        const t = e.occurredAt.getTime();
        return t >= desde && t <= ateMs;
      });
    return this.ordenarDesc(filtradas);
  }

  async listarPorEntidade(entityType: string, entityId: string): Promise<AuditTrailEntry[]> {
    const filtradas = this.linhas
      .filter((r) => r.entityType === entityType && r.entityId === entityId)
      .map((r) => this.paraEntidade(r));
    return this.ordenarDesc(filtradas);
  }
}
