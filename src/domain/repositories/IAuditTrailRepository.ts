import { AuditTrailEntry } from '../entities/AuditTrailEntry';

/**
 * Persistence contract for the operational audit trail.
 * The concrete implementation lives in `infrastructure/repositories`.
 */
export interface IAuditTrailRepository {
  save(entry: AuditTrailEntry): Promise<void>;
  listAll(): Promise<AuditTrailEntry[]>;
  listByPeriod(from: Date, to: Date): Promise<AuditTrailEntry[]>;
  listByEntity(entityType: string, entityId: string): Promise<AuditTrailEntry[]>;
}
