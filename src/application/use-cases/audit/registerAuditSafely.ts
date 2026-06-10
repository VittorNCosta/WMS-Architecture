import {
  AuditTrailEntry,
  AuditTrailEntryInput,
} from '../../../domain/entities/AuditTrailEntry';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';

/**
 * Shared helper: records an audit entry without ever breaking the calling use
 * case.
 *
 * Reliability > Audit — if the write fails (I/O, validation, etc.), we log it
 * on the server and move on. The main use case already did what it needed (and
 * was persisted); the audit is a side effect.
 */
export async function registerAuditSafely(
  repo: IAuditTrailRepository,
  input: AuditTrailEntryInput,
): Promise<void> {
  try {
    const entry = AuditTrailEntry.create(input);
    await repo.save(entry);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn('[audit] failed to write entry:', msg);
  }
}
