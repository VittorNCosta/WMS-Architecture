import {
  AuditTrailEntry,
  AuditTrailEntryInput,
} from '../../../domain/entities/AuditTrailEntry';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';

/**
 * Helper compartilhado: grava uma entrada de auditoria sem nunca derrubar o
 * caso de uso chamador.
 *
 * Confiabilidade > Auditoria — se a gravação falhar (I/O, validação, etc.),
 * registramos no log do servidor e seguimos. O caso de uso principal já fez
 * o que precisava (e foi persistido); a auditoria é um efeito colateral.
 */
export async function registerAuditSafely(
  repo: IAuditTrailRepository,
  input: AuditTrailEntryInput,
): Promise<void> {
  try {
    const entry = AuditTrailEntry.criar(input);
    await repo.salvar(entry);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn('[auditoria] falha ao gravar entrada:', msg);
  }
}
