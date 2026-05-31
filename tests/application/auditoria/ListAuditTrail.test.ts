import { describe, it, expect, beforeEach } from 'vitest';
import { AuditTrailEntry } from '../../../src/domain/entities/AuditTrailEntry';
import { AuditOperation } from '../../../src/domain/enums/AuditOperation';
import { ListAuditTrail } from '../../../src/application/use-cases/auditoria/ListAuditTrail';
import { FakeAuditTrailRepository } from '../../helpers/auditoria';

function entrada(
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

describe('ListAuditTrail (caso de uso)', () => {
  let repo: FakeAuditTrailRepository;
  let caso: ListAuditTrail;

  beforeEach(() => {
    repo = new FakeAuditTrailRepository();
    repo.entradas.push(
      entrada('1', '2026-01-01T10:00:00Z', 'Produto', 'p1'),
      entrada('2', '2026-03-01T10:00:00Z', 'Produto', 'p1'),
      entrada('3', '2026-02-01T10:00:00Z', 'Usuario', 'u9'),
    );
    caso = new ListAuditTrail(repo);
  });

  it('lista tudo, ordenado do mais recente para o mais antigo, como DTO', async () => {
    const r = await caso.executar();
    expect(r.map((e) => e.id)).toEqual(['2', '3', '1']);
    // DTO em pt-BR, sem expor a entidade de domínio
    expect(r[0]).toHaveProperty('ocorridoEm');
    expect(r[0]).toHaveProperty('atorLogin', 'admin');
  });

  it('filtra por entidade (entityType + entityId)', async () => {
    const r = await caso.executar({ entityType: 'Produto', entityId: 'p1' });
    expect(r.map((e) => e.id)).toEqual(['2', '1']);
  });

  it('filtra por período', async () => {
    const r = await caso.executar({
      de: new Date('2026-01-15T00:00:00Z'),
      ate: new Date('2026-02-15T00:00:00Z'),
    });
    expect(r.map((e) => e.id)).toEqual(['3']);
  });

  it('combina filtro de entidade + período', async () => {
    const r = await caso.executar({
      entityType: 'Produto',
      entityId: 'p1',
      de: new Date('2026-02-15T00:00:00Z'),
      ate: new Date('2026-03-15T00:00:00Z'),
    });
    expect(r.map((e) => e.id)).toEqual(['2']);
  });
});
