import { AuditTrailEntry } from '../../src/domain/entities/AuditTrailEntry';
import { IAuditTrailRepository } from '../../src/domain/repositories/IAuditTrailRepository';
import { Actor } from '../../src/application/use-cases/audit/Actor';

/** Fixed actor used in use-case tests that record audit entries. */
export const TEST_ACTOR: Actor = { userId: 'tester-id', login: 'tester' };

/**
 * In-memory implementation of {@link IAuditTrailRepository} for tests.
 * Keeps the written entries so that tests can inspect them if they want.
 */
export class FakeAuditTrailRepository implements IAuditTrailRepository {
  readonly entries: AuditTrailEntry[] = [];

  async save(entry: AuditTrailEntry): Promise<void> {
    this.entries.push(entry);
  }

  async listAll(): Promise<AuditTrailEntry[]> {
    return [...this.entries];
  }

  async listByPeriod(from: Date, to: Date): Promise<AuditTrailEntry[]> {
    return this.entries.filter(
      (e) => e.occurredAt.getTime() >= from.getTime() && e.occurredAt.getTime() <= to.getTime(),
    );
  }

  async listByEntity(entityType: string, entityId: string): Promise<AuditTrailEntry[]> {
    return this.entries.filter((e) => e.entityType === entityType && e.entityId === entityId);
  }
}
