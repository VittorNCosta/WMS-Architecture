import { describe, it, expect, beforeEach } from 'vitest';
import { AuditTrailEntry } from '../../../src/domain/entities/AuditTrailEntry';
import { AuditOperation } from '../../../src/domain/enums/AuditOperation';
import { ListAuditTrail } from '../../../src/application/use-cases/audit/ListAuditTrail';
import { FakeAuditTrailRepository } from '../../helpers/audit';

function entry(
  id: string,
  occurredAt: string,
  entityType: string,
  entityId: string,
): AuditTrailEntry {
  return new AuditTrailEntry(
    id,
    new Date(occurredAt),
    'u1',
    'admin',
    AuditOperation.CREATE,
    entityType,
    entityId,
    `${entityType} ${entityId}`,
  );
}

describe('ListAuditTrail (use case)', () => {
  let repo: FakeAuditTrailRepository;
  let useCase: ListAuditTrail;

  beforeEach(() => {
    repo = new FakeAuditTrailRepository();
    repo.entries.push(
      entry('1', '2026-01-01T10:00:00Z', 'Product', 'p1'),
      entry('2', '2026-03-01T10:00:00Z', 'Product', 'p1'),
      entry('3', '2026-02-01T10:00:00Z', 'User', 'u9'),
    );
    useCase = new ListAuditTrail(repo);
  });

  it('lists everything, ordered from newest to oldest, as DTO', async () => {
    const r = await useCase.execute();
    expect(r.map((e) => e.id)).toEqual(['2', '3', '1']);
    // DTO without exposing the domain entity
    expect(r[0]).toHaveProperty('occurredAt');
    expect(r[0]).toHaveProperty('actorLogin', 'admin');
  });

  it('filters by entity (entityType + entityId)', async () => {
    const r = await useCase.execute({ entityType: 'Product', entityId: 'p1' });
    expect(r.map((e) => e.id)).toEqual(['2', '1']);
  });

  it('filters by entityType alone', async () => {
    const r = await useCase.execute({ entityType: 'Product' });
    expect(r.map((e) => e.id)).toEqual(['2', '1']);
  });

  it('filters by entityId alone', async () => {
    const r = await useCase.execute({ entityId: 'u9' });
    expect(r.map((e) => e.id)).toEqual(['3']);
  });

  it('filters by period', async () => {
    const r = await useCase.execute({
      from: new Date('2026-01-15T00:00:00Z'),
      to: new Date('2026-02-15T00:00:00Z'),
    });
    expect(r.map((e) => e.id)).toEqual(['3']);
  });

  it('combines entity + period filters', async () => {
    const r = await useCase.execute({
      entityType: 'Product',
      entityId: 'p1',
      from: new Date('2026-02-15T00:00:00Z'),
      to: new Date('2026-03-15T00:00:00Z'),
    });
    expect(r.map((e) => e.id)).toEqual(['2']);
  });
});
