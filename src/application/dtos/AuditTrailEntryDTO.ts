import { AuditTrailEntry } from '../../domain/entities/AuditTrailEntry';

/**
 * Audit trail output DTO (public representation, serializable as JSON).
 */
export interface AuditTrailEntryDTO {
  id: string;
  occurredAt: string; // ISO 8601
  actorUserId: string;
  actorLogin: string;
  operation: string;
  entityType: string;
  entityId: string;
  summary: string;
}

export function toAuditTrailEntryDTO(entry: AuditTrailEntry): AuditTrailEntryDTO {
  return {
    id: entry.id,
    occurredAt: entry.occurredAt.toISOString(),
    actorUserId: entry.actorUserId,
    actorLogin: entry.actorLogin,
    operation: entry.operation,
    entityType: entry.entityType,
    entityId: entry.entityId,
    summary: entry.summary,
  };
}
