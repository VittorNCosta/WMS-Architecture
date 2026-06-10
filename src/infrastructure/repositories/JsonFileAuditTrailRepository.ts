import { AuditTrailEntry } from '../../domain/entities/AuditTrailEntry';
import { AuditOperation } from '../../domain/enums/AuditOperation';
import { IAuditTrailRepository } from '../../domain/repositories/IAuditTrailRepository';
import { AuditTrailRow, JsonDatabase } from '../persistence/JsonDatabase';

/**
 * Audit trail persistence in a JSON file.
 *
 * Same pattern as the other JsonFile*Repository: the repository knows the
 * domain entity and the persisted "row"; the domain never knows the JSON.
 *
 * Listings are always returned in descending order by `occurredAt`, which
 * gives the caller (e.g. `ListAuditTrail`) the chronologically correct result
 * without reordering twice.
 */
export class JsonFileAuditTrailRepository implements IAuditTrailRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get rows(): AuditTrailRow[] {
    return this.db.table('audit');
  }

  private toRow(e: AuditTrailEntry): AuditTrailRow {
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

  private toEntity(r: AuditTrailRow): AuditTrailEntry {
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

  private sortDesc(items: AuditTrailEntry[]): AuditTrailEntry[] {
    return [...items].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async save(entry: AuditTrailEntry): Promise<void> {
    this.rows.push(this.toRow(entry));
    this.db.save();
  }

  async listAll(): Promise<AuditTrailEntry[]> {
    return this.sortDesc(this.rows.map((r) => this.toEntity(r)));
  }

  async listByPeriod(from: Date, to: Date): Promise<AuditTrailEntry[]> {
    const fromMs = from.getTime();
    const toMs = to.getTime();
    const filtered = this.rows
      .map((r) => this.toEntity(r))
      .filter((e) => {
        const t = e.occurredAt.getTime();
        return t >= fromMs && t <= toMs;
      });
    return this.sortDesc(filtered);
  }

  async listByEntity(entityType: string, entityId: string): Promise<AuditTrailEntry[]> {
    const filtered = this.rows
      .filter((r) => r.entityType === entityType && r.entityId === entityId)
      .map((r) => this.toEntity(r));
    return this.sortDesc(filtered);
  }
}
