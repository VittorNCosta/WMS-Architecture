import { describe, it, expect } from 'vitest';
import { User } from '../../src/domain/entities/User';
import { UserRole } from '../../src/domain/enums/UserRole';
import { DomainError } from '../../src/domain/errors/DomainError';
import { LastActiveAdminPolicy } from '../../src/domain/services/LastActiveAdminPolicy';

const HASH = '$2a$10$dummyHashForTestsOnlyXXXXXXXXXXXXXXXXXXXXXXXXX';

function admin(login: string): User {
  return User.create({ name: login, login, role: UserRole.ADMIN, passwordHash: HASH });
}
function stockLeader(login: string): User {
  return User.create({ name: login, login, role: UserRole.STOCK_LEADER, passwordHash: HASH });
}

describe('LastActiveAdminPolicy (domain service)', () => {
  it('throws when deactivating the only active ADMIN', () => {
    const a = admin('a');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a], a.id, 'DEACTIVATE'),
    ).toThrow('Não é possível inativar o último administrador ativo.');
  });

  it('throws when demoting the only active ADMIN (specific message)', () => {
    const a = admin('a');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a], a.id, 'DEMOTE_FROM_ADMIN'),
    ).toThrow('Não é possível remover o perfil ADMIN do último administrador ativo.');
  });

  it('allows when another active ADMIN exists', () => {
    const a1 = admin('a1');
    const a2 = admin('a2');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a1, a2], a1.id, 'DEACTIVATE'),
    ).not.toThrow();
  });

  it('does not count an inactive ADMIN as a remaining active ADMIN', () => {
    const target = admin('alvo');
    const other = admin('outro');
    other.deactivate();
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([target, other], target.id, 'DEACTIVATE'),
    ).toThrow(DomainError);
  });

  it('does not consider a STOCK_LEADER as an administrator', () => {
    const a = admin('a');
    const op = stockLeader('o');
    expect(() =>
      LastActiveAdminPolicy.ensureNotLastActiveAdmin([a, op], a.id, 'DEACTIVATE'),
    ).toThrow(DomainError);
  });
});
