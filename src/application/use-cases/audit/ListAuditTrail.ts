import { AuditTrailEntry } from '../../../domain/entities/AuditTrailEntry';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { AuditTrailEntryDTO, toAuditTrailEntryDTO } from '../../dtos/AuditTrailEntryDTO';

export interface ListAuditTrailFilters {
  from?: Date;
  to?: Date;
  entityType?: string;
  entityId?: string;
}

/**
 * Use case: lists audit trail entries, optionally filtered by entity
 * (`entityType` and/or `entityId`) and/or by time window (`from`/`to`).
 *
 * Filter strategy: pick the most selective repository index available as the
 * base set, then refine in memory. This way every filter also works on its own
 * — `entityType` alone filters by type — and any combination narrows further.
 *   - `entityType` + `entityId`  -> entity index;
 *   - full `from`/`to` window    -> period index;
 *   - otherwise                  -> list everything.
 *
 * The result is always ordered from newest to oldest.
 */
export class ListAuditTrail {
  constructor(private readonly repo: IAuditTrailRepository) {}

  async execute(filters: ListAuditTrailFilters = {}): Promise<AuditTrailEntryDTO[]> {
    const { entityType, entityId, from, to } = filters;
    const hasBothEntity = !!(entityType && entityId);
    const hasFullPeriod = from instanceof Date && to instanceof Date;

    let list: AuditTrailEntry[];
    if (hasBothEntity) {
      list = await this.repo.listByEntity(entityType as string, entityId as string);
    } else if (hasFullPeriod) {
      list = await this.repo.listByPeriod(from as Date, to as Date);
    } else {
      list = await this.repo.listAll();
    }

    // In-memory refinement: each criterion is applied independently, so a lone
    // entityType/entityId narrows the base set even when no index covered it.
    if (entityType) list = list.filter((e) => e.entityType === entityType);
    if (entityId) list = list.filter((e) => e.entityId === entityId);
    if (from instanceof Date) list = list.filter((e) => e.occurredAt.getTime() >= from.getTime());
    if (to instanceof Date) list = list.filter((e) => e.occurredAt.getTime() <= to.getTime());

    return [...list]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .map(toAuditTrailEntryDTO);
  }
}
