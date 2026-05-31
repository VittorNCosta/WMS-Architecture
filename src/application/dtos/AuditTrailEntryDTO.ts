import { AuditTrailEntry } from '../../domain/entities/AuditTrailEntry';

/**
 * DTO de saída da trilha de auditoria (representação pública, serializável como JSON).
 *
 * Convenção: campos expostos ao cliente em pt-BR para manter consistência com
 * os demais endpoints HTTP do sistema.
 */
export interface AuditTrailEntryDTO {
  id: string;
  ocorridoEm: string; // ISO 8601
  atorUserId: string;
  atorLogin: string;
  operacao: string;
  tipoEntidade: string;
  entidadeId: string;
  resumo: string;
}

export function toAuditTrailEntryDTO(entry: AuditTrailEntry): AuditTrailEntryDTO {
  return {
    id: entry.id,
    ocorridoEm: entry.occurredAt.toISOString(),
    atorUserId: entry.actorUserId,
    atorLogin: entry.actorLogin,
    operacao: entry.operation,
    tipoEntidade: entry.entityType,
    entidadeId: entry.entityId,
    resumo: entry.summary,
  };
}
