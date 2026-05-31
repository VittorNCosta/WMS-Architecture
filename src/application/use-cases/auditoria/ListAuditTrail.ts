import { AuditTrailEntry } from '../../../domain/entities/AuditTrailEntry';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { AuditTrailEntryDTO, toAuditTrailEntryDTO } from '../../dtos/AuditTrailEntryDTO';

export interface ListAuditTrailFilters {
  de?: Date;
  ate?: Date;
  entityType?: string;
  entityId?: string;
}

/**
 * Caso de uso: lista entradas da trilha de auditoria, opcionalmente filtradas
 * por período e/ou por entidade.
 *
 * Estratégia de filtro:
 *   - se vier `entityType` + `entityId`, vai direto no índice por entidade;
 *   - se vier só janela temporal, usa o filtro por período;
 *   - se vier ambos, busca por entidade e depois corta por período em memória;
 *   - sem filtros, lista tudo.
 *
 * Resultado é sempre ordenado do mais recente para o mais antigo.
 */
export class ListAuditTrail {
  constructor(private readonly repo: IAuditTrailRepository) {}

  async executar(filtros: ListAuditTrailFilters = {}): Promise<AuditTrailEntryDTO[]> {
    const temEntidade = !!(filtros.entityType && filtros.entityId);
    const temPeriodo = filtros.de instanceof Date && filtros.ate instanceof Date;

    let lista: AuditTrailEntry[];

    if (temEntidade) {
      lista = await this.repo.listarPorEntidade(
        filtros.entityType as string,
        filtros.entityId as string,
      );
      if (temPeriodo) {
        const de = (filtros.de as Date).getTime();
        const ate = (filtros.ate as Date).getTime();
        lista = lista.filter((e) => {
          const t = e.occurredAt.getTime();
          return t >= de && t <= ate;
        });
      }
    } else if (temPeriodo) {
      lista = await this.repo.listarPorPeriodo(filtros.de as Date, filtros.ate as Date);
    } else {
      lista = await this.repo.listarTodos();
    }

    return [...lista]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .map(toAuditTrailEntryDTO);
  }
}
