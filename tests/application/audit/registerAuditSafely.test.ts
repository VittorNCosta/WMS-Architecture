import { describe, it, expect, vi, afterEach } from 'vitest';
import { AuditOperation } from '../../../src/domain/enums/AuditOperation';
import { IAuditTrailRepository } from '../../../src/domain/repositories/IAuditTrailRepository';
import { registerAuditSafely } from '../../../src/application/use-cases/audit/registerAuditSafely';
import { FakeAuditTrailRepository } from '../../helpers/audit';

const input = {
  actorUserId: 'u1',
  actorLogin: 'admin',
  operation: AuditOperation.STATUS_CHANGE,
  entityType: 'User',
  entityId: 'u9',
  summary: 'Usuário "x" inativado.',
};

describe('registerAuditSafely (application helper)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('writes the entry when the repository works', async () => {
    const repo = new FakeAuditTrailRepository();
    await registerAuditSafely(repo, input);
    expect(repo.entries).toHaveLength(1);
    expect(repo.entries[0].entityId).toBe('u9');
  });

  it('swallows the repository failure without propagating an exception (reliability > audit)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const brokenRepo: IAuditTrailRepository = {
      save: async () => {
        throw new Error('disco cheio');
      },
      listAll: async () => [],
      listByPeriod: async () => [],
      listByEntity: async () => [],
    };

    await expect(registerAuditSafely(brokenRepo, input)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
