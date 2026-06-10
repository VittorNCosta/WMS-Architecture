import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeUserStatus } from '../../../src/application/use-cases/users/ChangeUserStatus';
import { User } from '../../../src/domain/entities/User';
import { UserRole } from '../../../src/domain/enums/UserRole';
import { DomainError } from '../../../src/domain/errors/DomainError';
import { IUserRepository } from '../../../src/domain/repositories/IUserRepository';
import { FakeAuditTrailRepository, TEST_ACTOR } from '../../helpers/audit';

const DUMMY_HASH = '$2a$10$dummyHashForTestsOnlyXXXXXXXXXXXXXXXXXXXXXXXXX';

function createUser(props: { name: string; login: string; role: UserRole }): User {
  return User.create({ ...props, passwordHash: DUMMY_HASH });
}

class InMemoryUserRepo implements IUserRepository {
  private data = new Map<string, User>();

  insert(u: User): void {
    this.data.set(u.id, u);
  }

  async save(u: User): Promise<void> {
    this.data.set(u.id, u);
  }

  async findById(id: string): Promise<User | null> {
    return this.data.get(id) ?? null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const target = login.toLowerCase();
    for (const u of this.data.values()) if (u.login.toLowerCase() === target) return u;
    return null;
  }

  async listAll(): Promise<User[]> {
    return [...this.data.values()];
  }
}

describe('ChangeUserStatus (use case)', () => {
  let repo: InMemoryUserRepo;
  let useCase: ChangeUserStatus;

  beforeEach(() => {
    repo = new InMemoryUserRepo();
    useCase = new ChangeUserStatus(repo, new FakeAuditTrailRepository());
  });

  it('rejects deactivating the only active ADMIN', async () => {
    const admin = createUser({ name: 'A', login: 'a', role: UserRole.ADMIN });
    repo.insert(admin);

    await expect(useCase.execute(admin.id, { active: false }, TEST_ACTOR)).rejects.toThrow(
      'Não é possível inativar o último administrador ativo.',
    );
  });

  it('allows deactivating 1 of 2 active ADMINs', async () => {
    const a1 = createUser({ name: 'A1', login: 'a1', role: UserRole.ADMIN });
    const a2 = createUser({ name: 'A2', login: 'a2', role: UserRole.ADMIN });
    repo.insert(a1);
    repo.insert(a2);

    const r = await useCase.execute(a1.id, { active: false }, TEST_ACTOR);
    expect(r.active).toBe(false);
  });

  it('allows deactivating a STOCK_LEADER even without another admin', async () => {
    const admin = createUser({ name: 'A', login: 'a', role: UserRole.ADMIN });
    const op = createUser({ name: 'O', login: 'o', role: UserRole.STOCK_LEADER });
    repo.insert(admin);
    repo.insert(op);

    const r = await useCase.execute(op.id, { active: false }, TEST_ACTOR);
    expect(r.active).toBe(false);
  });

  it('allows reactivating an inactive user (even without other active admins)', async () => {
    const admin = createUser({ name: 'A', login: 'a', role: UserRole.ADMIN });
    admin.deactivate();
    repo.insert(admin);

    const r = await useCase.execute(admin.id, { active: true }, TEST_ACTOR);
    expect(r.active).toBe(true);
  });

  it('rejects a non-boolean "active"', async () => {
    const u = createUser({ name: 'X', login: 'x', role: UserRole.STOCK_LEADER });
    repo.insert(u);

    await expect(useCase.execute(u.id, { active: 'sim' as unknown }, TEST_ACTOR)).rejects.toThrow(
      DomainError,
    );
  });
});
