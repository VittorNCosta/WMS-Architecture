import { describe, it, expect, vi, afterEach } from 'vitest';
import { AuditOperation } from '../../../src/domain/enums/AuditOperation';
import { IAuditTrailRepository } from '../../../src/domain/repositories/IAuditTrailRepository';
import { registerAuditSafely } from '../../../src/application/use-cases/auditoria/registerAuditSafely';
import { FakeAuditTrailRepository } from '../../helpers/auditoria';

const input = {
  actorUserId: 'u1',
  actorLogin: 'admin',
  operation: AuditOperation.STATUS_CHANGE,
  entityType: 'Usuario',
  entityId: 'u9',
  summary: 'Usuário "x" inativado.',
};

describe('registerAuditSafely (helper de aplicação)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('grava a entrada quando o repositório funciona', async () => {
    const repo = new FakeAuditTrailRepository();
    await registerAuditSafely(repo, input);
    expect(repo.entradas).toHaveLength(1);
    expect(repo.entradas[0].entityId).toBe('u9');
  });

  it('engole a falha do repositório sem propagar exceção (confiabilidade > auditoria)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const repoQuebrado: IAuditTrailRepository = {
      salvar: async () => {
        throw new Error('disco cheio');
      },
      listarTodos: async () => [],
      listarPorPeriodo: async () => [],
      listarPorEntidade: async () => [],
    };

    await expect(registerAuditSafely(repoQuebrado, input)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
